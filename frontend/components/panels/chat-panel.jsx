"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Bot, Sparkles, Loader2, Trash2, AlertTriangle, WifiOff, ServerCrash, Clock } from "lucide-react";
import useChatStore from "@/store/use-chat-store";
import useEditorStore from "@/store/use-editor-store";
import { streamChat } from "@/lib/api";
import ChatMessage from "@/components/chat-message";
import { Kbd } from "@/components/ui/kbd";

/** Parse the raw error string and return { code, title, message } */
function parseError(raw) {
  // Extract numeric HTTP/API code
  const codeMatch = raw.match(/['"]?code['"]?\s*[=:]\s*(\d+)/);
  const code = codeMatch ? parseInt(codeMatch[1], 10) : null;

  // Extract human-readable message field
  const msgMatch = raw.match(/['"]message['"]\s*:\s*['"]([^'"]+)['"]/);
  const detail = msgMatch ? msgMatch[1] : null;

  // Extract status string
  const statusMatch = raw.match(/['"]status['"]\s*:\s*['"]([^'"]+)['"]/);
  const status = statusMatch ? statusMatch[1] : null;

  if (code === 503 || status === "UNAVAILABLE") {
    return {
      icon: Clock,
      title: "Model Temporarily Unavailable",
      message: detail ?? "The AI model is experiencing high demand. Please try again in a moment.",
    };
  }
  if (code === 429) {
    return {
      icon: Clock,
      title: "Rate Limit Reached",
      message: detail ?? "Too many requests. Please wait a moment before trying again.",
    };
  }
  if (code === 500 || code === 502 || code === 504) {
    return {
      icon: ServerCrash,
      title: "Server Error",
      message: detail ?? "Something went wrong on the server. Please try again.",
    };
  }
  if (raw.toLowerCase().includes("network") || raw.toLowerCase().includes("fetch")) {
    return {
      icon: WifiOff,
      title: "Connection Error",
      message: "Could not reach the server. Check your connection and try again.",
    };
  }
  return {
    icon: AlertTriangle,
    title: "Something went wrong",
    message: detail ?? raw,
  };
}

function ChatError({ raw }) {
  const { icon: Icon, title, message } = parseError(raw);
  return (
    <div className="rounded-xl border border-destructive/20 bg-destructive/5 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-destructive/10">
        <Icon className="size-3.5 text-destructive shrink-0" />
        <span className="text-xs font-medium text-destructive">{title}</span>
      </div>
      <p className="text-xs text-destructive/80 px-3 py-2 leading-relaxed">{message}</p>
    </div>
  );
}

export default function ChatPanel({ compact = false }) {
  const messages = useChatStore((s) => s.messages);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const error = useChatStore((s) => s.error);
  const addUserMessage = useChatStore((s) => s.addUserMessage);
  const startAssistantMessage = useChatStore((s) => s.startAssistantMessage);
  const appendToLastMessage = useChatStore((s) => s.appendToLastMessage);
  const finishStreaming = useChatStore((s) => s.finishStreaming);
  const setError = useChatStore((s) => s.setError);
  const clearChat = useChatStore((s) => s.clearChat);
  const getHistory = useChatStore((s) => s.getHistory);
  const documentText = useEditorStore((s) => s.documentText);

  const [input, setInput] = useState("");
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;

    const history = getHistory();
    addUserMessage(trimmed);
    setInput("");
    startAssistantMessage();

    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }

    abortRef.current = await streamChat(
      { message: trimmed, document: documentText, history },
      (token) => appendToLastMessage(token),
      () => finishStreaming(),
      (err) => setError(err),
    );
  }, [
    input,
    isStreaming,
    documentText,
    getHistory,
    addUserMessage,
    startAssistantMessage,
    appendToLastMessage,
    finishStreaming,
    setError,
  ]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e) => {
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header — hidden when rendered inside a tabbed container */}
      {!compact && (
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="size-4 text-primary" />
            <h2 className="text-sm font-medium text-foreground">
              AI Assistant
            </h2>
          </div>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearChat}
              title="Clear chat"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            >
              <Trash2 className="size-3" />
            </Button>
          )}
        </div>
      )}

      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto flex flex-col"
      >
        {messages.length === 0 && !error && (
          <div className="flex-1 flex flex-col items-center justify-center px-5 py-6 text-center">
            <div className="size-11 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent flex items-center justify-center mb-4 ring-1 ring-primary/10">
              <Sparkles className="size-5 text-primary" />
            </div>
            <p className="text-sm font-semibold text-foreground mb-1.5">
              How can I help?
            </p>
            <p className="text-[11px] text-muted-foreground leading-relaxed mb-4">
              Ask me about your document — IEEE compliance, writing style,
              structure, citations, and more.
            </p>
            <div className="flex flex-wrap justify-center gap-1.5">
              {[
                "Check my abstract",
                "Summarize document",
                "Improve clarity",
                "Fix grammar",
              ].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => {
                    setInput(prompt);
                    inputRef.current?.focus();
                  }}
                  className="px-2.5 py-1 rounded-full border border-border bg-background text-[11px] text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {(messages.length > 0 || error) && (
          <div className="p-3 space-y-4">
            {messages.map((msg, i) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                isStreaming={
                  isStreaming &&
                  i === messages.length - 1 &&
                  msg.role === "assistant"
                }
              />
            ))}

            {error && <ChatError raw={error} />}
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="p-3 pt-2 border-t border-border/50 shrink-0">
        <div
          className={`rounded-xl border bg-background transition-all ${
            isStreaming
              ? "border-border opacity-80"
              : "border-border focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10"
          }`}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            placeholder="Ask about your document..."
            rows={1}
            disabled={isStreaming}
            className="w-full resize-none bg-transparent px-3 pt-2.5 pb-1 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none disabled:cursor-not-allowed [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            style={{ minHeight: 38, maxHeight: 120 }}
          />
          <div className="flex items-center justify-end px-2.5 pb-2">
            <button
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              {isStreaming ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <>
                  <Kbd>↵ Enter</Kbd>
                  <span>Send</span>
                </>
              )}
            </button>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground/50 text-center mt-1.5 leading-tight">
          AI Assistant in this editor can make mistakes.
        </p>
      </div>
    </div>
  );
}
