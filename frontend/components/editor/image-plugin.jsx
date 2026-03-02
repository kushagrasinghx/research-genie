"use client";

import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  $insertNodes,
  $isRootOrShadowRoot,
  $createParagraphNode,
} from "lexical";
import { $wrapNodeInElement } from "@lexical/utils";
import { $createImageNode, ImageNode } from "./image-node";

export const INSERT_IMAGE_COMMAND = createCommand("INSERT_IMAGE_COMMAND");

const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/bmp",
  "image/avif",
];

export function isValidImageType(type) {
  return ACCEPTED_IMAGE_TYPES.includes(type);
}

export const ACCEPTED_IMAGE_EXTENSIONS =
  ".jpg,.jpeg,.png,.gif,.webp,.svg,.bmp,.avif";

function insertImageFromFile(file, editor) {
  if (!isValidImageType(file.type)) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
      src: e.target.result,
      altText: file.name,
    });
  };
  reader.readAsDataURL(file);
}

export function ImagePlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([ImageNode])) {
      throw new Error("ImagePlugin: ImageNode not registered on editor");
    }

    const unregisterCommand = editor.registerCommand(
      INSERT_IMAGE_COMMAND,
      ({ src, altText }) => {
        const imageNode = $createImageNode({ src, altText });
        $insertNodes([imageNode]);
        if ($isRootOrShadowRoot(imageNode.getParentOrThrow())) {
          $wrapNodeInElement(imageNode, $createParagraphNode).selectEnd();
        }
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );

    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.kind === "file" && isValidImageType(item.type)) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            insertImageFromFile(file, editor);
            break;
          }
        }
      }
    };

    const unregisterRoot = editor.registerRootListener(
      (rootElement, prevRootElement) => {
        if (prevRootElement) {
          prevRootElement.removeEventListener("paste", handlePaste);
        }
        if (rootElement) {
          rootElement.addEventListener("paste", handlePaste);
        }
      },
    );

    return () => {
      unregisterCommand();
      unregisterRoot();
      const root = editor.getRootElement();
      if (root) root.removeEventListener("paste", handlePaste);
    };
  }, [editor]);

  return null;
}
