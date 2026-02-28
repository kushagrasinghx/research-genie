"use client";

import { useRef, useEffect, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getRoot,
  $createParagraphNode,
  $createTextNode,
} from "lexical";
import { $createHeadingNode } from "@lexical/rich-text";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  ChevronDown,
  FileText,
  BookOpen,
  FlaskConical,
  BarChart3,
  MessageSquareQuote,
  ListEnd,
  ScrollText,
  FileStack,
} from "lucide-react";
import sectionsData from "@/data/ieee-sections.json";

const SECTION_ICONS = {
  abstract: ScrollText,
  introduction: BookOpen,
  related_work: MessageSquareQuote,
  methodology: FlaskConical,
  results: BarChart3,
  conclusion: ListEnd,
  references: FileText,
  full_ieee_paper: FileStack,
};

export default function AddSection() {
  const [editor] = useLexicalComposerContext();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleMouseDown = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  const preventFocus = (e) => e.preventDefault();

  const getNextSectionNumber = () => {
    let maxNum = 0;
    editor.getEditorState().read(() => {
      const root = $getRoot();
      const text = root.getTextContent();
      const matches = text.matchAll(/^(\d+)\.\s/gm);
      for (const m of matches) {
        const n = parseInt(m[1], 10);
        if (n > maxNum) maxNum = n;
      }
    });
    return maxNum + 1;
  };

  const insertSection = (section) => {
    editor.update(() => {
      const root = $getRoot();

      // Determine heading text
      let headingText = section.heading;
      if (section.numbered) {
        const nextNum = getNextSectionNumber();
        headingText = `${nextNum}. ${section.heading}`;
      }

      // Add a blank line before if editor already has content
      const existingText = root.getTextContent().trim();
      if (existingText.length > 0) {
        root.append($createParagraphNode());
      }

      // Create heading node
      const heading = $createHeadingNode("h2");
      heading.append($createTextNode(headingText));
      root.append(heading);

      // Create body paragraphs
      const paragraphs = section.body.split("\n\n");
      for (const para of paragraphs) {
        const trimmed = para.trim();
        if (!trimmed) continue;
        const p = $createParagraphNode();
        p.append($createTextNode(trimmed));
        root.append(p);
      }
    });

    setOpen(false);
  };

  const insertFullTemplate = () => {
    editor.update(() => {
      const root = $getRoot();
      root.clear();

      // Title
      const title = $createHeadingNode("h1");
      title.append(
        $createTextNode(
          "A Novel Hybrid Optimization Framework for Complex Engineering Systems",
        ),
      );
      root.append(title);

      // Author line
      const authorLine = $createParagraphNode();
      authorLine.append(
        $createTextNode(
          "John A. Smith, Department of Computer Science, IEEE University",
        ),
      );
      root.append(authorLine);

      root.append($createParagraphNode());

      // Insert all sections in order
      let sectionNum = 1;
      for (const section of sectionsData.sections) {
        let headingText = section.heading;
        if (section.numbered) {
          headingText = `${sectionNum}. ${section.heading}`;
          sectionNum++;
        }

        const heading = $createHeadingNode("h2");
        heading.append($createTextNode(headingText));
        root.append(heading);

        const paragraphs = section.body.split("\n\n");
        for (const para of paragraphs) {
          const trimmed = para.trim();
          if (!trimmed) continue;
          const p = $createParagraphNode();
          p.append($createTextNode(trimmed));
          root.append(p);
        }

        root.append($createParagraphNode());
      }
    });

    setOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="sm"
        onMouseDown={preventFocus}
        onClick={() => setOpen(!open)}
        className="h-7 px-2.5 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
      >
        <Plus className="size-3.5" />
        Add Section
        <ChevronDown className="size-3" />
      </Button>

      {open && (
        <div className="absolute top-full left-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-50 w-56 py-1 overflow-auto max-h-80">
          <div className="px-2 py-1.5">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              IEEE Sections
            </p>
          </div>

          {sectionsData.sections.map((section) => {
            const Icon = SECTION_ICONS[section.id] || FileText;
            return (
              <button
                key={section.id}
                onMouseDown={preventFocus}
                onClick={() => insertSection(section)}
                className="flex items-center gap-2.5 w-full text-left px-3 py-1.5 text-xs text-foreground hover:bg-accent dark:hover:bg-accent"
              >
                <Icon className="size-3.5 text-muted-foreground shrink-0" />
                <span>{section.label}</span>
              </button>
            );
          })}

          <Separator className="my-1" />

          <button
            onMouseDown={preventFocus}
            onClick={insertFullTemplate}
            className="flex items-center gap-2.5 w-full text-left px-3 py-1.5 text-xs text-primary font-medium hover:bg-primary/10 dark:hover:bg-primary/10"
          >
            <FileStack className="size-3.5 shrink-0" />
            <span>Full IEEE Paper Template</span>
          </button>
        </div>
      )}
    </div>
  );
}
