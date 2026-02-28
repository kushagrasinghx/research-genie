"use client";

import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListItemNode, ListNode } from "@lexical/list";
import { LinkNode } from "@lexical/link";
import { CodeNode } from "@lexical/code";

import editorTheme from "@/components/editor/editor-theme";
import Header from "@/components/header";
import EditorCanvas from "@/components/editor/editor-canvas";
import ViolationsPanel from "@/components/panels/violations-panel";
import ChatPanel from "@/components/panels/chat-panel";
import useEditorStore from "@/store/use-editor-store";

const EDITOR_CONFIG = {
  namespace: "ResearchEditor",
  theme: editorTheme,
  onError: (error) => console.error("Lexical error:", error),
  nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode, CodeNode],
};

export default function Home() {
  const documentText = useEditorStore((s) => s.documentText);
  const wordCount = documentText.trim()
    ? documentText.trim().split(/\s+/).length
    : 0;

  return (
    <LexicalComposer initialConfig={EDITOR_CONFIG}>
      <div className="flex flex-col h-screen bg-background">
        <Header />

        <main className="flex flex-1 overflow-hidden print-main">
          {/* Left Panel: IEEE Violations */}
          <aside className="w-72 flex-shrink-0 border-r border-border bg-card overflow-hidden flex flex-col print-hide">
            <ViolationsPanel />
          </aside>

          {/* Center Panel: Editor canvas */}
          <div className="flex-1 flex flex-col overflow-hidden bg-muted/30 dark:bg-background">
            <div className="flex-1 overflow-auto py-6" id="editor-scroll-area">
              <EditorCanvas />
            </div>

            {/* Status bar */}
            <div className="flex items-center justify-between px-4 py-1 border-t border-border bg-card text-[11px] text-muted-foreground print-hide">
              <span>Ready</span>
              <div className="flex items-center gap-4">
                <span>{wordCount} words</span>
                <span>IEEE Format</span>
                <span>English (US)</span>
              </div>
            </div>
          </div>

          {/* Right Panel: AI Chat */}
          <aside className="w-80 flex-shrink-0 border-l border-border bg-card overflow-hidden flex flex-col print-hide">
            <ChatPanel />
          </aside>
        </main>
      </div>
    </LexicalComposer>
  );
}
