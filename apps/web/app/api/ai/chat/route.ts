import { db } from "@saltwise/db";
import { conversations, messages } from "@saltwise/db/schema";
import { aiLogger, createRequestLogger } from "@saltwise/logger";
import { and, desc, eq, gt } from "drizzle-orm";
import Groq from "groq-sdk";
import { NextResponse } from "next/server";
import type { Logger } from "pino";
import {
  createSaltyStream,
  MAX_MESSAGE_LENGTH,
  RATE_LIMIT_PER_MINUTE,
} from "@/lib/ai/salty";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function errorResponse(
  message: string,
  status: number,
  headers?: Record<string, string>
) {
  return NextResponse.json({ error: message }, { status, headers });
}

async function authenticateUser() {
  const supabase = await createClient();
  return supabase.auth.getUser();
}

async function checkRateLimit(userId: string): Promise<boolean> {
  const oneMinuteAgo = new Date(Date.now() - 60_000);
  const recentMessages = await db
    .select({ id: messages.id })
    .from(messages)
    .innerJoin(conversations, eq(messages.conversationId, conversations.id))
    .where(
      and(
        eq(conversations.userId, userId),
        eq(messages.role, "user"),
        gt(messages.createdAt, oneMinuteAgo)
      )
    );
  return recentMessages.length >= RATE_LIMIT_PER_MINUTE;
}

async function getOrCreateConversation(
  userId: string,
  conversationId: string | undefined,
  message: string,
  log: Logger
): Promise<string | null> {
  if (conversationId) {
    const existing = await db
      .select({ id: conversations.id })
      .from(conversations)
      .where(
        and(
          eq(conversations.id, conversationId),
          eq(conversations.userId, userId)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      log.warn({ conversationId }, "Conversation not found or not owned");
      return null;
    }
    return conversationId;
  }

  const title = message.slice(0, 100);
  const [newConversation] = await db
    .insert(conversations)
    .values({ userId, title })
    .returning({ id: conversations.id });

  if (!newConversation) {
    log.error("Failed to create conversation");
    return null;
  }

  log.info({ conversationId: newConversation.id }, "New conversation created");
  return newConversation.id;
}

async function fetchConversationHistory(conversationId: string) {
  const history = await db
    .select({
      role: messages.role,
      content: messages.content,
    })
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(desc(messages.createdAt))
    .limit(20);

  // Reverse so oldest messages come first, remove last (the one we just inserted)
  const ordered = history.reverse().map((msg) => ({
    role: msg.role as "user" | "assistant",
    content: msg.content,
  }));
  ordered.pop();
  return ordered;
}

function saveAssistantResponse(
  conversationId: string,
  fullResponse: Promise<{ text: string; truncated: boolean }>,
  log: Logger
) {
  fullResponse
    .then(async ({ text: content, truncated }) => {
      if (content.length === 0) {
        log.warn({ conversationId }, "Empty response from Groq");
        return;
      }
      try {
        await db.insert(messages).values({
          conversationId,
          role: "assistant" as const,
          content: truncated ? `${content}\n\n[Response interrupted]` : content,
        });
        log.debug(
          { conversationId, responseLength: content.length, truncated },
          "Assistant message saved"
        );
      } catch (error) {
        log.error({ err: error }, "Failed to save assistant message");
      }
    })
    .catch((error) => {
      log.error({ err: error }, "Error awaiting full response");
    });
}

function handleGroqError(error: unknown): Response {
  if (error instanceof Groq.RateLimitError) {
    return errorResponse(
      "Salty is busy right now. Please try again in a moment.",
      429,
      { "Retry-After": "30" }
    );
  }
  if (error instanceof Groq.APIConnectionError) {
    return errorResponse(
      "Salty is temporarily unavailable. Please try again later.",
      503
    );
  }
  if (error instanceof Groq.APIError) {
    return errorResponse("Something went wrong. Please try again.", 500);
  }
  return errorResponse("An unexpected error occurred.", 500);
}

/**
 * POST /api/ai/chat
 * Streams a response from Salty (Groq LLM) for authenticated users.
 * Persists both user and assistant messages to the database.
 */
export async function POST(request: Request): Promise<Response> {
  const requestId = crypto.randomUUID();

  try {
    // 1. Authenticate
    const {
      data: { user },
      error: authError,
    } = await authenticateUser();

    if (authError || !user) {
      aiLogger.warn(
        { requestId, error: authError?.message },
        "Unauthenticated chat request"
      );
      return errorResponse(
        "Authentication required. Please sign in to chat with Salty.",
        401
      );
    }

    const log = createRequestLogger(requestId, user.id);

    // 2. Parse and validate request body
    let body: { message?: string; conversationId?: string };
    try {
      body = await request.json();
    } catch {
      log.warn("Invalid JSON in request body");
      return errorResponse("Invalid request body", 400);
    }

    const { message, conversationId } = body;

    if (
      !message ||
      typeof message !== "string" ||
      message.trim().length === 0
    ) {
      log.warn("Empty message in chat request");
      return errorResponse("Message is required", 400);
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      log.warn({ length: message.length }, "Message exceeds max length");
      return errorResponse(
        `Message must be under ${MAX_MESSAGE_LENGTH} characters`,
        400
      );
    }

    // 3. Rate limiting
    if (await checkRateLimit(user.id)) {
      log.warn("Rate limit exceeded");
      return errorResponse(
        "Slow down! You're sending too many messages. Try again in a moment.",
        429,
        { "Retry-After": "60" }
      );
    }

    // 4. Get or create conversation
    const activeConversationId = await getOrCreateConversation(
      user.id,
      conversationId,
      message,
      log
    );

    if (!activeConversationId) {
      return conversationId
        ? errorResponse("Conversation not found", 404)
        : errorResponse("Failed to create conversation", 500);
    }

    // 5. Save the user's message
    let saved = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await db.insert(messages).values({
          conversationId: activeConversationId,
          role: "user" as const,
          content: message.trim(),
        });
        log.debug(
          { conversationId: activeConversationId },
          "User message saved"
        );
        saved = true;
        break;
      } catch (error) {
        if (attempt === 3) {
          log.error(
            { err: error, attempt },
            "Failed to save user message after retries"
          );
        } else {
          log.warn(
            { err: error, attempt },
            "Failed to save user message, retrying..."
          );
          await new Promise((resolve) => setTimeout(resolve, 100 * attempt));
        }
      }
    }

    if (!saved) {
      return errorResponse("Failed to save message. Please try again.", 500);
    }

    // 6. Fetch conversation history
    const orderedHistory = await fetchConversationHistory(activeConversationId);

    // 7. Stream from Groq
    log.info(
      {
        conversationId: activeConversationId,
        historyCount: orderedHistory.length,
      },
      "Starting Salty stream"
    );

    const { stream, fullResponse } = await createSaltyStream(
      orderedHistory,
      message.trim(),
      request.signal
    );

    // 8. Save the assistant response when stream completes (fire-and-forget)
    saveAssistantResponse(activeConversationId, fullResponse, log);

    // 9. Return stream with conversation ID in headers
    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "X-Conversation-Id": activeConversationId,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    aiLogger.error({ err: error, requestId }, "Unhandled error in chat route");
    return handleGroqError(error);
  }
}
