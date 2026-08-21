/**
 * Markdown rendering for UNTRUSTED model output.
 *
 * Rules, in order of importance:
 *   1. Raw HTML never reaches the DOM. `rehype-raw` is deliberately NOT
 *      installed or imported. `remarkHtmlAsText` additionally rewrites every
 *      mdast `html` node into a `text` node, so `<script>alert(1)</script>`
 *      renders as visible characters instead of disappearing or executing.
 *   2. Link protocols are allowlisted to http / https / mailto. Anything else
 *      (`javascript:`, `data:`, `vbscript:`, `file:`) resolves to an empty href.
 *   3. Embedding elements are dropped entirely — no images, no iframes.
 *
 * This is a command surface, not a document viewer: type scale stays compact
 * and every colour comes from a design token.
 */

import ReactMarkdown, { type Components, type Options } from "react-markdown";
import remarkGfm from "remark-gfm";

/* ── 1. Raw HTML becomes literal text ────────────────────────────────────── */

type MdNode = { type?: string; value?: string; children?: MdNode[] };

/**
 * remark plugin. Replaces `html` nodes (block and inline) with `text` nodes.
 * Written without `unist-util-visit` so it depends on nothing beyond
 * react-markdown's own resolved tree shape.
 */
function remarkHtmlAsText() {
  return function transform(tree: MdNode) {
    const walk = (node: MdNode) => {
      if (!node || typeof node !== "object" || !Array.isArray(node.children)) {
        return;
      }
      node.children = node.children.map((child) => {
        if (child && child.type === "html") {
          return { type: "text", value: child.value ?? "" };
        }
        walk(child);
        return child;
      });
    };
    walk(tree);
  };
}

/**
 * Order matters: remarkHtmlAsText runs first so raw HTML is neutralised before
 * GFM parses. GFM adds tables, strikethrough, and task lists — it introduces no
 * HTML of its own, and autolink literals stay subject to the same urlTransform
 * allowlist as written links.
 */
const REMARK_PLUGINS = [
  remarkHtmlAsText,
  remarkGfm,
] as unknown as Options["remarkPlugins"];

/* ── 2. Link protocol allowlist ──────────────────────────────────────────── */

// Extracted to safe-url.ts so a self-check can exercise it without a JSX runtime.
// Imported (not merely re-exported) because urlTransform references it below.
import { safeUrl } from "./safe-url";
export { safeUrl };

/* ── 3. Token-only presentation ──────────────────────────────────────────── */

const components: Components = {
  // `node` is react-markdown's internal hast node — never spread onto the DOM.
  a({ children, href, node: _node, ...props }) {
    return (
      <a
        {...props}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-foreground underline underline-offset-2 hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        {children}
      </a>
    );
  },
  p({ children }) {
    return <p className="text-xs/relaxed text-foreground">{children}</p>;
  },
  strong({ children }) {
    return <strong className="font-medium text-foreground">{children}</strong>;
  },
  em({ children }) {
    return <em className="italic">{children}</em>;
  },
  ul({ children }) {
    return (
      <ul className="list-disc space-y-0.5 pl-4 text-xs/relaxed text-foreground">
        {children}
      </ul>
    );
  },
  ol({ children }) {
    return (
      <ol className="list-decimal space-y-0.5 pl-4 text-xs/relaxed text-foreground">
        {children}
      </ol>
    );
  },
  table({ children }) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs/relaxed">{children}</table>
      </div>
    );
  },
  thead({ children }) {
    return <thead className="border-b border-border">{children}</thead>;
  },
  tr({ children }) {
    return <tr className="border-b border-border last:border-0">{children}</tr>;
  },
  th({ children }) {
    return (
      <th className="px-2 py-1 text-left font-medium text-muted-foreground">
        {children}
      </th>
    );
  },
  td({ children }) {
    return <td className="px-2 py-1 text-foreground">{children}</td>;
  },
  del({ children }) {
    return <del className="text-muted-foreground line-through">{children}</del>;
  },
  li({ children }) {
    return <li className="marker:text-muted-foreground">{children}</li>;
  },
  code({ children, className }) {
    // Fenced blocks arrive wrapped in <pre>; inline code does not.
    const isBlock = typeof className === "string" && className.includes("lang");
    if (isBlock) return <code className="font-mono">{children}</code>;
    return (
      <code className="rounded-sm bg-accent px-1 py-0.5 font-mono text-[0.6875rem] text-foreground">
        {children}
      </code>
    );
  },
  pre({ children }) {
    return (
      <pre className="overflow-x-auto rounded-md border border-border bg-accent p-2 text-[0.6875rem]/relaxed text-foreground">
        {children}
      </pre>
    );
  },
  blockquote({ children }) {
    return (
      <blockquote className="border-l-2 border-border pl-2 text-xs/relaxed text-muted-foreground">
        {children}
      </blockquote>
    );
  },
  h1({ children }) {
    return (
      <p className="text-xs/relaxed font-medium text-foreground">{children}</p>
    );
  },
  h2({ children }) {
    return (
      <p className="text-xs/relaxed font-medium text-foreground">{children}</p>
    );
  },
  h3({ children }) {
    return (
      <p className="text-xs/relaxed font-medium text-foreground">{children}</p>
    );
  },
  hr() {
    return <hr className="border-border" />;
  },
};

/** Never render these, however the model spells them. */
const DISALLOWED = ["img", "image", "iframe", "script", "style", "input"];

export function Markdown({ children }: { children: string }) {
  return (
    <div className="space-y-1.5">
      <ReactMarkdown
        remarkPlugins={REMARK_PLUGINS}
        urlTransform={safeUrl}
        disallowedElements={DISALLOWED}
        unwrapDisallowed
        components={components}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
