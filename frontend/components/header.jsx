"use client";

import { useState, useRef, useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { UNDO_COMMAND, REDO_COMMAND } from "lexical";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  FileCheck,
  Save,
  FileText,
  Loader2,
  Download,
  FileDown,
  Undo2,
  Redo2,
} from "lucide-react";
import ThemeToggle from "@/components/theme-toggle";
import Toolbar from "@/components/editor/toolbar";
import useEditorStore from "@/store/use-editor-store";
import useViolationsStore from "@/store/use-violations-store";
import usePageStore from "@/store/use-page-store";
import { checkIEEE } from "@/lib/api";

export default function Header() {
  const [editor] = useLexicalComposerContext();
  const documentText = useEditorStore((state) => state.documentText);
  const saveStatus = useEditorStore((state) => state.saveStatus);
  const saveSnapshot = useEditorStore((state) => state.saveSnapshot);

  const violationsLoading = useViolationsStore((state) => state.isLoading);
  const setViolations = useViolationsStore((state) => state.setViolations);
  const setViolationsLoading = useViolationsStore((state) => state.setLoading);
  const setViolationsError = useViolationsStore((state) => state.setError);
  const setActiveRightTab = useViolationsStore(
    (state) => state.setActiveRightTab,
  );

  const [docTitle, setDocTitle] = useState("Untitled Document");
  const [editingTitle, setEditingTitle] = useState(false);
  const titleInputRef = useRef(null);

  const handleTitleClick = () => {
    setEditingTitle(true);
    setTimeout(() => {
      titleInputRef.current?.select();
    }, 0);
  };

  const handleTitleBlur = () => {
    setEditingTitle(false);
    if (!docTitle.trim()) setDocTitle("Untitled Document");
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === "Enter") titleInputRef.current?.blur();
    if (e.key === "Escape") {
      setEditingTitle(false);
      if (!docTitle.trim()) setDocTitle("Untitled Document");
    }
  };

  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const exportRef = useRef(null);

  useEffect(() => {
    const handleMouseDown = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setShowExportDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  const handleCheckIEEE = async () => {
    if (!documentText.trim()) return;
    setViolationsLoading(true);
    setActiveRightTab("ieee");
    try {
      const data = await checkIEEE(documentText);
      setViolations(data.violations);
      saveSnapshot();
    } catch (err) {
      setViolationsError(err.message);
    }
  };

  const handleSave = () => {
    if (!documentText.trim()) return;
    saveSnapshot();
  };

  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    setShowExportDropdown(false);
    if (isExporting) return;
    setIsExporting(true);

    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const pageSize = usePageStore.getState().pageSize;
      const margins = usePageStore.getState().margins;

      const editorContent = document.getElementById("editor-content");
      if (!editorContent) {
        setIsExporting(false);
        return;
      }

      const clone = editorContent.cloneNode(true);
      clone.style.padding = "0";
      clone.style.minHeight = "auto";
      clone.style.position = "static";
      clone.style.zIndex = "auto";
      clone.style.width = "auto";

      // Strip page-break spacers injected by the editor canvas
      clone.querySelectorAll("[data-page-break]").forEach((el) => {
        el.removeAttribute("data-page-break");
        el.style.removeProperty("--page-break-height");
      });
      // Strip any leftover margin-based spacers from old plugin
      clone.querySelectorAll("[data-page-break-spacer]").forEach((el) => {
        el.removeAttribute("data-page-break-spacer");
        el.style.marginTop = "";
      });

      const wrapper = document.createElement("div");
      wrapper.style.background = "white";
      wrapper.style.color = "black";
      wrapper.appendChild(clone);

      // html2canvas has its own CSS parser that cannot handle modern color
      // functions (oklch, lab, oklab, lch).  We need to:
      //   1. Pre-resolve all CSS custom properties to rgb
      //   2. Use the onclone callback to sanitize the cloned document's
      //      stylesheets before html2canvas's parser sees them.

      // Force-convert any color string to rgb via canvas pixel-read.
      const cvs = document.createElement("canvas");
      cvs.width = cvs.height = 1;
      const ctx2d = cvs.getContext("2d", { willReadFrequently: true });

      const toRgb = (value) => {
        if (
          !value ||
          value === "transparent" ||
          value === "rgba(0, 0, 0, 0)"
        )
          return "transparent";
        if (value.startsWith("rgb(") || value.startsWith("rgba("))
          return value;
        ctx2d.clearRect(0, 0, 1, 1);
        ctx2d.fillStyle = "#000";
        ctx2d.fillStyle = value;
        ctx2d.fillRect(0, 0, 1, 1);
        const d = ctx2d.getImageData(0, 0, 1, 1).data;
        return d[3] < 255
          ? `rgba(${d[0]},${d[1]},${d[2]},${+(d[3] / 255).toFixed(3)})`
          : `rgb(${d[0]},${d[1]},${d[2]})`;
      };

      // Resolve CSS custom properties to rgb ahead of time.
      const rootCS = getComputedStyle(document.documentElement);
      const colorVars = [
        "--background",
        "--foreground",
        "--card",
        "--card-foreground",
        "--popover",
        "--popover-foreground",
        "--primary",
        "--primary-foreground",
        "--secondary",
        "--secondary-foreground",
        "--muted",
        "--muted-foreground",
        "--accent",
        "--accent-foreground",
        "--destructive",
        "--border",
        "--input",
        "--ring",
      ];
      const resolvedVars = {};
      for (const v of colorVars) {
        const raw = rootCS.getPropertyValue(v).trim();
        if (raw) resolvedVars[v] = toRgb(raw);
      }

      // Also set them on the wrapper so they cascade into the clone tree.
      for (const [v, rgb] of Object.entries(resolvedVars)) {
        wrapper.style.setProperty(v, rgb);
      }

      const widthIn = pageSize.width / 96;
      const heightIn = pageSize.height / 96;
      const mTop = margins.top / 96;
      const mRight = margins.right / 96;
      const mBottom = margins.bottom / 96;
      const mLeft = margins.left / 96;

      const opt = {
        margin: [mTop, mRight, mBottom, mLeft],
        filename: `${docTitle.trim() || "Untitled Document"}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          letterRendering: true,
          onclone: (clonedDoc) => {
            // Strip modern color functions from all <style> elements so
            // html2canvas's own CSS parser never encounters them.
            const colorFnRe =
              /(?:oklch|oklab|lab|lch|color)\([^)]*\)/g;
            for (const s of clonedDoc.querySelectorAll("style")) {
              s.textContent = s.textContent.replace(
                colorFnRe,
                "rgb(0,0,0)",
              );
            }
            // Override CSS custom properties on root with pre-resolved
            // rgb values so var(--x) references are safe.
            const root = clonedDoc.documentElement;
            for (const [v, rgb] of Object.entries(resolvedVars)) {
              root.style.setProperty(v, rgb);
            }
          },
        },
        jsPDF: {
          unit: "in",
          format: [widthIn, heightIn],
          orientation: "portrait",
        },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] },
      };

      await html2pdf().set(opt).from(wrapper).save();
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <header className="relative z-50 border-b border-border bg-card print-hide">
      {/* Top bar — app title */}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2.5">
          <FileText className="size-4 text-primary" />
          <h1 className="text-sm font-semibold text-foreground">
            ResearchGenie
          </h1>

          {/* Undo / Redo */}
          <div className="flex items-center gap-0.5">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
            title="Undo (Ctrl+Z)"
            className="inline-flex items-center justify-center h-6 w-6 rounded-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <Undo2 className="size-3.5" />
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
            title="Redo (Ctrl+Y)"
            className="inline-flex items-center justify-center h-6 w-6 rounded-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <Redo2 className="size-3.5" />
          </button>
          </div>

          <Separator orientation="vertical" className="h-4" />
          {editingTitle ? (
            <input
              ref={titleInputRef}
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={handleTitleKeyDown}
              className="text-xs text-foreground bg-transparent border-b border-primary outline-none w-40 px-0.5"
            />
          ) : (
            <span
              onClick={handleTitleClick}
              title="Click to rename"
              className="text-xs text-muted-foreground hover:text-foreground cursor-text hover:border-b hover:border-dashed hover:border-muted-foreground transition-colors"
            >
              {docTitle}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="text-[10px] h-5 gap-1 font-normal capitalize"
          >
            {saveStatus}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            disabled={!documentText.trim()}
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            title="Save snapshot"
          >
            <Save className="size-3.5" />
          </Button>

          {/* Export dropdown */}
          <div className="relative" ref={exportRef}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              disabled={!documentText.trim()}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
              title="Export"
            >
              <Download className="size-3.5" />
            </Button>
            {showExportDropdown && (
              <div className="absolute top-full right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-50 w-44 py-1">
                <button
                  onClick={handleExportPDF}
                  disabled={isExporting}
                  className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-xs text-foreground hover:bg-accent dark:hover:bg-accent disabled:opacity-50"
                >
                  {isExporting ? (
                    <Loader2 className="size-3.5 text-muted-foreground animate-spin" />
                  ) : (
                    <FileDown className="size-3.5 text-muted-foreground" />
                  )}
                  {isExporting ? "Exporting..." : "Export as PDF"}
                </button>
              </div>
            )}
          </div>

          <Separator orientation="vertical" className="h-4" />
          <ThemeToggle />
        </div>
      </div>

      {/* Ribbon bar — formatting toolbar + action buttons */}
      <div className="flex items-start gap-2 px-3 py-1.5 border-t border-border/50 bg-muted/30 dark:bg-card/50">
        {/* Formatting toolbar (tabbed) */}
        <div className="flex-1 min-w-0"><Toolbar /></div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 shrink-0 pt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCheckIEEE}
            disabled={violationsLoading || !documentText.trim()}
            className="h-7 px-2.5 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
          >
            {violationsLoading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <FileCheck className="size-3.5" />
            )}
            {violationsLoading ? "Checking..." : "Check IEEE"}
          </Button>

        </div>
      </div>
    </header>
  );
}
