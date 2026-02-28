"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getRoot } from "lexical";
import useEditorStore from "@/store/use-editor-store";
import { Kbd } from "@/components/ui/kbd";

export function ClickableLinkPlugin() {
  const [editor] = useLexicalComposerContext();
  const [tooltip, setTooltip] = useState(null); // { url, x, y } | null
  const rafRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const anchor = e.target.closest("a[href]");
      if (!anchor) return;
      e.preventDefault();
      e.stopPropagation();
      setTooltip(null);
      window.open(anchor.href, "_blank", "noopener,noreferrer");
    };

    const handleMouseMove = (e) => {
      const anchor = e.target.closest("a[href]");
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (!anchor) {
        rafRef.current = requestAnimationFrame(() => setTooltip(null));
        return;
      }
      const url = anchor.getAttribute("href") || anchor.href;
      const x = e.clientX;
      const y = e.clientY;
      rafRef.current = requestAnimationFrame(() => setTooltip({ url, x, y }));
    };

    const handleMouseLeave = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      setTooltip(null);
    };

    const unregister = editor.registerRootListener(
      (rootElement, prevRootElement) => {
        if (prevRootElement) {
          prevRootElement.removeEventListener("click", handleClick);
          prevRootElement.removeEventListener("mousemove", handleMouseMove);
          prevRootElement.removeEventListener("mouseleave", handleMouseLeave);
        }
        if (rootElement) {
          rootElement.addEventListener("click", handleClick);
          rootElement.addEventListener("mousemove", handleMouseMove);
          rootElement.addEventListener("mouseleave", handleMouseLeave);
        }
      },
    );

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      unregister();
      const root = editor.getRootElement();
      if (root) {
        root.removeEventListener("click", handleClick);
        root.removeEventListener("mousemove", handleMouseMove);
        root.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, [editor]);

  if (!tooltip || typeof window === "undefined") return null;

  return createPortal(
    <div
      className="fixed z-[9999] flex flex-col gap-1.5 rounded-md border border-border bg-popover shadow-lg px-2.5 py-2 pointer-events-none"
      style={{ left: tooltip.x + 14, top: tooltip.y + 18, maxWidth: 300 }}
    >
      <span className="text-xs text-foreground truncate">{tooltip.url}</span>
      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
        <Kbd>Ctrl</Kbd>
        <span>+</span>
        <Kbd>Click</Kbd>
        <span>to open in a new tab</span>
      </div>
    </div>,
    document.body,
  );
}

export function OnChangePlugin() {
  const [editor] = useLexicalComposerContext();
  const setDocumentText = useEditorStore((state) => state.setDocumentText);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const root = $getRoot();
        const text = root.getTextContent();
        setDocumentText(text);
      });
    });
  }, [editor, setDocumentText]);

  return null;
}

export function EditorRefPlugin() {
  const [editor] = useLexicalComposerContext();
  const setEditorInstance = useEditorStore((state) => state.setEditorInstance);

  useEffect(() => {
    setEditorInstance(editor);
  }, [editor, setEditorInstance]);

  return null;
}
