"use client";

import { Sparkles } from "lucide-react";

export default function ChatMessage({ message, isStreaming }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[82%] bg-accent text-foreground text-xs leading-relaxed rounded-2xl rounded-tr-sm px-3.5 py-2.5 whitespace-pre-wrap break-words">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2.5 items-start">
      <div className="shrink-0 size-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
        <Sparkles className="size-2.5 text-primary" />
      </div>
      <div className="flex-1 min-w-0 text-xs text-foreground leading-relaxed whitespace-pre-wrap break-words pt-0.5">
        {message.content}
        {isStreaming && !message.content && (
          <span className="inline-flex items-center gap-0.5 h-3">
            <span className="size-1 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:0ms]" />
            <span className="size-1 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:150ms]" />
            <span className="size-1 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:300ms]" />
          </span>
        )}
        {isStreaming && message.content && (
          <span className="inline-block w-0.5 h-3 bg-primary ml-0.5 animate-pulse rounded-full align-middle" />
        )}
      </div>
    </div>
  );
}
