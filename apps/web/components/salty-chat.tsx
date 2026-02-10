"use client";

import type { AuthUser } from "@saltwise/ui/auth/auth-island";
import { AuthIsland } from "@saltwise/ui/auth/auth-island";
import { Loader2Icon, SendIcon, XIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { MAX_MESSAGE_LENGTH } from "@/lib/ai/salty";
import { createClient } from "@/lib/supabase/client";
import { SaltyResponse } from "./salty-response";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface SaltyChatProps {
  initialMessage?: string;
  onClose?: () => void;
}

async function readStream(
  response: Response,
  assistantMessageId: string,
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>
) {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("No response stream");
  }

  const decoder = new TextDecoder();
  let done = false;

  while (!done) {
    const result = await reader.read();
    done = result.done;

    if (result.value) {
      const text = decoder.decode(result.value, { stream: true });
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, content: msg.content + text }
            : msg
        )
      );
    }
  }
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-2 py-4 text-center">
      <p className="font-medium text-muted-foreground text-sm">
        Hi! I&apos;m Salty, your medicine assistant.
      </p>
      <p className="max-w-xs text-muted-foreground/70 text-xs">
        Ask me about medicines, generic alternatives, drug interactions, or
        general health questions.
      </p>
    </div>
  );
}

function ChatError({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  return (
    <div className="rounded-lg bg-destructive/10 px-3 py-2 text-center text-destructive text-xs">
      {message}
      <button
        className="ml-2 underline hover:no-underline"
        onClick={onDismiss}
        type="button"
      >
        Dismiss
      </button>
    </div>
  );
}

export function SaltyChat({ initialMessage, onClose }: SaltyChatProps) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAuthIsland, setShowAuthIsland] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const initiateSignIn = useCallback(async () => {
    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signInError) {
        throw signInError;
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to initiate sign in";
      setError(message);
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();

    const checkUser = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (currentUser) {
        setUser({
          name:
            currentUser.user_metadata?.full_name ?? currentUser.email ?? "User",
          email: currentUser.email ?? "",
          avatarUrl: currentUser.user_metadata?.avatar_url,
        });
      }
      setAuthLoading(false);
    };

    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          name:
            session.user.user_metadata?.full_name ??
            session.user.email ??
            "User",
          email: session.user.email ?? "",
          avatarUrl: session.user.user_metadata?.avatar_url,
        });
        setShowAuthIsland(false);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!authLoading) {
      inputRef.current?.focus();
    }
  }, [authLoading]);

  const hasSentInitialRef = useRef(false);

  // Auto-scroll to bottom when messages update
  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSignOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setChatMessages([]);
    setConversationId(null);
  }, []);

  const sendMessage = useCallback(
    async (overrideMessage?: string) => {
      const trimmedInput = (overrideMessage ?? input).trim();
      if (!trimmedInput || isStreaming) {
        return;
      }

      if (!user) {
        setShowAuthIsland(true);
        return;
      }

      setError(null);
      setInput("");
      setIsStreaming(true);

      const userMessageId = crypto.randomUUID();
      const assistantMessageId = crypto.randomUUID();

      setChatMessages((prev) => [
        ...prev,
        { id: userMessageId, role: "user", content: trimmedInput },
        { id: assistantMessageId, role: "assistant", content: "" },
      ]);

      try {
        abortControllerRef.current = new AbortController();

        const response = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: trimmedInput, conversationId }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ error: "Request failed" }));
          throw new Error(errorData.error ?? `HTTP ${response.status}`);
        }

        const newConversationId = response.headers.get("X-Conversation-Id");
        if (newConversationId) {
          setConversationId(newConversationId);
        }

        await readStream(response, assistantMessageId, setChatMessages);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }

        const errorMessage =
          err instanceof Error ? err.message : "Something went wrong";
        setError(errorMessage);
        setChatMessages((prev) =>
          prev.filter((msg) => msg.id !== assistantMessageId)
        );
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [input, isStreaming, user, conversationId]
  );

  useEffect(() => {
    if (authLoading || hasSentInitialRef.current || !initialMessage) {
      return;
    }
    hasSentInitialRef.current = true;
    sendMessage(initialMessage);
  }, [authLoading, initialMessage, sendMessage]);

  return (
    <div className="flex h-full flex-col">
      {onClose && (
        <div className="flex items-center justify-between border-b px-4 py-2">
          <span className="font-semibold text-sm">Salty Chat</span>
          <button
            aria-label="Close chat"
            className="rounded-full p-1 hover:bg-muted"
            onClick={onClose}
            type="button"
          >
            <XIcon className="size-4" />
          </button>
        </div>
      )}

      {showAuthIsland && (
        // biome-ignore lint/a11y/useKeyWithClickEvents: backdrop dismiss
        // biome-ignore lint/a11y/noNoninteractiveElementInteractions: backdrop dismiss
        // biome-ignore lint/a11y/noStaticElementInteractions: backdrop dismiss
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={() => setShowAuthIsland(false)}
        />
      )}

      <AuthIsland
        loading={false}
        onSignIn={initiateSignIn}
        onSignOut={handleSignOut}
        open={showAuthIsland}
        user={user}
      />

      <div className="max-h-80 space-y-4 overflow-y-auto px-3 py-3">
        {chatMessages.length === 0 && <EmptyState />}

        {chatMessages.map((msg, idx) => (
          <SaltyResponse
            avatarUrl={user?.avatarUrl}
            content={msg.content}
            isStreaming={
              isStreaming &&
              idx === chatMessages.length - 1 &&
              msg.role === "assistant"
            }
            key={msg.id}
            role={msg.role}
          />
        ))}

        {error && (
          <ChatError message={error} onDismiss={() => setError(null)} />
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="flex items-center gap-2 border-border/30 border-t px-3 py-2.5">
        <input
          aria-label="Chat with Salty"
          className="min-w-0 flex-1 bg-transparent text-foreground text-sm outline-none placeholder:text-muted-foreground/50"
          disabled={isStreaming}
          maxLength={MAX_MESSAGE_LENGTH}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder="Ask Salty about medicines..."
          ref={inputRef}
          type="text"
          value={input}
        />
        <button
          aria-label="Send message"
          className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all hover:bg-primary/80 disabled:opacity-40"
          disabled={isStreaming || input.trim().length === 0}
          onClick={() => sendMessage()}
          type="button"
        >
          {isStreaming ? (
            <Loader2Icon className="size-3.5 animate-spin" />
          ) : (
            <SendIcon className="size-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}
