"use client";

import type { AuthUser } from "@saltwise/ui/auth/auth-island";
import { AuthIsland } from "@saltwise/ui/auth/auth-island";
import { cn } from "@saltwise/ui/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2Icon, MicIcon, SquareIcon, Volume2Icon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useChatMessages } from "@/hooks/use-ai-chat";
import { useChatStore } from "@/hooks/use-chat-store";
import { useTts } from "@/hooks/use-tts";
import { useStreamingTts } from "@/hooks/use-tts-stream";
import { useVoiceRecorder } from "@/hooks/use-voice-recorder";
import { MAX_MESSAGE_LENGTH } from "@/lib/ai/salty";
import { createClient } from "@/lib/supabase/client";
import { SaltyResponse } from "../salty-response";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
}

async function readStream(
  response: Response,
  assistantMessageId: string,
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
  onToken?: (token: string) => void
): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("No response stream");
  }

  const decoder = new TextDecoder();
  let done = false;
  let fullText = "";

  while (!done) {
    const result = await reader.read();
    done = result.done;

    if (result.value) {
      const text = decoder.decode(result.value, { stream: true });
      fullText += text;
      onToken?.(text);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, content: msg.content + text }
            : msg
        )
      );
    }
  }

  return fullText;
}

function formatElapsed(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      {/* Salty Avatar */}
      <div className="relative mb-2 flex size-20 items-center justify-center rounded-2xl bg-primary/10 shadow-inner">
        {/* biome-ignore lint/performance/noImgElement: salty mascot */}
        {/** biome-ignore lint/correctness/useImageSize: skip */}
        <img
          alt="Salty"
          className="size-12 object-contain drop-shadow-sm"
          src="/salty.png"
        />
        <div className="absolute inset-0 rounded-2xl ring-1 ring-primary/20 ring-inset" />
      </div>

      <div className="space-y-1">
        <h3 className="font-heading font-semibold text-lg tracking-tight">
          Hi! I&apos;m Salty.
        </h3>
        <p className="max-w-70 text-muted-foreground text-sm">
          Your personal medicine assistant. Ask me about generics, interactions,
          or health tips.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {[
          "What is Dolo 650 used for?",
          "Interactions between Pan 40 and alcohol?",
          "Cheaper alternative to Augmentin?",
        ].map((suggestion) => (
          <button
            className="rounded-full border border-border/60 bg-white/50 px-3 py-1.5 text-xs transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary dark:bg-white/5"
            key={suggestion}
            // Add click handler to populate input if desired
            type="button"
          >
            {suggestion}
          </button>
        ))}
      </div>
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
    <div className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-destructive text-sm shadow-sm">
      <span>{message}</span>
      <button
        className="ml-4 font-medium text-xs underline hover:text-destructive/80 hover:no-underline"
        onClick={onDismiss}
        type="button"
      >
        Dismiss
      </button>
    </div>
  );
}

export function ChatInterface() {
  const {
    activeConversationId,
    initialMessage,
    setActiveConversation,
    setInitialMessage,
  } = useChatStore();
  const queryClient = useQueryClient();
  const { data: historyMessages, isLoading: isHistoryLoading } =
    useChatMessages(activeConversationId);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAuthIsland, setShowAuthIsland] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastAssistantIdRef = useRef<string | null>(null);

  // --- TTS hook (for manual toggle on completed messages) ---
  const {
    toggle: ttsToggle,
    getState: ttsGetState,
    stopAll: ttsStopAll,
  } = useTts({
    onError: (msg) => setError(msg),
  });

  // --- Streaming TTS hook (for real-time auto-read during LLM streaming) ---
  const streamingTts = useStreamingTts({
    onError: (msg) => setError(msg),
  });

  // --- Voice recorder hook ---
  const voiceRecorder = useVoiceRecorder({
    onTranscription: (text) => {
      sendMessage(text);
    },
    onError: (msg) => setError(msg),
  });

  const isRecording = voiceRecorder.state === "recording";
  const isTranscribing = voiceRecorder.state === "transcribing";
  const isVoiceBusy = isRecording || isTranscribing;

  // Sync with history when it changes (e.g. switching conversations)
  useEffect(() => {
    if (activeConversationId && historyMessages) {
      setChatMessages(historyMessages);
    } else if (!activeConversationId) {
      setChatMessages([]);
    }
  }, [activeConversationId, historyMessages]);

  // Auth check
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

  // Auto-scroll
  // biome-ignore lint/correctness/useExhaustiveDependencies: skip
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isStreaming]);

  const handleSignOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setChatMessages([]);
    setActiveConversation(null);
  }, [setActiveConversation]);

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
      streamingTts.stop();
    }
  }, [streamingTts]);

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
      lastAssistantIdRef.current = assistantMessageId;

      // Start streaming TTS session so tokens can be fed as they arrive
      // Stop any existing manual TTS playback first
      ttsStopAll();
      streamingTts.startSession();

      // Optimistic update
      setChatMessages((prev) => [
        ...prev,
        {
          id: userMessageId,
          role: "user",
          content: trimmedInput,
          createdAt: new Date().toISOString(),
        },
        {
          id: assistantMessageId,
          role: "assistant",
          content: "",
          createdAt: new Date().toISOString(),
        },
      ]);

      try {
        abortControllerRef.current = new AbortController();

        const response = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: trimmedInput,
            conversationId: activeConversationId || undefined,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ error: "Request failed" }));
          throw new Error(errorData.error ?? `HTTP ${response.status}`);
        }

        const newConversationId = response.headers.get("X-Conversation-Id");

        // If we started a new conversation, update store and invalidate list
        if (newConversationId && newConversationId !== activeConversationId) {
          setActiveConversation(newConversationId);
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
        }

        // Read stream with token callback that feeds streaming TTS in real-time
        await readStream(
          response,
          assistantMessageId,
          setChatMessages,
          (token) => streamingTts.feedToken(token)
        );

        // Signal that all LLM tokens have arrived — flush remaining buffered text
        streamingTts.flushAndFinish();

        // After stream ends, invalidate messages to ensure we have the DB state
        if (newConversationId) {
          queryClient.invalidateQueries({
            queryKey: ["messages", newConversationId],
          });
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          streamingTts.stop();
          return;
        }

        const errorMessage =
          err instanceof Error ? err.message : "Something went wrong";
        setError(errorMessage);
        streamingTts.stop();
        setChatMessages((prev) =>
          prev.filter((msg) => msg.id !== assistantMessageId)
        );
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
        // Focus input after sending
        setTimeout(() => inputRef.current?.focus(), 0);
      }
    },
    [
      input,
      isStreaming,
      user,
      activeConversationId,
      queryClient,
      setActiveConversation,
      ttsStopAll,
      streamingTts,
    ]
  );

  // Handle initial message from store (e.g. from QuickSearch)
  useEffect(() => {
    if (!authLoading && initialMessage && !activeConversationId) {
      sendMessage(initialMessage);
      setInitialMessage(null); // Clear it so we don't send again
    }
  }, [
    authLoading,
    initialMessage,
    activeConversationId,
    sendMessage,
    setInitialMessage,
  ]);

  const showSuggestions = !(input || isStreaming || isVoiceBusy);
  const inputDisabled = isStreaming || isVoiceBusy;

  let micButtonLabel = "Start voice recording";
  if (isRecording) {
    micButtonLabel = "Stop recording";
  } else if (isTranscribing) {
    micButtonLabel = "Transcribing audio";
  }

  return (
    <div className="relative flex h-full flex-col bg-white dark:bg-black">
      {/* Background Gradient Mesh */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden opacity-30">
        <div className="absolute top-0 right-0 size-125 translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[100px]" />
        <div className="absolute bottom-0 left-0 size-125 -translate-x-1/2 translate-y-1/2 rounded-full bg-accent/10 blur-[100px]" />
      </div>

      {showAuthIsland && (
        // biome-ignore lint/a11y/useKeyWithClickEvents: backdrop dismiss
        // biome-ignore lint/a11y/noNoninteractiveElementInteractions: backdrop dismiss
        // biome-ignore lint/a11y/noStaticElementInteractions: backdrop dismiss
        <div
          className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
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

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {chatMessages.length === 0 && !isHistoryLoading && <EmptyState />}

          {isHistoryLoading && chatMessages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground/50">
              <Loader2Icon className="size-8 animate-spin" />
              <span className="text-xs uppercase tracking-wider">
                Loading History...
              </span>
            </div>
          )}

          {chatMessages.map((msg, idx) => (
            <SaltyResponse
              avatarUrl={user?.avatarUrl}
              content={msg.content}
              createdAt={msg.createdAt}
              isStreaming={
                isStreaming &&
                idx === chatMessages.length - 1 &&
                msg.role === "assistant"
              }
              key={msg.id}
              messageId={msg.id}
              onTtsToggle={ttsToggle}
              role={msg.role}
              ttsState={ttsGetState(msg.id)}
            />
          ))}

          {error && (
            <div className="mx-auto max-w-md">
              <ChatError message={error} onDismiss={() => setError(null)} />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-border/40 border-t bg-white/40 p-3 backdrop-blur-xl sm:p-4 dark:bg-black/40">
        <div className="mx-auto max-w-2xl">
          {/* Quick Suggestions */}
          {showSuggestions && (
            <div className="no-scrollbar scrollbar-none mb-3 flex gap-2 overflow-x-auto pb-1">
              {[
                "Side effects of Dolo 650",
                "Cheaper alternative to Pan 40",
                "Is it safe to take paracetamol with alcohol?",
                "Interactions of Metformin",
              ].map((suggestion) => (
                <button
                  className="whitespace-nowrap rounded-full border border-primary/10 bg-primary/5 px-3 py-1 text-[0.65rem] text-primary/80 transition-colors hover:border-primary/20 hover:bg-primary/10 hover:text-primary"
                  key={suggestion}
                  onClick={() => sendMessage(suggestion)}
                  type="button"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          <div
            className={cn(
              "group relative flex items-center gap-2 rounded-2xl border bg-white shadow-sm transition-all duration-300 dark:bg-white/3",
              isRecording && "border-red-400/50 ring-2 ring-red-400/15",
              !isRecording &&
                isTranscribing &&
                "border-amber-400/50 ring-2 ring-amber-400/10",
              !(isRecording || isTranscribing) &&
                isStreaming &&
                "border-primary/30 ring-2 ring-primary/5",
              !(isRecording || isTranscribing || isStreaming) &&
                "border-border/50 focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10 hover:border-primary/20 hover:shadow-md"
            )}
          >
            {/* Recording State Overlay */}
            {isRecording && (
              <div className="flex flex-1 items-center gap-3 py-3 pl-4">
                <span aria-hidden="true" className="relative flex size-2.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-red-500" />
                </span>
                <span className="text-red-600 text-sm dark:text-red-400">
                  Recording...
                </span>
                <output
                  aria-label={`Recording time: ${formatElapsed(voiceRecorder.elapsed)}`}
                  className="font-mono text-muted-foreground text-xs tabular-nums"
                >
                  {formatElapsed(voiceRecorder.elapsed)}
                </output>
                {/* Animated waveform bars */}
                <div aria-hidden="true" className="flex items-center gap-0.5">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <span
                      className="w-0.5 rounded-full bg-red-400/60"
                      key={i}
                      style={{
                        height: `${8 + Math.sin(Date.now() / 200 + i * 1.2) * 6}px`,
                        animation: `salty-wave 0.8s ease-in-out ${i * 0.1}s infinite alternate`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Transcribing State */}
            {isTranscribing && (
              <div className="flex flex-1 items-center gap-3 py-3 pl-4">
                <Loader2Icon className="size-4 animate-spin text-amber-500" />
                <span className="text-amber-600 text-sm dark:text-amber-400">
                  Transcribing your voice...
                </span>
              </div>
            )}

            {/* Normal Input */}
            {!(isRecording || isTranscribing) && (
              <input
                className="flex-1 bg-transparent py-3 pl-4 text-sm outline-none placeholder:text-muted-foreground/60"
                disabled={inputDisabled}
                maxLength={MAX_MESSAGE_LENGTH}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Ask Salty anything about medicines..."
                ref={inputRef}
                value={input}
              />
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-1 pr-2">
              {/* Mic Button */}
              {voiceRecorder.isSupported && (
                <button
                  aria-label={micButtonLabel}
                  aria-pressed={isRecording}
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full transition-all duration-200",
                    isRecording &&
                      "bg-red-500 text-white shadow-md shadow-red-500/25 hover:bg-red-600",
                    !isRecording &&
                      isTranscribing &&
                      "cursor-wait text-amber-500",
                    !(isRecording || isTranscribing) &&
                      "text-muted-foreground/60 hover:bg-muted/50 hover:text-foreground"
                  )}
                  disabled={isTranscribing || isStreaming}
                  onClick={voiceRecorder.toggleRecording}
                  type="button"
                >
                  {isRecording ? (
                    <SquareIcon className="size-3 fill-current" />
                  ) : (
                    <MicIcon className="size-4" />
                  )}
                </button>
              )}

              {/* Send / Stop Button */}
              {!isRecording && (
                <button
                  aria-label={isStreaming ? "Stop generating" : "Send message"}
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full transition-all duration-300",
                    input.trim().length > 0 || isStreaming
                      ? "shadow-lg hover:scale-105 hover:shadow-primary/25"
                      : "cursor-not-allowed opacity-50 grayscale"
                  )}
                  disabled={
                    !isStreaming && (input.trim().length === 0 || isVoiceBusy)
                  }
                  onClick={() => {
                    if (isStreaming) {
                      stopGeneration();
                    } else {
                      sendMessage();
                    }
                  }}
                  type="button"
                >
                  {isStreaming ? (
                    // biome-ignore lint/performance/noImgElement: static asset
                    // biome-ignore lint/correctness/useImageSize: skip
                    <img
                      alt="Stop"
                      className="size-12"
                      src="/landing-assets/pill-squircle.webp"
                    />
                  ) : (
                    // biome-ignore lint/performance/noImgElement: static asset
                    // biome-ignore lint/correctness/useImageSize: skip
                    <img
                      alt="Send"
                      className="size-10"
                      src="/landing-assets/pill-triangle.webp"
                    />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Footer row: disclaimer + auto-read toggle */}
          <div className="mt-2 flex items-center justify-between">
            <p className="text-[0.6rem] text-muted-foreground/50">
              Salty is an AI assistant and can make mistakes. Please verify
              important medical information.
            </p>

            {/* Auto-read toggle */}
            <button
              aria-label={
                streamingTts.autoRead
                  ? "Disable auto-read responses"
                  : "Enable auto-read responses"
              }
              aria-pressed={streamingTts.autoRead}
              className={cn(
                "ml-3 flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[0.6rem] transition-all duration-200",
                streamingTts.autoRead
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-border/40 text-muted-foreground/50 hover:border-border/60 hover:text-muted-foreground/70"
              )}
              onClick={streamingTts.toggleAutoRead}
              type="button"
            >
              <Volume2Icon className="size-3" />
              <span>Auto-read</span>
            </button>
          </div>
        </div>
      </div>

      {/* CSS animation for waveform bars */}
      <style>{`
        @keyframes salty-wave {
          0% { height: 4px; }
          100% { height: 16px; }
        }
      `}</style>
    </div>
  );
}
