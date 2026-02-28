"use client";

import { useState } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListItemNode, ListNode } from "@lexical/list";
import { LinkNode } from "@lexical/link";
import { CodeNode } from "@lexical/code";
import { Minus, Plus } from "lucide-react";

import editorTheme from "@/components/editor/editor-theme";
import Header from "@/components/header";
import EditorCanvas from "@/components/editor/editor-canvas";
import OutlinePanel from "@/components/panels/outline-panel";
import RightPanel from "@/components/panels/right-panel";
import useEditorStore from "@/store/use-editor-store";

const EDITOR_CONFIG = {
  namespace: "ResearchEditor",
  theme: editorTheme,
  onError: (error) => console.error("Lexical error:", error),
  nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode, CodeNode],
};

const ZOOM_LEVELS = [50, 75, 90, 100, 110, 125, 150, 175, 200];

export default function Home() {
  const documentText = useEditorStore((s) => s.documentText);
  const wordCount = documentText.trim()
    ? documentText.trim().split(/\s+/).length
    : 0;

  const [zoom, setZoom] = useState(100);

  const zoomIn = () => {
    const next = ZOOM_LEVELS.find((z) => z > zoom);
    if (next) setZoom(next);
  };

  const zoomOut = () => {
    const prev = [...ZOOM_LEVELS].reverse().find((z) => z < zoom);
    if (prev) setZoom(prev);
  };

  return (
    <LexicalComposer initialConfig={EDITOR_CONFIG}>
      <div className="flex flex-col h-screen bg-background">
        <Header />

        <main className="flex flex-1 overflow-hidden print-main">
          {/* Left Panel: Document Outline */}
          <aside className="w-56 flex-shrink-0 border-r border-border bg-card overflow-hidden flex flex-col print-hide">
            <OutlinePanel />
          </aside>

          {/* Center Panel: Editor canvas */}
          <div className="flex-1 flex flex-col overflow-hidden bg-muted/30 dark:bg-background">
            <div className="flex-1 overflow-auto" id="editor-scroll-area">
              <div className="py-6 px-6 min-w-max">
                <div style={{ zoom: `${zoom}%` }}>
                  <EditorCanvas />
                </div>
              </div>
            </div>

            {/* Status bar */}
            <div className="flex items-center justify-between px-4 py-1 border-t border-border bg-card text-[11px] text-muted-foreground print-hide">
              <span>Ready</span>
              <div className="flex items-center gap-4">
                <span>{wordCount} words</span>
                <span>IEEE Format</span>
                <span>English (US)</span>

                {/* Zoom controls */}
                <div className="flex items-center gap-0.5 border-l border-border pl-4">
                  <button
                    onClick={zoomOut}
                    disabled={zoom <= ZOOM_LEVELS[0]}
                    title="Zoom out"
                    className="h-4 w-4 flex items-center justify-center rounded hover:bg-accent hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  >
                    <Minus className="size-2.5" />
                  </button>
                  <button
                    onClick={() => setZoom(100)}
                    title="Reset zoom to 100%"
                    className="min-w-[38px] text-center tabular-nums hover:text-foreground transition-colors px-0.5"
                  >
                    {zoom}%
                  </button>
                  <button
                    onClick={zoomIn}
                    disabled={zoom >= ZOOM_LEVELS[ZOOM_LEVELS.length - 1]}
                    title="Zoom in"
                    className="h-4 w-4 flex items-center justify-center rounded hover:bg-accent hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  >
                    <Plus className="size-2.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: AI Assistant + IEEE Compliance tabs */}
          <aside className="w-80 flex-shrink-0 border-l border-border bg-card overflow-hidden flex flex-col print-hide">
            <RightPanel />
          </aside>
        </main>
      </div>
    </LexicalComposer>
  );
}
