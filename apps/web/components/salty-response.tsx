"use client";

import { cn } from "@saltwise/ui/lib/utils";
import { BotIcon, UserIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface SaltyResponseProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  avatarUrl?: string | null;
}

function Avatar({
  isUser,
  avatarUrl,
}: {
  isUser: boolean;
  avatarUrl?: string | null;
}) {
  if (!isUser) {
    return <BotIcon className="size-3.5" />;
  }

  if (avatarUrl) {
    return (
      // biome-ignore lint/performance/noImgElement: avatar
      <img
        alt="User avatar"
        className="size-full object-cover"
        height={28}
        referrerPolicy="no-referrer"
        src={avatarUrl}
        width={28}
      />
    );
  }

  return <UserIcon className="size-3.5" />;
}

export function SaltyResponse({
  role,
  content,
  isStreaming,
  avatarUrl,
}: SaltyResponseProps) {
  const isUser = role === "user";

  return (
    <div
      className={cn(
        "flex w-full gap-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div
        className={cn(
          "flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full",
          isUser ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"
        )}
      >
        <Avatar avatarUrl={avatarUrl} isUser={isUser} />
      </div>

      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-2.5 text-left text-sm leading-relaxed",
          isUser
            ? "rounded-br-md bg-primary text-primary-foreground"
            : "rounded-bl-md bg-muted/60 text-foreground"
        )}
      >
        {isUser ? (
          <p>{content}</p>
        ) : (
          <div className="salty-markdown prose prose-sm dark:prose-invert prose-headings:my-2 prose-li:my-0.5 prose-ol:my-1 prose-p:my-1 prose-pre:my-2 prose-ul:my-1 max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            {isStreaming && (
              <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse rounded-full bg-primary/60" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
