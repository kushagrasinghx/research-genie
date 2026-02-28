"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
  $isRootOrShadowRoot,
  $createParagraphNode,
} from "lexical";
import { $setBlocksType } from "@lexical/selection";
import {
  $createHeadingNode,
  $createQuoteNode,
  $isHeadingNode,
} from "@lexical/rich-text";
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
  $isListNode,
} from "@lexical/list";
import { TOGGLE_LINK_COMMAND, $isLinkNode } from "@lexical/link";
import { $findMatchingParent } from "@lexical/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import usePageStore, {
  PAGE_SIZES,
  MARGIN_PRESETS,
} from "@/store/use-page-store";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Superscript,
  Subscript,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo2,
  Redo2,
  Pilcrow,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Code,
  RemoveFormatting,
  ChevronDown,
  Link,
  ExternalLink,
  Trash2,
  Maximize2,
  IndentDecrease,
} from "lucide-react";

const BLOCK_TYPE_TO_NAME = {
  paragraph: "Normal",
  h1: "Heading 1",
  h2: "Heading 2",
  h3: "Heading 3",
  bullet: "Bulleted List",
  number: "Numbered List",
  quote: "Quote",
};

const FONT_FAMILIES = [
  { label: "Default", value: "" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Times New Roman", value: "'Times New Roman', serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Courier New", value: "'Courier New', monospace" },
  { label: "Verdana", value: "Verdana, sans-serif" },
  { label: "Garamond", value: "Garamond, serif" },
  { label: "Trebuchet MS", value: "'Trebuchet MS', sans-serif" },
  {
    label: "Palatino",
    value: "'Palatino Linotype', 'Book Antiqua', Palatino, serif",
  },
  { label: "Cambria", value: "Cambria, serif" },
  { label: "Calibri", value: "Calibri, sans-serif" },
];

const FONT_SIZES = [
  "10px",
  "11px",
  "12px",
  "13px",
  "14px",
  "15px",
  "16px",
  "18px",
  "20px",
  "24px",
  "28px",
  "32px",
  "36px",
  "48px",
  "64px",
];

export default function Toolbar() {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isCode, setIsCode] = useState(false);
  const [isSuperscript, setIsSuperscript] = useState(false);
  const [isSubscript, setIsSubscript] = useState(false);
  const [isLink, setIsLink] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [blockType, setBlockType] = useState("paragraph");
  const [fontFamily, setFontFamily] = useState("");
  const [fontSize, setFontSize] = useState("15px");
  const [showFontFamilyDropdown, setShowFontFamilyDropdown] = useState(false);
  const [showFontSizeDropdown, setShowFontSizeDropdown] = useState(false);
  const [showPageSizeDropdown, setShowPageSizeDropdown] = useState(false);
  const [showMarginDropdown, setShowMarginDropdown] = useState(false);
  const [showLinkPopover, setShowLinkPopover] = useState(false);
  const [linkInput, setLinkInput] = useState("");
  const fontFamilyRef = useRef(null);
  const fontSizeRef = useRef(null);
  const pageSizeRef = useRef(null);
  const marginRef = useRef(null);
  const linkRef = useRef(null);

  const pageSizeKey = usePageStore((s) => s.pageSizeKey);
  const marginKey = usePageStore((s) => s.marginKey);
  const setPageSize = usePageStore((s) => s.setPageSize);
  const setMargins = usePageStore((s) => s.setMargins);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat("bold"));
      setIsItalic(selection.hasFormat("italic"));
      setIsUnderline(selection.hasFormat("underline"));
      setIsStrikethrough(selection.hasFormat("strikethrough"));
      setIsCode(selection.hasFormat("code"));
      setIsSuperscript(selection.hasFormat("superscript"));
      setIsSubscript(selection.hasFormat("subscript"));

      const style = selection.style || "";
      const ffMatch = style.match(/font-family:\s*([^;]+)/);
      setFontFamily(ffMatch ? ffMatch[1].trim() : "");
      const fsMatch = style.match(/font-size:\s*([^;]+)/);
      setFontSize(fsMatch ? fsMatch[1].trim() : "15px");

      // Check if inside a link
      const node = selection.anchor.getNode();
      const parent = node.getParent();
      const linkNode = $isLinkNode(parent)
        ? parent
        : $isLinkNode(node)
          ? node
          : null;
      setIsLink(!!linkNode);
      setLinkUrl(linkNode ? linkNode.getURL() : "");

      const anchorNode = selection.anchor.getNode();
      let element =
        anchorNode.getKey() === "root"
          ? anchorNode
          : $findMatchingParent(anchorNode, (e) => {
              const p = e.getParent();
              return p !== null && $isRootOrShadowRoot(p);
            });

      if (element === null) {
        element = anchorNode.getTopLevelElementOrThrow();
      }

      if ($isListNode(element)) {
        const parentList = $findMatchingParent(anchorNode, (n) =>
          $isListNode(n),
        );
        const type = parentList
          ? parentList.getListType()
          : element.getListType();
        setBlockType(type === "bullet" ? "bullet" : "number");
      } else if ($isHeadingNode(element)) {
        setBlockType(element.getTag());
      } else {
        const type = element.getType();
        if (type in BLOCK_TYPE_TO_NAME) {
          setBlockType(type);
        } else {
          setBlockType("paragraph");
        }
      }
    }
  }, []);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        updateToolbar();
      });
    });
  }, [editor, updateToolbar]);

  // Close dropdowns on outside click using refs
  useEffect(() => {
    const handleMouseDown = (e) => {
      if (
        fontFamilyRef.current &&
        !fontFamilyRef.current.contains(e.target)
      ) {
        setShowFontFamilyDropdown(false);
      }
      if (fontSizeRef.current && !fontSizeRef.current.contains(e.target)) {
        setShowFontSizeDropdown(false);
      }
      if (pageSizeRef.current && !pageSizeRef.current.contains(e.target)) {
        setShowPageSizeDropdown(false);
      }
      if (marginRef.current && !marginRef.current.contains(e.target)) {
        setShowMarginDropdown(false);
      }
      if (linkRef.current && !linkRef.current.contains(e.target)) {
        setShowLinkPopover(false);
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  const closeAllDropdowns = () => {
    setShowFontFamilyDropdown(false);
    setShowFontSizeDropdown(false);
    setShowPageSizeDropdown(false);
    setShowMarginDropdown(false);
    setShowLinkPopover(false);
  };

  const formatParagraph = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createParagraphNode());
      }
    });
  };

  const formatHeading = (headingSize) => {
    if (blockType !== headingSize) {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createHeadingNode(headingSize));
        }
      });
    } else {
      formatParagraph();
    }
  };

  const formatBulletList = () => {
    if (blockType !== "bullet") {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    }
  };

  const formatNumberedList = () => {
    if (blockType !== "number") {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    }
  };

  const formatQuote = () => {
    if (blockType !== "quote") {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createQuoteNode());
        }
      });
    } else {
      formatParagraph();
    }
  };

  const formatAlign = (alignment) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const nodes = selection.getNodes();
        for (const node of nodes) {
          const element = node.getTopLevelElementOrThrow();
          if (element.setFormat) {
            element.setFormat(alignment);
          }
        }
      }
    });
  };

  const applyFontFamily = (ff) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const currentStyle = selection.style || "";
        const cleaned = currentStyle.replace(/font-family:\s*[^;]+;?\s*/g, "");
        const newStyle = ff ? `${cleaned}font-family: ${ff};` : cleaned;
        selection.setStyle(newStyle);
      }
    });
    setFontFamily(ff);
    setShowFontFamilyDropdown(false);
  };

  const applyFontSize = (fs) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const currentStyle = selection.style || "";
        const cleaned = currentStyle.replace(/font-size:\s*[^;]+;?\s*/g, "");
        const newStyle = `${cleaned}font-size: ${fs};`;
        selection.setStyle(newStyle);
      }
    });
    setFontSize(fs);
    setShowFontSizeDropdown(false);
  };

  const toggleLink = () => {
    if (showLinkPopover) {
      setShowLinkPopover(false);
      return;
    }
    closeAllDropdowns();
    setLinkInput(isLink ? linkUrl : "");
    setShowLinkPopover(true);
  };

  const applyLink = () => {
    const url = linkInput.trim();
    if (url) {
      const finalUrl =
        url.startsWith("http://") || url.startsWith("https://")
          ? url
          : `https://${url}`;
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, finalUrl);
    }
    setShowLinkPopover(false);
  };

  const removeLink = () => {
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    setShowLinkPopover(false);
  };

  const handleLinkKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      applyLink();
    } else if (e.key === "Escape") {
      setShowLinkPopover(false);
    }
  };

  const clearFormatting = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        selection.getNodes().forEach((node) => {
          if (node.setFormat) {
            node.setFormat(0);
          }
          if (node.setStyle) {
            node.setStyle("");
          }
        });
        selection.setStyle("");
      }
    });
  };

  const preventFocus = (e) => e.preventDefault();

  const ToolbarButton = ({ active, onClick, children, title }) => (
    <Button
      variant="ghost"
      size="icon-xs"
      onMouseDown={preventFocus}
      onClick={onClick}
      title={title}
      className={`h-7 w-7 rounded-sm ${
        active
          ? "bg-primary/15 text-primary hover:bg-primary/25 dark:bg-primary/20 dark:hover:bg-primary/30"
          : "text-muted-foreground hover:text-foreground hover:bg-accent dark:hover:bg-accent"
      }`}
    >
      {children}
    </Button>
  );

  const currentFontLabel =
    FONT_FAMILIES.find((f) => f.value === fontFamily)?.label || "Default";
  const currentPageSizeLabel = PAGE_SIZES[pageSizeKey]?.label || "A4";
  const currentMarginLabel = MARGIN_PRESETS[marginKey]?.label || "Normal";

  return (
    <>
      {/* Undo/Redo */}
      <ToolbarButton
        onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
        title="Undo (Ctrl+Z)"
      >
        <Undo2 className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
        title="Redo (Ctrl+Y)"
      >
        <Redo2 className="size-3.5" />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-1.5 h-5" />

      {/* Font Family dropdown */}
      <div className="relative" ref={fontFamilyRef}>
        <button
          onMouseDown={preventFocus}
          onClick={() => {
            closeAllDropdowns();
            setShowFontFamilyDropdown(!showFontFamilyDropdown);
          }}
          className="flex items-center gap-1 h-7 px-2 rounded-sm text-xs text-foreground hover:bg-accent dark:hover:bg-accent border border-border/50 min-w-[110px] justify-between"
          title="Font family"
        >
          <span className="truncate">{currentFontLabel}</span>
          <ChevronDown className="size-3 text-muted-foreground shrink-0" />
        </button>
        {showFontFamilyDropdown && (
          <div className="absolute top-full left-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-50 w-48 max-h-60 overflow-auto">
            {FONT_FAMILIES.map((f) => (
              <button
                key={f.value}
                onMouseDown={preventFocus}
                onClick={() => applyFontFamily(f.value)}
                className={`block w-full text-left px-3 py-1.5 text-xs hover:bg-accent dark:hover:bg-accent ${
                  fontFamily === f.value
                    ? "text-primary font-medium"
                    : "text-foreground"
                }`}
                style={f.value ? { fontFamily: f.value } : undefined}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Font Size dropdown */}
      <div className="relative" ref={fontSizeRef}>
        <button
          onMouseDown={preventFocus}
          onClick={() => {
            closeAllDropdowns();
            setShowFontSizeDropdown(!showFontSizeDropdown);
          }}
          className="flex items-center gap-1 h-7 px-2 rounded-sm text-xs text-foreground hover:bg-accent dark:hover:bg-accent border border-border/50 min-w-[55px] justify-between"
          title="Font size"
        >
          <span>{fontSize.replace("px", "")}</span>
          <ChevronDown className="size-3 text-muted-foreground shrink-0" />
        </button>
        {showFontSizeDropdown && (
          <div className="absolute top-full left-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-50 w-20 max-h-60 overflow-auto">
            {FONT_SIZES.map((fs) => (
              <button
                key={fs}
                onMouseDown={preventFocus}
                onClick={() => applyFontSize(fs)}
                className={`block w-full text-left px-3 py-1.5 text-xs hover:bg-accent dark:hover:bg-accent ${
                  fontSize === fs
                    ? "text-primary font-medium"
                    : "text-foreground"
                }`}
              >
                {fs.replace("px", "")}
              </button>
            ))}
          </div>
        )}
      </div>

      <Separator orientation="vertical" className="mx-1.5 h-5" />

      {/* Block type */}
      <ToolbarButton
        active={blockType === "paragraph"}
        onClick={formatParagraph}
        title="Normal text"
      >
        <Pilcrow className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        active={blockType === "h1"}
        onClick={() => formatHeading("h1")}
        title="Heading 1"
      >
        <Heading1 className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        active={blockType === "h2"}
        onClick={() => formatHeading("h2")}
        title="Heading 2"
      >
        <Heading2 className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        active={blockType === "h3"}
        onClick={() => formatHeading("h3")}
        title="Heading 3"
      >
        <Heading3 className="size-3.5" />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-1.5 h-5" />

      {/* Inline formatting */}
      <ToolbarButton
        active={isBold}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
        title="Bold (Ctrl+B)"
      >
        <Bold className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        active={isItalic}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
        title="Italic (Ctrl+I)"
      >
        <Italic className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        active={isUnderline}
        onClick={() =>
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")
        }
        title="Underline (Ctrl+U)"
      >
        <Underline className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        active={isStrikethrough}
        onClick={() =>
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough")
        }
        title="Strikethrough"
      >
        <Strikethrough className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        active={isSuperscript}
        onClick={() =>
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "superscript")
        }
        title="Superscript"
      >
        <Superscript className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        active={isSubscript}
        onClick={() =>
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "subscript")
        }
        title="Subscript"
      >
        <Subscript className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        active={isCode}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code")}
        title="Inline code"
      >
        <Code className="size-3.5" />
      </ToolbarButton>
      <div className="relative" ref={linkRef}>
        <ToolbarButton
          active={isLink || showLinkPopover}
          onClick={toggleLink}
          title={isLink ? "Edit link" : "Insert link"}
        >
          <Link className="size-3.5" />
        </ToolbarButton>
        {showLinkPopover && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-popover border border-border rounded-lg shadow-xl z-50 w-72 overflow-hidden">
            <div className="px-3 pt-3 pb-2">
              <div className="flex items-center gap-2 mb-2.5">
                <ExternalLink className="size-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs font-medium text-foreground">
                  {isLink ? "Edit Link" : "Insert Link"}
                </span>
              </div>
              <input
                type="url"
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                onKeyDown={handleLinkKeyDown}
                placeholder="https://example.com"
                autoFocus
                className="w-full h-8 px-2.5 rounded-md border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40"
              />
            </div>
            <div className="flex items-center gap-1.5 px-3 py-2 border-t border-border/50 bg-muted/30">
              {isLink && (
                <button
                  onMouseDown={preventFocus}
                  onClick={removeLink}
                  className="flex items-center gap-1 h-7 px-2 rounded-md text-[11px] text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="size-3" />
                  Remove
                </button>
              )}
              <div className="flex-1" />
              <button
                onMouseDown={preventFocus}
                onClick={() => setShowLinkPopover(false)}
                className="h-7 px-2.5 rounded-md text-[11px] text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onMouseDown={preventFocus}
                onClick={applyLink}
                disabled={!linkInput.trim()}
                className="h-7 px-3 rounded-md text-[11px] font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        )}
      </div>

      <Separator orientation="vertical" className="mx-1.5 h-5" />

      {/* Lists & Quote */}
      <ToolbarButton
        active={blockType === "bullet"}
        onClick={formatBulletList}
        title="Bullet list"
      >
        <List className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        active={blockType === "number"}
        onClick={formatNumberedList}
        title="Numbered list"
      >
        <ListOrdered className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        active={blockType === "quote"}
        onClick={formatQuote}
        title="Block quote"
      >
        <Quote className="size-3.5" />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-1.5 h-5" />

      {/* Alignment */}
      <ToolbarButton onClick={() => formatAlign("left")} title="Align left">
        <AlignLeft className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => formatAlign("center")}
        title="Align center"
      >
        <AlignCenter className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => formatAlign("right")} title="Align right">
        <AlignRight className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => formatAlign("justify")} title="Justify">
        <AlignJustify className="size-3.5" />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-1.5 h-5" />

      {/* Clear formatting */}
      <ToolbarButton onClick={clearFormatting} title="Clear formatting">
        <RemoveFormatting className="size-3.5" />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-1.5 h-5" />

      {/* Page Size dropdown */}
      <div className="relative" ref={pageSizeRef}>
        <button
          onMouseDown={preventFocus}
          onClick={() => {
            closeAllDropdowns();
            setShowPageSizeDropdown(!showPageSizeDropdown);
          }}
          className="flex items-center gap-1.5 h-7 px-2 rounded-sm text-xs text-foreground hover:bg-accent dark:hover:bg-accent border border-border/50 min-w-[70px] justify-between"
          title="Page size"
        >
          <Maximize2 className="size-3 text-muted-foreground shrink-0" />
          <span>{currentPageSizeLabel}</span>
          <ChevronDown className="size-3 text-muted-foreground shrink-0" />
        </button>
        {showPageSizeDropdown && (
          <div className="absolute top-full left-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-50 w-48 py-1">
            <div className="px-3 py-1.5">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                Page Size
              </p>
            </div>
            {Object.entries(PAGE_SIZES).map(([key, size]) => (
              <button
                key={key}
                onMouseDown={preventFocus}
                onClick={() => {
                  setPageSize(key);
                  setShowPageSizeDropdown(false);
                }}
                className={`flex items-center justify-between w-full text-left px-3 py-1.5 text-xs hover:bg-accent dark:hover:bg-accent ${
                  pageSizeKey === key
                    ? "text-primary font-medium"
                    : "text-foreground"
                }`}
              >
                <span>{size.label}</span>
                <span className="text-muted-foreground text-[10px]">
                  {Math.round((size.width * 25.4) / 96)} x{" "}
                  {Math.round((size.height * 25.4) / 96)}mm
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Margin dropdown */}
      <div className="relative" ref={marginRef}>
        <button
          onMouseDown={preventFocus}
          onClick={() => {
            closeAllDropdowns();
            setShowMarginDropdown(!showMarginDropdown);
          }}
          className="flex items-center gap-1.5 h-7 px-2 rounded-sm text-xs text-foreground hover:bg-accent dark:hover:bg-accent border border-border/50 min-w-[85px] justify-between"
          title="Margins"
        >
          <IndentDecrease className="size-3 text-muted-foreground shrink-0" />
          <span>{currentMarginLabel}</span>
          <ChevronDown className="size-3 text-muted-foreground shrink-0" />
        </button>
        {showMarginDropdown && (
          <div className="absolute top-full right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-50 w-48 py-1">
            <div className="px-3 py-1.5">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                Margins
              </p>
            </div>
            {Object.entries(MARGIN_PRESETS).map(([key, preset]) => (
              <button
                key={key}
                onMouseDown={preventFocus}
                onClick={() => {
                  setMargins(key);
                  setShowMarginDropdown(false);
                }}
                className={`flex items-center justify-between w-full text-left px-3 py-1.5 text-xs hover:bg-accent dark:hover:bg-accent ${
                  marginKey === key
                    ? "text-primary font-medium"
                    : "text-foreground"
                }`}
              >
                <span>{preset.label}</span>
                <span className="text-muted-foreground text-[10px]">
                  {(preset.top / 96).toFixed(1)}&quot; / {(preset.right / 96).toFixed(1)}&quot;
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
