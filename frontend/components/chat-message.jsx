"use client";

import { Sparkles, User } from "lucide-react";

export default function ChatMessage({ message, isStreaming }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}>
      {/* Avatar for assistant */}
      {!isUser && (
        <div className="shrink-0 size-6 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
          <Sparkles className="size-3 text-primary" />
        </div>
      )}

      {/* Bubble */}
      <div
        className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
          isUser
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-muted text-foreground rounded-bl-sm"
        }`}
      >
        <div className="whitespace-pre-wrap break-words">
          {message.content}
          {isStreaming && !message.content && (
            <span className="inline-flex gap-0.5">
              <span className="size-1 bg-current rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="size-1 bg-current rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="size-1 bg-current rounded-full animate-bounce [animation-delay:300ms]" />
            </span>
          )}
          {isStreaming && message.content && (
            <span className="inline-block w-1.5 h-3.5 bg-current ml-0.5 animate-pulse rounded-sm align-middle" />
          )}
        </div>
      </div>

      {/* Avatar for user */}
      {isUser && (
        <div className="shrink-0 size-6 rounded-full bg-muted flex items-center justify-center mt-0.5">
          <User className="size-3 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
