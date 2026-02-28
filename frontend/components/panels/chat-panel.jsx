"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Bot, Sparkles, Send, Loader2, Trash2, AlertTriangle } from "lucide-react";
import useChatStore from "@/store/use-chat-store";
import useEditorStore from "@/store/use-editor-store";
import { streamChat } from "@/lib/api";
import ChatMessage from "@/components/chat-message";

export default function ChatPanel() {
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
      {/* Header */}
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

      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto flex flex-col"
      >
        {messages.length === 0 && !error && (
          <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <Sparkles className="size-5 text-primary/50" />
            </div>
            <p className="text-xs font-medium text-foreground mb-1">
              AI Research Assistant
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Ask me anything about your document. I can help with IEEE
              compliance, writing improvements, structure, and more.
            </p>
            <div className="flex flex-wrap justify-center gap-1.5 mt-3">
              {[
                "Check my abstract",
                "Summarize document",
                "Improve clarity",
                "Fix grammar issues",
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
          <div className="p-3 space-y-3">
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

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 dark:bg-red-500/5 border border-red-500/20 dark:border-red-500/10">
                <AlertTriangle className="size-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="p-3 border-t border-border">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            placeholder="Ask about your document..."
            rows={1}
            disabled={isStreaming}
            className="flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/50 disabled:opacity-50 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            style={{ minHeight: 36, maxHeight: 120 }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className="shrink-0 p-2 text-muted-foreground hover:text-primary disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            {isStreaming ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
