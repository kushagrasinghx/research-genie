"use client";

import { Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// ── suggestion card helpers ──────────────────────────────────────────────────

const SUGGESTION_STYLES = {
  Original: {
    card: "border-border bg-muted/40",
    badge: "bg-muted-foreground/15 text-muted-foreground",
  },
  Suggested: {
    card: "border-green-500/20 bg-green-500/5",
    badge: "bg-green-500/15 text-green-600 dark:text-green-400",
  },
  Reason: {
    card: "border-primary/20 bg-primary/5",
    badge: "bg-primary/10 text-primary",
  },
};

function SuggestionGroup({ group }) {
  const rows = [
    { label: "Original", key: "Original" },
    { label: "Suggested", key: "Suggested" },
    { label: "Reason", key: "Reason" },
  ].filter(({ key }) => group[key] !== undefined);

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      {rows.map(({ label, key }, i) => {
        const s = SUGGESTION_STYLES[label];
        return (
          <div
            key={label}
            className={`px-2.5 py-2 ${s.card} ${i < rows.length - 1 ? "border-b border-border/60" : ""}`}
          >
            <span
              className={`inline-block text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded mb-1 ${s.badge}`}
            >
              {label}
            </span>
            <p className="text-xs text-foreground leading-relaxed">{group[key]}</p>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Parse the raw text inside a ```suggestions block.
 * Each item is a line like:  - **Label**: some text
 * Consecutive continuation lines (indented or plain) are appended to the last item.
 */
function parseSuggestions(raw) {
  const items = [];
  let current = null;

  for (const line of raw.split("\n")) {
    const match = line.match(/^-\s+\*\*(Original|Suggested|Reason)\*\*:\s*(.*)/);
    if (match) {
      current = { label: match[1], text: match[2].trim() };
      items.push(current);
    } else if (current && line.trim() && !line.startsWith("-")) {
      current.text += " " + line.trim();
    } else if (!line.trim()) {
      current = null;
    }
  }

  return items;
}

function SuggestionsBlock({ content }) {
  const items = parseSuggestions(content);

  if (!items.length) {
    // Fallback: render as plain pre if nothing parsed
    return (
      <pre className="bg-muted rounded-lg text-xs px-2.5 py-2 overflow-x-auto whitespace-pre-wrap mb-2">
        {content}
      </pre>
    );
  }

  // Group into { Original, Suggested, Reason } triplets
  const groups = [];
  let group = {};
  for (const item of items) {
    group[item.label] = item.text;
    if (item.label === "Reason") {
      groups.push({ ...group });
      group = {};
    }
  }
  if (Object.keys(group).length) groups.push(group); // incomplete trailing group

  return (
    <div className="space-y-2 my-1">
      {groups.map((g, i) => (
        <SuggestionGroup key={i} group={g} />
      ))}
    </div>
  );
}

// ── markdown component map ───────────────────────────────────────────────────

const markdownComponents = {
  h1: ({ children }) => (
    <h1 className="text-sm font-bold text-foreground mt-4 mb-1.5 pb-1 border-b border-border first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-xs font-bold text-foreground mt-3.5 mb-1 first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-xs font-semibold text-foreground mt-3 mb-1 first:mt-0">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mt-2.5 mb-1 first:mt-0">
      {children}
    </h4>
  ),
  p: ({ children }) => (
    <p className="text-xs text-foreground leading-relaxed mb-2 last:mb-0">
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="text-xs text-foreground list-disc pl-4 mb-2 last:mb-0 space-y-0.5">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="text-xs text-foreground list-decimal pl-4 mb-2 last:mb-0 space-y-0.5">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="text-xs text-foreground leading-relaxed">{children}</li>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="italic text-foreground">{children}</em>
  ),

  // Intercept ```suggestions blocks; fall through to normal styling otherwise
  pre: ({ node, children }) => {
    const codeChild = node?.children?.[0];
    const lang =
      codeChild?.properties?.className?.[0]?.replace("language-", "") ?? "";
    if (lang === "suggestions") {
      // The <code> component already returns the rendered cards; just unwrap <pre>
      return <>{children}</>;
    }
    return (
      <pre className="bg-muted rounded-lg mb-2 last:mb-0 overflow-x-auto">
        {children}
      </pre>
    );
  },

  code: ({ className, inline, children }) => {
    const lang = className?.replace("language-", "") ?? "";

    if (!inline && lang === "suggestions") {
      return (
        <SuggestionsBlock content={String(children).replace(/\n$/, "")} />
      );
    }

    if (inline) {
      return (
        <code className="bg-muted text-foreground text-[11px] px-1 py-0.5 rounded font-mono">
          {children}
        </code>
      );
    }

    return (
      <code className="block bg-muted text-foreground text-[11px] px-2.5 py-2 rounded-lg font-mono whitespace-pre-wrap overflow-x-auto">
        {children}
      </code>
    );
  },

  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-primary/40 pl-3 text-muted-foreground italic mb-2 last:mb-0">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="border-border my-2" />,
  a: ({ href, children }) => (
    <a
      href={href}
      className="text-primary underline underline-offset-2 hover:opacity-80"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto mb-2 last:mb-0">
      <table className="text-xs w-full border-collapse">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-border px-2 py-1 bg-muted font-semibold text-left">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-border px-2 py-1">{children}</td>
  ),
};

// ── component ────────────────────────────────────────────────────────────────

export default function ChatMessage({ message, isStreaming }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[82%] bg-accent text-foreground text-xs leading-relaxed rounded-2xl rounded-tr-sm px-3.5 py-2.5 whitespace-pre-wrap break-words">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2.5 items-start">
      <div className="shrink-0 size-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
        <Sparkles className="size-2.5 text-primary" />
      </div>
      <div className="flex-1 min-w-0 text-xs text-foreground leading-relaxed break-words pt-0.5">
        {message.content && (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={markdownComponents}
          >
            {message.content}
          </ReactMarkdown>
        )}
        {isStreaming && !message.content && (
          <span className="inline-flex items-center gap-0.5 h-3">
            <span className="size-1 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:0ms]" />
            <span className="size-1 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:150ms]" />
            <span className="size-1 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:300ms]" />
          </span>
        )}
        {isStreaming && message.content && (
          <span className="inline-block w-0.5 h-3 bg-primary ml-0.5 animate-pulse rounded-full align-middle" />
        )}
      </div>
    </div>
  );
}
