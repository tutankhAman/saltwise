"use client";

import { cn } from "@saltwise/ui/lib/utils";
import { format } from "date-fns";
import { Loader2Icon, PauseIcon, UserIcon, Volume2Icon } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type TtsState = "idle" | "loading" | "playing";

interface SaltyResponseProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  avatarUrl?: string | null;
  createdAt?: string;
  messageId?: string;
  ttsState?: TtsState;
  onTtsToggle?: (messageId: string, text: string) => void;
}

function Avatar({
  isUser,
  avatarUrl,
}: {
  isUser: boolean;
  avatarUrl?: string | null;
}) {
  if (!isUser) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
        {/* biome-ignore lint/performance/noImgElement: salty mascot */}
        <img
          alt="Salty"
          className="size-5 object-contain opacity-90"
          height={20}
          src="/salty.png"
          width={20}
        />
      </div>
    );
  }

  if (avatarUrl) {
    return (
      // biome-ignore lint/performance/noImgElement: avatar
      <img
        alt="User avatar"
        className="size-full object-cover"
        height={32}
        referrerPolicy="no-referrer"
        src={avatarUrl}
        width={32}
      />
    );
  }

  return <UserIcon className="size-4 opacity-70" />;
}

function TtsButton({
  messageId,
  content,
  state,
  onToggle,
}: {
  messageId: string;
  content: string;
  state: TtsState;
  onToggle: (messageId: string, text: string) => void;
}) {
  const isLoading = state === "loading";
  const isPlaying = state === "playing";
  const isActive = isLoading || isPlaying;

  let label = "Read aloud";
  if (isLoading) {
    label = "Loading audio...";
  }
  if (isPlaying) {
    label = "Stop reading";
  }

  return (
    <button
      aria-label={label}
      className={cn(
        "flex size-6 items-center justify-center rounded-full transition-all duration-200",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground/40 hover:bg-primary/5 hover:text-primary"
      )}
      disabled={isLoading}
      onClick={() => onToggle(messageId, content)}
      title={label}
      type="button"
    >
      {isLoading && <Loader2Icon className="size-3 animate-spin" />}
      {isPlaying && <PauseIcon className="size-3 fill-current" />}
      {!isActive && <Volume2Icon className="size-3" />}
    </button>
  );
}

export function SaltyResponse({
  role,
  content,
  isStreaming,
  avatarUrl,
  createdAt,
  messageId,
  ttsState = "idle",
  onTtsToggle,
}: SaltyResponseProps) {
  const isUser = role === "user";
  const showTts =
    !isUser && messageId && onTtsToggle && content.trim().length > 0;

  return (
    <div
      className={cn(
        "group flex w-full gap-4",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div
        className={cn(
          "flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-xl shadow-sm ring-1 ring-inset",
          isUser
            ? "bg-white ring-black/5 dark:bg-zinc-800 dark:ring-white/10"
            : "bg-white ring-primary/20 dark:bg-zinc-900 dark:ring-primary/20"
        )}
      >
        <Avatar avatarUrl={avatarUrl} isUser={isUser} />
      </div>

      <div
        className={cn(
          "flex max-w-[85%] flex-col gap-1",
          isUser ? "items-end" : "items-start"
        )}
      >
        <div className="flex items-center gap-2">
          <span className="font-medium text-[0.65rem] text-foreground/70">
            {isUser ? "You" : "Salty"}
          </span>
          {createdAt && (
            <span className="text-[0.6rem] text-muted-foreground/40">
              {format(new Date(createdAt), "h:mm a")}
            </span>
          )}
        </div>

        <div
          className={cn(
            "relative rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm ring-1 ring-inset backdrop-blur-sm",
            isUser
              ? "rounded-tr-sm bg-gradient-to-br from-primary to-primary/90 text-primary-foreground shadow-primary/10 ring-primary/20"
              : "rounded-tl-sm bg-white/60 text-foreground shadow-black/5 ring-border/50 dark:bg-white/5"
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{content}</p>
          ) : (
            <div className="salty-markdown prose prose-sm dark:prose-invert prose-headings:my-2 prose-li:my-0.5 prose-ol:my-2 prose-p:my-1.5 prose-ul:my-2 max-w-none prose-ul:list-disc prose-ol:pl-4 prose-ul:pl-4 prose-headings:font-heading prose-a:text-primary prose-p:leading-relaxed prose-headings:tracking-tight prose-a:no-underline hover:prose-a:underline">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
              {isStreaming && (
                <span className="ml-1 inline-flex items-baseline">
                  <span className="h-4 w-1.5 animate-pulse rounded-full bg-primary/60" />
                </span>
              )}
            </div>
          )}
        </div>

        {/* TTS play button - appears below the bubble for assistant messages */}
        {showTts && !isStreaming && (
          <TtsButton
            content={content}
            messageId={messageId}
            onToggle={onTtsToggle}
            state={ttsState}
          />
        )}
      </div>
    </div>
  );
}
