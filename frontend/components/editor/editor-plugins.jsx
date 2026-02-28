"use client";

import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getRoot } from "lexical";
import useEditorStore from "@/store/use-editor-store";

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
