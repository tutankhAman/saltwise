import { aiLogger } from "@saltwise/logger";
import { NextResponse } from "next/server";
import {
  createStreamingTts,
  STREAMING_TTS_SAMPLE_RATE,
} from "@/lib/ai/deepgram-streaming";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Maximum characters accepted per streaming request.
 * Deepgram WebSocket supports up to 2000 chars per Speak message.
 */
const MAX_INPUT_LENGTH = 2000;

/** Matches Markdown artefacts that degrade TTS output. */
const MD_CODE_BLOCK_RE = /```[\w-]*\n?([\s\S]*?)```/g;
const MD_HORIZONTAL_RULE_RE = /^[*\-_]{3,}\s*$/gm;
const MD_HEADING_RE = /^#+\s+/gm;
const MD_LIST_BULLET_RE = /^[*-]\s+/gm;
const MD_BLOCKQUOTE_RE = /^>\s+/gm;
const MD_IMAGE_RE = /!\[([^\]]*)\]\([^)]+\)/g;
const MD_LINK_RE = /\[([^\]]+)\]\([^)]+\)/g;
const MD_INLINE_CODE_RE = /`([^`]+)`/g;
const MD_BOLD_RE = /(\*\*|__)(.*?)\1/g;
const MD_ITALIC_RE = /(\*|_)(.*?)\1/g;
const MD_WHITESPACE_RE = /\s+/g;

/**
 * Lightweight Markdown cleanup for TTS. Strips formatting tokens so the
 * synthesized speech doesn't read out "asterisk", "hash", etc.
 */
function cleanTextForTts(text: string): string {
  return text
    .replace(MD_CODE_BLOCK_RE, "$1")
    .replace(MD_HORIZONTAL_RULE_RE, "")
    .replace(MD_HEADING_RE, "")
    .replace(MD_LIST_BULLET_RE, "")
    .replace(MD_BLOCKQUOTE_RE, "")
    .replace(MD_IMAGE_RE, "")
    .replace(MD_LINK_RE, "$1")
    .replace(MD_INLINE_CODE_RE, "$1")
    .replace(MD_BOLD_RE, "$2")
    .replace(MD_ITALIC_RE, "$2")
    .replace(MD_WHITESPACE_RE, " ")
    .trim();
}

/**
 * POST /api/ai/speech/stream
 *
 * Accepts `{ text: string }` and returns a streaming binary response of raw
 * PCM audio (linear16, 24 kHz, mono). The server opens a Deepgram WebSocket,
 * forwards the cleaned text, flushes, and pipes audio chunks back to the
 * client as they arrive.
 *
 * The client can begin playback immediately using an AudioContext, achieving
 * near-zero latency between text availability and audible speech.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    // 1. Authenticate
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    // 2. Parse body
    let body: { text?: string; model?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    const { text, model } = body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json({ error: "Text is required." }, { status: 400 });
    }

    if (text.length > MAX_INPUT_LENGTH) {
      return NextResponse.json(
        { error: `Text must be under ${MAX_INPUT_LENGTH} characters.` },
        { status: 400 }
      );
    }

    // 3. Clean markdown
    const cleaned = cleanTextForTts(text);
    const textToSynthesize =
      cleaned.length > 0 ? cleaned : "No readable content found.";

    aiLogger.info(
      {
        userId: user.id,
        origLength: text.length,
        cleanLength: textToSynthesize.length,
      },
      "Starting streaming TTS via Deepgram WS"
    );

    // 4. Create a ReadableStream that pipes Deepgram WS audio to the client
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const tts = createStreamingTts(
          {
            onAudio(audioChunk: Uint8Array) {
              try {
                controller.enqueue(audioChunk);
              } catch {
                // Controller may be closed if client disconnected
              }
            },
            onFlushed() {
              // All audio for the flushed text has been sent — close the WS
              tts.close();
            },
            onError(error: Error) {
              aiLogger.error({ err: error }, "Streaming TTS error");
              try {
                controller.error(error);
              } catch {
                // Already closed
              }
            },
          },
          model ? { model } : undefined
        );

        tts.ready
          .then(() => {
            tts.sendText(textToSynthesize);
            tts.flush();

            // Close the HTTP stream once the WebSocket is fully closed
            tts.done.then(() => {
              aiLogger.info({ userId: user.id }, "Streaming TTS complete");
              try {
                controller.close();
              } catch {
                // Already closed
              }
            });
          })
          .catch((err: unknown) => {
            aiLogger.error({ err }, "Streaming TTS ready failed");
            try {
              controller.error(
                err instanceof Error ? err : new Error(String(err))
              );
            } catch {
              // Already closed
            }
          });
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "audio/pcm",
        "Transfer-Encoding": "chunked",
        "X-Audio-Sample-Rate": String(STREAMING_TTS_SAMPLE_RATE),
        "X-Audio-Encoding": "linear16",
        "X-Audio-Channels": "1",
        "Cache-Control": "no-cache, no-store",
      },
    });
  } catch (error) {
    aiLogger.error({ err: error }, "Streaming TTS route failed");
    return NextResponse.json(
      { error: "Streaming speech synthesis failed. Please try again." },
      { status: 500 }
    );
  }
}
