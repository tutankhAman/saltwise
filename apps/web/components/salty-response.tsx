"use client";

import { cn } from "@saltwise/ui/lib/utils";
import { BotIcon, UserIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface SaltyResponseProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

export function SaltyResponse({
  role,
  content,
  isStreaming,
}: SaltyResponseProps) {
  const isUser = role === "user";

  return (
    <div className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
      {/* Avatar */}
      <div
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"
        )}
      >
        {isUser ? (
          <UserIcon className="size-3.5" />
        ) : (
          <BotIcon className="size-3.5" />
        )}
      </div>

      {/* Message content */}
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
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
