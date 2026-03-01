"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  $setSelection,
  FORMAT_TEXT_COMMAND,
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
import AddSection from "@/components/add-section";
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
  Heading4,
  Heading5,
  Heading6,
  List,
  ListOrdered,
  Quote,
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
  ImagePlus,
} from "lucide-react";
import {
  INSERT_IMAGE_COMMAND,
  ACCEPTED_IMAGE_EXTENSIONS,
  isValidImageType,
} from "./image-plugin";

const TABS = ["Home", "Insert", "Layout"];

const BLOCK_TYPE_TO_NAME = {
  paragraph: "Normal",
  h1: "Heading 1",
  h2: "Heading 2",
  h3: "Heading 3",
  h4: "Heading 4",
  h5: "Heading 5",
  h6: "Heading 6",
  bullet: "Bulleted List",
  number: "Numbered List",
  quote: "Quote",
};

const BLOCK_TYPES = [
  { tag: "paragraph", label: "Normal", Icon: Pilcrow },
  { tag: "h1", label: "Heading 1", Icon: Heading1 },
  { tag: "h2", label: "Heading 2", Icon: Heading2 },
  { tag: "h3", label: "Heading 3", Icon: Heading3 },
  { tag: "h4", label: "Heading 4", Icon: Heading4 },
  { tag: "h5", label: "Heading 5", Icon: Heading5 },
  { tag: "h6", label: "Heading 6", Icon: Heading6 },
];

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
  "10px", "11px", "12px", "13px", "14px", "15px", "16px",
  "18px", "20px", "24px", "28px", "32px", "36px", "48px", "64px",
];

export default function Toolbar() {
  const [editor] = useLexicalComposerContext();
  const [activeTab, setActiveTab] = useState("Home");
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
  const [showBlockTypeDropdown, setShowBlockTypeDropdown] = useState(false);
  const [showPageSizeDropdown, setShowPageSizeDropdown] = useState(false);
  const [showMarginDropdown, setShowMarginDropdown] = useState(false);
  const [showLinkPopover, setShowLinkPopover] = useState(false);
  const [linkInput, setLinkInput] = useState("");
  const [linkError, setLinkError] = useState(false);
  const fontFamilyRef = useRef(null);
  const fontSizeRef = useRef(null);
  const blockTypeRef = useRef(null);
  const pageSizeRef = useRef(null);
  const marginRef = useRef(null);
  const linkRef = useRef(null);
  const linkInputRef = useRef(null);
  const savedSelectionRef = useRef(null);
  const imageFileInputRef = useRef(null);

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

  useEffect(() => {
    const handleMouseDown = (e) => {
      if (fontFamilyRef.current && !fontFamilyRef.current.contains(e.target)) {
        setShowFontFamilyDropdown(false);
      }
      if (fontSizeRef.current && !fontSizeRef.current.contains(e.target)) {
        setShowFontSizeDropdown(false);
      }
      if (blockTypeRef.current && !blockTypeRef.current.contains(e.target)) {
        setShowBlockTypeDropdown(false);
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
    setShowBlockTypeDropdown(false);
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

  const applyBlockType = (tag) => {
    if (tag === "paragraph") {
      formatParagraph();
    } else {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createHeadingNode(tag));
        }
      });
    }
    setShowBlockTypeDropdown(false);
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

  const isValidUrl = (input) => {
    if (!input || !input.trim()) return false;
    const val = input.trim();
    if (
      /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(val) ||
      val.startsWith("mailto:") ||
      val.startsWith("tel:")
    ) {
      try {
        new URL(val);
        return true;
      } catch {
        return false;
      }
    }
    try {
      const u = new URL(`https://${val}`);
      return u.hostname.includes(".");
    } catch {
      return false;
    }
  };

  const toggleLink = () => {
    if (showLinkPopover) {
      setShowLinkPopover(false);
      return;
    }
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        savedSelectionRef.current = selection.clone();
      }
    });
    closeAllDropdowns();
    setLinkInput(isLink ? linkUrl : "");
    setLinkError(false);
    setShowLinkPopover(true);
  };

  useEffect(() => {
    if (showLinkPopover && linkInputRef.current) {
      linkInputRef.current.focus();
    }
  }, [showLinkPopover]);

  const applyLink = () => {
    const url = linkInput.trim();
    if (!url) return;
    if (!isValidUrl(url)) {
      setLinkError(true);
      return;
    }
    const finalUrl =
      /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(url) ? url : `https://${url}`;
    editor.update(() => {
      if (savedSelectionRef.current) {
        $setSelection(savedSelectionRef.current);
      }
    });
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, finalUrl);
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
          if (node.setFormat) node.setFormat(0);
          if (node.setStyle) node.setStyle("");
        });
        selection.setStyle("");
      }
    });
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isValidImageType(file.type)) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
        src: ev.target.result,
        altText: file.name,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const preventFocus = (e) => e.preventDefault();

  const currentFontLabel =
    FONT_FAMILIES.find((f) => f.value === fontFamily)?.label || "Default";
  const currentPageSizeLabel = PAGE_SIZES[pageSizeKey]?.label || "A4";
  const currentMarginLabel = MARGIN_PRESETS[marginKey]?.label || "Normal";

  // Shared icon-button style
  const iconBtn = (active) =>
    `inline-flex items-center justify-center h-7 w-7 rounded-sm text-xs transition-colors ${
      active
        ? "bg-primary/15 text-primary hover:bg-primary/25 dark:bg-primary/20 dark:hover:bg-primary/30"
        : "text-muted-foreground hover:text-foreground hover:bg-accent dark:hover:bg-accent"
    }`;

  return (
    <div className="flex flex-col w-full">
      {/* ── Tab strip ── */}
      <div className="flex items-center gap-2.5">
        {TABS.map((tab) => (
          <button
            key={tab}
            onMouseDown={preventFocus}
            onClick={() => setActiveTab(tab)}
            className={`h-6 text-[11px] rounded-t-sm transition-colors w-auto ${
              activeTab === tab
                ? "text-foreground font-semibold border-b-2 border-foreground"
                : "text-muted-foreground font-medium hover:text-foreground hover:bg-accent/60"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div className="flex items-center gap-0.5 flex-wrap pt-1 min-h-[36px]">

        {/* ── HOME ── */}
        {activeTab === "Home" && (
          <>
            {/* Font family */}
            <div className="relative" ref={fontFamilyRef}>
              <button
                onMouseDown={preventFocus}
                onClick={() => { closeAllDropdowns(); setShowFontFamilyDropdown(!showFontFamilyDropdown); }}
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
                      className={`block w-full text-left px-3 py-1.5 text-xs hover:bg-accent dark:hover:bg-accent ${fontFamily === f.value ? "text-primary font-medium" : "text-foreground"}`}
                      style={f.value ? { fontFamily: f.value } : undefined}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Font size */}
            <div className="relative" ref={fontSizeRef}>
              <button
                onMouseDown={preventFocus}
                onClick={() => { closeAllDropdowns(); setShowFontSizeDropdown(!showFontSizeDropdown); }}
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
                      className={`block w-full text-left px-3 py-1.5 text-xs hover:bg-accent dark:hover:bg-accent ${fontSize === fs ? "text-primary font-medium" : "text-foreground"}`}
                    >
                      {fs.replace("px", "")}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Block type */}
            <div className="relative" ref={blockTypeRef}>
              <button
                onMouseDown={preventFocus}
                onClick={() => { closeAllDropdowns(); setShowBlockTypeDropdown(!showBlockTypeDropdown); }}
                className="flex items-center gap-1 h-7 px-2 rounded-sm text-xs text-foreground hover:bg-accent dark:hover:bg-accent border border-border/50 min-w-[95px] justify-between"
                title="Text style"
              >
                <span className="truncate">{BLOCK_TYPE_TO_NAME[blockType] ?? "Normal"}</span>
                <ChevronDown className="size-3 text-muted-foreground shrink-0" />
              </button>
              {showBlockTypeDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-50 w-36 py-1">
                  {BLOCK_TYPES.map(({ tag, label, Icon }) => (
                    <button
                      key={tag}
                      onMouseDown={preventFocus}
                      onClick={() => applyBlockType(tag)}
                      className={`flex items-center gap-2.5 w-full text-left px-3 py-1.5 text-xs hover:bg-accent dark:hover:bg-accent ${blockType === tag ? "text-primary font-medium" : "text-foreground"}`}
                    >
                      <Icon className="size-3.5 shrink-0 text-muted-foreground" />
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Separator orientation="vertical" className="mx-1.5 h-5" />

            {/* Inline formatting */}
            <button onMouseDown={preventFocus} onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")} title="Bold (Ctrl+B)" className={iconBtn(isBold)}><Bold className="size-3.5" /></button>
            <button onMouseDown={preventFocus} onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")} title="Italic (Ctrl+I)" className={iconBtn(isItalic)}><Italic className="size-3.5" /></button>
            <button onMouseDown={preventFocus} onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")} title="Underline (Ctrl+U)" className={iconBtn(isUnderline)}><Underline className="size-3.5" /></button>
            <button onMouseDown={preventFocus} onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough")} title="Strikethrough" className={iconBtn(isStrikethrough)}><Strikethrough className="size-3.5" /></button>
            <button onMouseDown={preventFocus} onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "superscript")} title="Superscript" className={iconBtn(isSuperscript)}><Superscript className="size-3.5" /></button>
            <button onMouseDown={preventFocus} onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "subscript")} title="Subscript" className={iconBtn(isSubscript)}><Subscript className="size-3.5" /></button>
            <button onMouseDown={preventFocus} onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code")} title="Inline code" className={iconBtn(isCode)}><Code className="size-3.5" /></button>

            {/* Link */}
            <div className="relative" ref={linkRef}>
              <button onMouseDown={preventFocus} onClick={toggleLink} title={isLink ? "Edit link" : "Insert link"} className={iconBtn(isLink || showLinkPopover)}>
                <Link className="size-3.5" />
              </button>
              {showLinkPopover && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-popover border border-border rounded-lg shadow-xl z-50 w-72 overflow-hidden">
                  <div className="px-3 pt-3 pb-2">
                    <div className="flex items-center gap-2 mb-2.5">
                      <ExternalLink className="size-3.5 text-muted-foreground shrink-0" />
                      <span className="text-xs font-medium text-foreground">{isLink ? "Edit Link" : "Insert Link"}</span>
                    </div>
                    <input
                      ref={linkInputRef}
                      type="text"
                      value={linkInput}
                      onChange={(e) => { setLinkInput(e.target.value); if (linkError) setLinkError(false); }}
                      onKeyDown={handleLinkKeyDown}
                      placeholder="https://example.com"
                      className={`w-full h-8 px-2.5 rounded-md border bg-background text-xs text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-1 transition-colors ${linkError ? "border-destructive focus:ring-destructive/40 focus:border-destructive" : "border-border focus:ring-primary/40 focus:border-primary/40"}`}
                    />
                    {linkError && <p className="mt-1.5 text-[10px] text-destructive">Please enter a valid URL (e.g. https://example.com or mailto:user@example.com)</p>}
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-2 border-t border-border/50 bg-muted/30">
                    {isLink && (
                      <button onMouseDown={preventFocus} onClick={removeLink} className="flex items-center gap-1 h-7 px-2 rounded-md text-[11px] text-destructive hover:bg-destructive/10 transition-colors">
                        <Trash2 className="size-3" /> Remove
                      </button>
                    )}
                    <div className="flex-1" />
                    <button onMouseDown={preventFocus} onClick={() => setShowLinkPopover(false)} className="h-7 px-2.5 rounded-md text-[11px] text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">Cancel</button>
                    <button onMouseDown={preventFocus} onClick={applyLink} disabled={!linkInput.trim()} className="h-7 px-3 rounded-md text-[11px] font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:pointer-events-none transition-colors">Apply</button>
                  </div>
                </div>
              )}
            </div>

            <Separator orientation="vertical" className="mx-1.5 h-5" />

            {/* Lists & Quote */}
            <button onMouseDown={preventFocus} onClick={formatBulletList} title="Bullet list" className={iconBtn(blockType === "bullet")}><List className="size-3.5" /></button>
            <button onMouseDown={preventFocus} onClick={formatNumberedList} title="Numbered list" className={iconBtn(blockType === "number")}><ListOrdered className="size-3.5" /></button>
            <button onMouseDown={preventFocus} onClick={formatQuote} title="Block quote" className={iconBtn(blockType === "quote")}><Quote className="size-3.5" /></button>

            <Separator orientation="vertical" className="mx-1.5 h-5" />

            {/* Alignment */}
            <button onMouseDown={preventFocus} onClick={() => formatAlign("left")} title="Align left" className={iconBtn(false)}><AlignLeft className="size-3.5" /></button>
            <button onMouseDown={preventFocus} onClick={() => formatAlign("center")} title="Align center" className={iconBtn(false)}><AlignCenter className="size-3.5" /></button>
            <button onMouseDown={preventFocus} onClick={() => formatAlign("right")} title="Align right" className={iconBtn(false)}><AlignRight className="size-3.5" /></button>
            <button onMouseDown={preventFocus} onClick={() => formatAlign("justify")} title="Justify" className={iconBtn(false)}><AlignJustify className="size-3.5" /></button>

            <Separator orientation="vertical" className="mx-1.5 h-5" />

            {/* Clear formatting */}
            <button onMouseDown={preventFocus} onClick={clearFormatting} title="Clear formatting" className={iconBtn(false)}><RemoveFormatting className="size-3.5" /></button>
          </>
        )}

        {/* ── INSERT ── */}
        {activeTab === "Insert" && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onMouseDown={preventFocus}
              onClick={() => imageFileInputRef.current?.click()}
              title="Insert image"
              className="h-7 px-2.5 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <ImagePlus className="size-3.5" />
              Add Image
            </Button>
            <input
              ref={imageFileInputRef}
              type="file"
              accept={ACCEPTED_IMAGE_EXTENSIONS}
              className="hidden"
              onChange={handleImageFileChange}
            />
            <Separator orientation="vertical" className="mx-1.5 h-5" />
            <AddSection />
          </>
        )}

        {/* ── LAYOUT ── */}
        {activeTab === "Layout" && (
          <>
            {/* Page size */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground font-medium">Page Size</span>
            <div className="relative" ref={pageSizeRef}>
              <button
                onMouseDown={preventFocus}
                onClick={() => { closeAllDropdowns(); setShowPageSizeDropdown(!showPageSizeDropdown); }}
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
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Page Size</p>
                  </div>
                  {Object.entries(PAGE_SIZES).map(([key, size]) => (
                    <button
                      key={key}
                      onMouseDown={preventFocus}
                      onClick={() => { setPageSize(key); setShowPageSizeDropdown(false); }}
                      className={`flex items-center justify-between w-full text-left px-3 py-1.5 text-xs hover:bg-accent dark:hover:bg-accent ${pageSizeKey === key ? "text-primary font-medium" : "text-foreground"}`}
                    >
                      <span>{size.label}</span>
                      <span className="text-muted-foreground text-[10px]">
                        {Math.round((size.width * 25.4) / 96)} x {Math.round((size.height * 25.4) / 96)}mm
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            </div>

            <Separator orientation="vertical" className="mx-1.5 h-5" />

            {/* Margins */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground font-medium">Margins</span>
            <div className="relative" ref={marginRef}>
              <button
                onMouseDown={preventFocus}
                onClick={() => { closeAllDropdowns(); setShowMarginDropdown(!showMarginDropdown); }}
                className="flex items-center gap-1.5 h-7 px-2 rounded-sm text-xs text-foreground hover:bg-accent dark:hover:bg-accent border border-border/50 min-w-[85px] justify-between"
                title="Margins"
              >
                <IndentDecrease className="size-3 text-muted-foreground shrink-0" />
                <span>{currentMarginLabel}</span>
                <ChevronDown className="size-3 text-muted-foreground shrink-0" />
              </button>
              {showMarginDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-50 w-48 py-1">
                  <div className="px-3 py-1.5">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Margins</p>
                  </div>
                  {Object.entries(MARGIN_PRESETS).map(([key, preset]) => (
                    <button
                      key={key}
                      onMouseDown={preventFocus}
                      onClick={() => { setMargins(key); setShowMarginDropdown(false); }}
                      className={`flex items-center justify-between w-full text-left px-3 py-1.5 text-xs hover:bg-accent dark:hover:bg-accent ${marginKey === key ? "text-primary font-medium" : "text-foreground"}`}
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
            </div>
          </>
        )}

      </div>
    </div>
  );
}
