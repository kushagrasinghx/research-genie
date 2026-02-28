"use client";

import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin";

import { OnChangePlugin, EditorRefPlugin } from "./editor-plugins";

const URL_REGEX =
  /^(https?:\/\/)?[\w-]+(\.[\w-]+)+([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?$/;

export default function ResearchEditor() {
  return (
    <div className="relative min-h-[200px]">
      <RichTextPlugin
        contentEditable={
          <ContentEditable className="outline-none text-foreground leading-7 text-[15px] selection:bg-primary/20" />
        }
        placeholder={
          <div className="absolute top-0 left-0 text-muted-foreground/60 pointer-events-none select-none text-[15px]">
            Start writing your research paper here...
          </div>
        }
        ErrorBoundary={LexicalErrorBoundary}
      />
      <HistoryPlugin />
      <AutoFocusPlugin />
      <ListPlugin />
      <LinkPlugin validateUrl={(url) => URL_REGEX.test(url)} />
      <TabIndentationPlugin />
      <OnChangePlugin />
      <EditorRefPlugin />
    </div>
  );
}
