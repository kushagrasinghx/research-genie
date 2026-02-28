"use client";

import { useEffect, useRef, useCallback } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import usePageStore from "@/store/use-page-store";

const PAGE_GAP = 24;
const SPACER_ATTR = "data-page-break-spacer";

export default function PageBreakPlugin() {
  const [editor] = useLexicalComposerContext();
  const pageSize = usePageStore((s) => s.pageSize);
  const margins = usePageStore((s) => s.margins);
  const rafRef = useRef(null);

  const adjustPageBreaks = useCallback(() => {
    const rootElement = editor.getRootElement();
    if (!rootElement) return;

    const usableHeight = pageSize.height - margins.top - margins.bottom;
    const pageStride = pageSize.height + PAGE_GAP;

    // Phase 1: Clear all previous spacer margins
    const blocks = Array.from(rootElement.children);
    for (const block of blocks) {
      if (block.hasAttribute(SPACER_ATTR)) {
        block.style.marginTop = "";
        block.removeAttribute(SPACER_ATTR);
      }
    }

    // Phase 2: Force reflow so we read natural positions
    void rootElement.offsetHeight;

    // Phase 3: Read all natural positions (single read pass)
    const positions = blocks.map((block) => ({
      block,
      naturalTop: block.offsetTop,
      height: block.offsetHeight,
    }));

    // Phase 4: Calculate and apply spacers (single write pass)
    let addedSpacing = 0;

    for (const { block, naturalTop, height } of positions) {
      const effectiveTop = naturalTop + addedSpacing;
      const effectiveBottom = effectiveTop + height;

      // Determine which page this block's top falls on
      const pageIndex = Math.floor(effectiveTop / pageStride);
      const pageContentEnd =
        pageIndex * pageStride + pageSize.height - margins.bottom;
      const nextPageContentStart = (pageIndex + 1) * pageStride + margins.top;

      let spacer = 0;

      if (effectiveTop >= pageContentEnd) {
        // Case 1: Block top is in the dead zone — push to next page
        spacer = nextPageContentStart - effectiveTop;
      } else if (
        effectiveBottom > pageContentEnd &&
        height <= usableHeight
      ) {
        // Case 2: Block starts in content area but its bottom crosses into
        // the dead zone, and the block is small enough to fit on one page —
        // push the whole block to the next page (like "keep lines together")
        spacer = nextPageContentStart - effectiveTop;
      }

      if (spacer > 0) {
        block.style.marginTop = `${spacer}px`;
        block.setAttribute(SPACER_ATTR, "true");
        addedSpacing += spacer;
      }
    }
  }, [editor, pageSize, margins]);

  useEffect(() => {
    const rootElement = editor.getRootElement();
    if (!rootElement) return;

    const scheduleAdjust = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(adjustPageBreaks);
    };

    // Listen for DOM mutations in the editor (typing, new blocks, etc.)
    const observer = new MutationObserver(scheduleAdjust);
    observer.observe(rootElement, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    // Also adjust on Lexical editor state updates
    const removeListener = editor.registerUpdateListener(() => {
      scheduleAdjust();
    });

    // Initial adjustment
    scheduleAdjust();

    return () => {
      observer.disconnect();
      removeListener();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [editor, adjustPageBreaks]);

  return null;
}
