const editorTheme = {
  paragraph: "mb-1 leading-7 text-foreground text-[15px]",
  heading: {
    h1: "text-[26px] font-bold mb-4 mt-6 text-foreground leading-tight",
    h2: "text-[21px] font-semibold mb-3 mt-5 text-foreground leading-snug",
    h3: "text-[17px] font-semibold mb-2 mt-4 text-foreground leading-snug",
  },
  text: {
    bold: "font-bold",
    italic: "italic",
    underline: "underline decoration-foreground/60",
    strikethrough: "line-through",
    underlineStrikethrough: "underline line-through",
    code: "bg-muted px-1.5 py-0.5 rounded text-[13px] font-mono text-primary",
    superscript: "align-super text-[0.75em]",
    subscript: "align-sub text-[0.75em]",
  },
  quote:
    "border-l-[3px] border-primary/40 pl-4 italic text-muted-foreground my-3 ml-1",
  list: {
    nested: {
      listitem: "list-none",
    },
    ol: "list-decimal pl-6 mb-2 space-y-1",
    ul: "list-disc pl-6 mb-2 space-y-1",
    listitem: "text-[15px] leading-7",
    listitemChecked:
      "line-through text-muted-foreground relative pl-6 list-none",
    listitemUnchecked: "relative pl-6 list-none",
  },
  link: "text-primary underline underline-offset-2 cursor-pointer hover:text-primary/80",
  code: "bg-muted rounded-lg p-4 font-mono text-[13px] block mb-3 overflow-x-auto",
};

export default editorTheme;
