"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowUpIcon, SparkleIcon } from "@phosphor-icons/react";

import { useBusinesses } from "@/app/m/_components/business-provider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

/* ── Server contract (POST /api/agent) ───────────────────────────────────── */

type Entity = { id: string; label: string; detail?: string; href?: string };

type Block =
  | { type: "text"; text: string }
  | { type: "list" | "entities"; title?: string; items: Entity[] };

type Confirmation = {
  id?: string;
  title?: string;
  summary?: string;
  confirmLabel?: string;
  cancelLabel?: string;
};

type Result = {
  text: string;
  blocks?: Block[];
  confirmation?: Confirmation | null;
  isError?: boolean;
};

/* ── Static suggestions. Only capabilities this repo actually has. ───────── */

const HOME_ROUTE = "/m/dashboard";

const SUGGESTIONS: Record<string, string[]> = {
  "/m/dashboard": [
    "What needs attention?",
    "Help me finish setup",
    "Create something to sell",
  ],
  "/m/orders": ["Show orders needing attention", "Find today's orders"],
  "/m/store": ["Create a product", "Find unpublished products"],
  "/m/services": ["List my services", "Which services have no price set?"],
  "/m/event": ["List my upcoming events", "Which events have unused tickets?"],
  "/m/restaurant": ["What's on my menu?", "Which menu items have no price?"],
  "/m/ownership": ["Show recent customers", "Who are my repeat customers?"],
  "/m/agents": ["Show agent activity", "What can agents do?"],
  "/m/share": ["Which checkout links are live?"],
  "/m/presence": ["Is my site published?"],
  "/m/connect": ["What integrations are connected?"],
  "/m/settings": ["What business details are missing?"],
};

function suggestionsFor(pathname: string): string[] {
  const match = Object.keys(SUGGESTIONS)
    .filter((route) => pathname === route || pathname.startsWith(`${route}/`))
    .sort((a, b) => b.length - a.length)[0];
  return (match ? SUGGESTIONS[match] : undefined) ?? [];
}

/* ── Result rendering ────────────────────────────────────────────────────── */

function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((block, index) =>
        block.type === "text" ? (
          <p
            key={index}
            className="text-xs/relaxed whitespace-pre-wrap text-foreground"
          >
            {block.text}
          </p>
        ) : (
          <div key={index} className="rounded-md border border-border">
            {block.title && (
              <p className="border-b border-border px-2 py-1 text-[0.625rem] font-medium tracking-wide text-muted-foreground uppercase">
                {block.title}
              </p>
            )}
            <ul className="divide-y divide-border">
              {block.items.map((item) => (
                <li key={item.id} className="px-2 py-1.5">
                  {item.href ? (
                    <a
                      href={item.href}
                      className="text-xs/relaxed font-medium text-foreground underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    >
                      {item.label}
                    </a>
                  ) : (
                    <span className="text-xs/relaxed font-medium text-foreground">
                      {item.label}
                    </span>
                  )}
                  {item.detail && (
                    <p className="text-[0.6875rem] text-muted-foreground">
                      {item.detail}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ),
      )}
    </>
  );
}

/* ── The one floating command surface ────────────────────────────────────── */

export function AskLumeSurface() {
  const pathname = usePathname() ?? "";
  const { activeBusiness } = useBusinesses();
  const isHome = pathname === HOME_ROUTE;

  const [configured, setConfigured] = useState<boolean | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const confirmation = result?.confirmation ?? null;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/agent/capability");
        const data: unknown = res.ok ? await res.json() : null;
        if (!cancelled)
          setConfigured(
            typeof data === "object" &&
              data !== null &&
              (data as { configured?: unknown }).configured === true,
          );
      } catch {
        if (!cancelled) setConfigured(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const open = useCallback(() => {
    setExpanded(true);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  // Cmd/Ctrl+J. Cmd+B belongs to the sidebar; J is unused elsewhere.
  useEffect(() => {
    if (!configured) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === "j" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        open();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [configured, open]);

  useEffect(() => {
    if (confirmation) confirmRef.current?.focus();
  }, [confirmation]);

  const post = useCallback(
    async (body: Record<string, unknown>) => {
      setPending(true);
      try {
        const res = await fetch("/api/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            businessId: activeBusiness?.id,
            route: pathname,
            ...body,
          }),
        });
        if (res.status === 503) {
          setConfigured(false); // a 503 retires the surface
          return;
        }
        if (!res.ok) throw new Error("failed");
        const data = (await res.json()) as {
          message?: string;
          blocks?: Block[];
          pendingConfirmation?: Confirmation | null;
        };
        setResult({
          text: data.message ?? "",
          blocks: data.blocks,
          confirmation: data.pendingConfirmation ?? null,
        });
      } catch {
        setResult({ text: "Couldn't complete that.", isError: true });
      } finally {
        setPending(false);
      }
    },
    [activeBusiness?.id, pathname],
  );

  function submit() {
    const message = input.trim();
    // A pending confirmation can only be resolved by its own controls.
    if (!message || pending || confirmation) return;
    setInput("");
    setResult(null);
    void post({ message });
  }

  function collapse() {
    setExpanded(false);
    setResult(null);
    inputRef.current?.blur();
  }

  if (configured === null) return null;

  const wrapper = (children: React.ReactNode) => (
    <div className="pointer-events-none sticky bottom-0 z-40 mt-auto h-0">
      <div
        className={`absolute inset-x-3 bottom-3 flex sm:inset-x-6 sm:bottom-6 ${
          isHome || expanded ? "justify-center" : "justify-center sm:justify-end"
        }`}
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {children}
      </div>
    </div>
  );

  if (!configured) {
    return wrapper(
      <button
        type="button"
        disabled
        aria-label="Ask Lume"
        aria-disabled="true"
        className="pointer-events-auto flex h-9 items-center gap-1.5 rounded-lg border border-dashed border-border bg-card px-3 text-xs text-muted-foreground"
      >
        <SparkleIcon aria-hidden="true" className="size-3.5" />
        <span>Ask Lume unavailable</span>
      </button>,
    );
  }

  if (!isHome && !expanded) {
    return wrapper(
      <button
        type="button"
        aria-label="Ask Lume"
        aria-expanded={false}
        onClick={open}
        className="motion-control pointer-events-auto flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs text-muted-foreground shadow-xs hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <SparkleIcon aria-hidden="true" className="size-3.5" />
        <span>Ask Lume…</span>
      </button>,
    );
  }

  const suggestions = suggestionsFor(pathname);
  const showSuggestions = expanded && !result && !pending;

  return wrapper(
    <div className="pointer-events-auto w-full max-w-[680px] rounded-lg border border-border bg-card shadow-md focus-within:ring-2 focus-within:ring-ring sm:w-[600px]">
      {(pending || result) && (
        <div
          role="status"
          aria-live="polite"
          className="max-h-[60vh] space-y-2 overflow-y-auto border-b border-border p-3"
        >
          {pending && (
            <p className="text-xs text-muted-foreground">Checking…</p>
          )}
          {!pending && confirmation && (
            <div className="space-y-2">
              <p className="text-xs/relaxed font-medium text-foreground">
                {confirmation.title ?? "Confirm this action"}
              </p>
              {confirmation.summary && (
                <p className="text-xs/relaxed text-muted-foreground">
                  {confirmation.summary}
                </p>
              )}
              <div className="flex gap-2">
                <Button
                  ref={confirmRef}
                  type="button"
                  size="sm"
                  onClick={() =>
                    void post({
                      confirm: true,
                      confirmationId: confirmation.id,
                      message: confirmation.confirmLabel ?? "Confirm",
                    })
                  }
                >
                  {confirmation.confirmLabel ?? "Confirm"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setResult({ text: "Cancelled. Nothing changed." })
                  }
                >
                  {confirmation.cancelLabel ?? "Cancel"}
                </Button>
              </div>
            </div>
          )}
          {!pending && !confirmation && result && (
            <>
              {result.text && (
                <p
                  className={`text-xs/relaxed whitespace-pre-wrap ${
                    result.isError ? "text-destructive" : "text-foreground"
                  }`}
                >
                  {result.text}
                </p>
              )}
              {result.blocks && <Blocks blocks={result.blocks} />}
            </>
          )}
        </div>
      )}

      <form
        className="flex items-end gap-1.5 p-1.5"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <Textarea
          ref={inputRef}
          value={input}
          rows={1}
          aria-label="Ask Lume"
          placeholder="Ask Lume anything…"
          disabled={confirmation !== null}
          onFocus={() => {
            setExpanded(true);
            // Keeps the surface above the on-screen keyboard.
            window.setTimeout(
              () => inputRef.current?.scrollIntoView({ block: "center" }),
              300,
            );
          }}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") collapse();
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
          className="max-h-32 min-h-9 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
        />
        <Button
          type="submit"
          size="icon"
          aria-label="Send to Ask Lume"
          className="motion-control motion-control-icon"
          disabled={pending || confirmation !== null || !input.trim()}
        >
          <ArrowUpIcon aria-hidden="true" />
        </Button>
      </form>

      {showSuggestions && suggestions.length > 0 && (
        <ul
          aria-label="Suggested prompts"
          className="border-t border-border p-1.5"
        >
          {suggestions.map((suggestion) => (
            <li key={suggestion}>
              <button
                type="button"
                onClick={() => {
                  setInput(suggestion);
                  inputRef.current?.focus();
                }}
                className="w-full rounded-md px-2 py-1.5 text-left text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                {suggestion}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>,
  );
}
