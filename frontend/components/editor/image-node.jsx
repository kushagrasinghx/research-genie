"use client";

import { DecoratorNode } from "lexical";
import { Suspense } from "react";

function ImageComponent({ src, altText }) {
  return (
    <img
      src={src}
      alt={altText}
      className="editor-image"
      draggable="false"
    />
  );
}

export class ImageNode extends DecoratorNode {
  __src;
  __altText;

  static getType() {
    return "image";
  }

  static clone(node) {
    return new ImageNode(node.__src, node.__altText, node.__key);
  }

  constructor(src, altText, key) {
    super(key);
    this.__src = src;
    this.__altText = altText || "";
  }

  static importJSON(serializedNode) {
    return $createImageNode({
      src: serializedNode.src,
      altText: serializedNode.altText,
    });
  }

  exportJSON() {
    return {
      type: "image",
      src: this.__src,
      altText: this.__altText,
      version: 1,
    };
  }

  createDOM() {
    const span = document.createElement("span");
    span.className = "editor-image-wrapper";
    return span;
  }

  updateDOM() {
    return false;
  }

  decorate() {
    return (
      <Suspense fallback={null}>
        <ImageComponent src={this.__src} altText={this.__altText} />
      </Suspense>
    );
  }
}

export function $createImageNode({ src, altText }) {
  return new ImageNode(src, altText);
}

export function $isImageNode(node) {
  return node instanceof ImageNode;
}
