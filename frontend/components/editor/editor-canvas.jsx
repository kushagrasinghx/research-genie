"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import usePageStore from "@/store/use-page-store";
import ResearchEditor from "./research-editor";

const PAGE_GAP = 24;

export default function EditorCanvas() {
  const [editor] = useLexicalComposerContext();
  const contentRef = useRef(null);
  const [pageCount, setPageCount] = useState(1);
  const pageSize = usePageStore((s) => s.pageSize);
  const margins = usePageStore((s) => s.margins);
  const rafRef = useRef(null);
  const isComputingRef = useRef(false);

  const usableHeight = pageSize.height - margins.top - margins.bottom;
  const deadZone = margins.bottom + PAGE_GAP + margins.top;

  const computePageBreaks = useCallback(() => {
    if (isComputingRef.current) return;
    isComputingRef.current = true;

    try {
      const contentEl = contentRef.current;
      if (!contentEl || usableHeight <= 0) {
        setPageCount(1);
        return;
      }

      const editable = contentEl.querySelector('[contenteditable="true"]');
      if (!editable) {
        setPageCount(1);
        return;
      }

      const children = Array.from(editable.children);
      if (children.length === 0) {
        setPageCount(1);
        return;
      }

      // Clean up any leftover spacers from the removed PageBreakPlugin
      for (const child of children) {
        if (child.hasAttribute("data-page-break-spacer")) {
          child.style.marginTop = "";
          child.removeAttribute("data-page-break-spacer");
        }
      }

      const editableRect = editable.getBoundingClientRect();

      // stride = distance between the start of one page's content area and
      // the next.  In editable coordinates this equals pageHeight + PAGE_GAP
      // because:  usableHeight + deadZone = (H-mt-mb) + (mb+GAP+mt) = H+GAP.
      const stride = usableHeight + deadZone;

      // ── Pass 1: Read all positions and derive clean (spacer-free) positions ──
      // Instead of clearing spacers and reflowing (which causes jitter), we
      // mathematically subtract accumulated spacer offsets to recover natural
      // layout positions.  Clean positions are stable regardless of what
      // spacers are currently applied, so the algorithm converges in one pass.
      const items = [];
      let accExistingSpacers = 0;

      for (const child of children) {
        const rect = child.getBoundingClientRect();
        const rawTop = rect.top - editableRect.top;
        const rawHeight = rect.height;

        // Read the spacer height we previously set via CSS custom property
        const existingSpacer = child.dataset.pageBreak
          ? parseFloat(
              child.style.getPropertyValue("--page-break-height"),
            ) || 0
          : 0;

        // Clean position = measured position minus all spacers above
        const cleanTop = rawTop - accExistingSpacers;
        // Clean height = measured height minus this element's own ::before spacer
        const cleanHeight = rawHeight - existingSpacer;

        accExistingSpacers += existingSpacer;

        items.push({ element: child, cleanTop, cleanHeight, existingSpacer });
      }

      // ── Pass 2: Compute spacers using actual-position tracking ──
      //
      // We track a running total of new spacers.  For each element we compute
      // its *actual* target position (cleanTop + totalNewSpacers) and check
      // whether it falls within a page's content area or its dead zone.
      //
      // Actual page layout in editable coordinates:
      //   Page P content area : [P*stride, P*stride + usableHeight)
      //   Page P dead zone    : [P*stride + usableHeight, (P+1)*stride)
      //
      // Two cases need spacers:
      //   1. Element top lands in a dead zone  → push to next page start
      //   2. Element crosses from content area into dead zone (and fits on
      //      one page) → push to next page start

      let totalNewSpacers = 0;
      let maxPageIndex = 0;

      for (const { element, cleanTop, cleanHeight, existingSpacer } of items) {
        if (cleanHeight <= 0) continue;

        const actualTop = cleanTop + totalNewSpacers;
        const actualBottom = actualTop + cleanHeight;

        const pageIndex = Math.floor(Math.max(0, actualTop) / stride);
        const contentEnd = pageIndex * stride + usableHeight;
        const nextContentStart = (pageIndex + 1) * stride;

        let newSpacer = 0;

        if (actualTop > contentEnd - 0.5 && actualTop < nextContentStart) {
          // Case 1: Element top is in the dead zone → push to next page
          newSpacer = nextContentStart - actualTop;
        } else if (
          actualBottom > contentEnd + 0.5 &&
          actualTop + 0.5 < contentEnd &&
          cleanHeight <= usableHeight
        ) {
          // Case 2: Element crosses into dead zone, small enough to move
          newSpacer = nextContentStart - actualTop;
        }

        totalNewSpacers += newSpacer;

        // Track page count from the element's effective position
        const effectiveBottom = actualTop + newSpacer + cleanHeight;
        const bottomPage =
          effectiveBottom > 0.5
            ? Math.floor((effectiveBottom - 0.5) / stride)
            : 0;
        if (bottomPage > maxPageIndex) maxPageIndex = bottomPage;

        // Only touch the DOM if the spacer value actually changed
        if (Math.abs(newSpacer - existingSpacer) > 0.5) {
          if (newSpacer > 0) {
            element.dataset.pageBreak = "1";
            element.style.setProperty(
              "--page-break-height",
              `${newSpacer}px`,
            );
          } else {
            element.style.removeProperty("--page-break-height");
            delete element.dataset.pageBreak;
          }
        }
      }

      setPageCount(Math.max(1, maxPageIndex + 1));
    } finally {
      isComputingRef.current = false;
    }
  }, [usableHeight, deadZone]);

  // Schedule computation helper
  const scheduleCompute = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(computePageBreaks);
  }, [computePageBreaks]);

  // Recalculate on every editor update
  useEffect(() => {
    const unregister = editor.registerUpdateListener(scheduleCompute);
    return () => {
      unregister();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [editor, scheduleCompute]);

  // Recalculate on content resize (page-size / margin changes)
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const observer = new ResizeObserver(scheduleCompute);
    observer.observe(el);
    return () => observer.disconnect();
  }, [scheduleCompute]);

  // Initial calculation
  useEffect(() => {
    rafRef.current = requestAnimationFrame(computePageBreaks);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [computePageBreaks]);

  const totalHeight =
    pageCount * pageSize.height + (pageCount - 1) * PAGE_GAP;

  const handleCanvasClick = (e) => {
    if (e.target === contentRef.current) {
      editor.focus();
    }
  };

  return (
    <div
      className="mx-auto relative"
      style={{ width: pageSize.width, minHeight: totalHeight }}
    >
      {/* Page card backgrounds */}
      {Array.from({ length: pageCount }).map((_, i) => (
        <div
          key={i}
          className="absolute left-0 right-0 bg-card shadow-lg border border-border/50 rounded-sm print-hide page-card-bg"
          style={{
            top: i * (pageSize.height + PAGE_GAP),
            height: pageSize.height,
          }}
        />
      ))}

      {/* Content layer */}
      <div
        ref={contentRef}
        className="relative z-[1] cursor-text"
        id="editor-content"
        onClick={handleCanvasClick}
        style={{
          paddingLeft: margins.left,
          paddingRight: margins.right,
          paddingTop: margins.top,
          paddingBottom: margins.bottom,
          minHeight: pageSize.height,
        }}
      >
        <ResearchEditor />
      </div>

      {/* Page break gap overlays */}
      {Array.from({ length: pageCount - 1 }).map((_, i) => {
        const gapTop = (i + 1) * pageSize.height + i * PAGE_GAP;
        return (
          <div
            key={`gap-${i}`}
            className="absolute z-[2] pointer-events-none print-hide"
            style={{
              left: -32,
              right: -32,
              top: gapTop,
              height: PAGE_GAP,
              background: "var(--background)",
            }}
          >
            <div
              className="absolute inset-x-8 top-0 h-px"
              style={{ background: "var(--border)" }}
            />
            <div
              className="absolute inset-x-8 bottom-0 h-px"
              style={{ background: "var(--border)" }}
            />
          </div>
        );
      })}
    </div>
  );
}
