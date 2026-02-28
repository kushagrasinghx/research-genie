"use client";

import { useEffect, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getRoot } from "lexical";
import { $isHeadingNode } from "@lexical/rich-text";
import { List, AlignLeft } from "lucide-react";

const TAG_STYLES = {
  h1: {
    indent: "pl-2",
    text: "text-xs font-semibold text-foreground",
    dot: "size-1.5 rounded-full bg-primary/70 shrink-0",
  },
  h2: {
    indent: "pl-5",
    text: "text-xs text-foreground",
    dot: "size-1 rounded-full bg-muted-foreground/50 shrink-0",
  },
  h3: {
    indent: "pl-8",
    text: "text-[11px] text-muted-foreground",
    dot: "size-1 rounded-sm bg-muted-foreground/30 shrink-0",
  },
};

export default function OutlinePanel() {
  const [editor] = useLexicalComposerContext();
  const [headings, setHeadings] = useState([]);
  const [activeKey, setActiveKey] = useState(null);

  useEffect(() => {
    const extract = () => {
      const items = [];
      editor.getEditorState().read(() => {
        const root = $getRoot();
        for (const child of root.getChildren()) {
          if ($isHeadingNode(child)) {
            const text = child.getTextContent().trim();
            if (text) {
              items.push({ key: child.getKey(), tag: child.getTag(), text });
            }
          }
        }
      });
      setHeadings(items);
    };

    extract();
    return editor.registerUpdateListener(extract);
  }, [editor]);

  const handleClick = (key) => {
    setActiveKey(key);
    const el = editor.getElementByKey(key);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-border flex items-center gap-1.5 shrink-0">
        <List className="size-3.5 text-muted-foreground shrink-0" />
        <h2 className="text-xs font-medium text-foreground">Outline</h2>
        {headings.length > 0 && (
          <span className="ml-auto text-[10px] text-muted-foreground">
            {headings.length} heading{headings.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {headings.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-4 text-center select-none">
            <AlignLeft className="size-6 text-muted-foreground/25 mb-4" />
            <p className="text-xs font-medium text-foreground mb-1">
              No Outlines
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Add some content in your document and headings will appear here for easy navigation.
            </p>
          </div>
        ) : (
          <div className="py-2 px-1.5">
            {headings.map((h) => {
              const style = TAG_STYLES[h.tag] ?? TAG_STYLES.h3;
              const isActive = h.key === activeKey;
              return (
                <button
                  key={h.key}
                  onClick={() => handleClick(h.key)}
                  title={h.text}
                  className={`w-full flex items-center gap-2 text-left py-1 px-1.5 rounded-sm transition-colors group ${style.indent} ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-accent"
                  }`}
                >
                  <span className={style.dot} />
                  <span
                    className={`truncate leading-snug ${isActive ? "text-primary" : style.text}`}
                  >
                    {h.text}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
