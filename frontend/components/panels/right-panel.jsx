"use client";

import { Bot, FileCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import useViolationsStore from "@/store/use-violations-store";
import useChatStore from "@/store/use-chat-store";
import ChatPanel from "./chat-panel";
import ViolationsPanel from "./violations-panel";

const severityMeta = {
  error: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  warning:
    "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
  info: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
};

export default function RightPanel() {
  const activeTab = useViolationsStore((s) => s.activeRightTab);
  const setActiveTab = useViolationsStore((s) => s.setActiveRightTab);
  const violations = useViolationsStore((s) => s.violations);

  const messages = useChatStore((s) => s.messages);
  const clearChat = useChatStore((s) => s.clearChat);

  const errorCount = violations.filter((v) => v.severity === "error").length;
  const warningCount = violations.filter(
    (v) => v.severity === "warning",
  ).length;
  const infoCount = violations.filter((v) => v.severity === "info").length;

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex shrink-0 border-b border-border">
        <button
          onClick={() => setActiveTab("assistant")}
          className={`flex flex-1 items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors ${
            activeTab === "assistant"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Bot className="size-3.5 shrink-0" />
          AI Assistant
        </button>

        <button
          onClick={() => setActiveTab("ieee")}
          className={`flex flex-1 items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors ${
            activeTab === "ieee"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileCheck className="size-3.5 shrink-0" />
          IEEE
          {violations.length > 0 && (
            <span className="flex items-center gap-0.5 ml-0.5">
              {errorCount > 0 && (
                <Badge
                  variant="outline"
                  className={`text-[9px] h-3.5 px-1 font-normal leading-none ${severityMeta.error}`}
                >
                  {errorCount}
                </Badge>
              )}
              {warningCount > 0 && (
                <Badge
                  variant="outline"
                  className={`text-[9px] h-3.5 px-1 font-normal leading-none ${severityMeta.warning}`}
                >
                  {warningCount}
                </Badge>
              )}
              {infoCount > 0 && (
                <Badge
                  variant="outline"
                  className={`text-[9px] h-3.5 px-1 font-normal leading-none ${severityMeta.info}`}
                >
                  {infoCount}
                </Badge>
              )}
            </span>
          )}
        </button>
      </div>

      {/* Secondary action bar — only for AI tab when there are messages */}
      {activeTab === "assistant" && messages.length > 0 && (
        <div className="flex items-center justify-end px-3 py-1 border-b border-border/40 bg-muted/20 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearChat}
            title="Clear chat"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
          >
            <Trash2 className="size-3" />
          </Button>
        </div>
      )}

      {/* Content — both kept mounted to preserve scroll / collapsed state */}
      <div
        className={`flex-1 min-h-0 overflow-hidden flex flex-col ${
          activeTab === "assistant" ? "" : "hidden"
        }`}
      >
        <ChatPanel compact />
      </div>
      <div
        className={`flex-1 min-h-0 overflow-hidden flex flex-col ${
          activeTab === "ieee" ? "" : "hidden"
        }`}
      >
        <ViolationsPanel compact />
      </div>
    </div>
  );
}
