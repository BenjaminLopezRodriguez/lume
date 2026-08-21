"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowUpIcon, SparkleIcon } from "@phosphor-icons/react";

import { useBusinesses } from "@/app/m/_components/business-provider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

/* ── Server contract (POST /api/agent) ───────────────────────────────────── */

/**
 * What the server actually sends (see AgentBlock in src/ai/executor.ts):
 *   { kind: "tool_result", tool, data }
 * `data` is a tool envelope, normally { hasData, count, items }, but it is
 * typed `unknown` server-side — so nothing here may assume a shape. Every
 * field is probed before use; a block this component cannot read renders
 * nothing rather than throwing.
 */
type Block = { kind?: string; tool?: string; data?: unknown };

import { blockRows } from "@/lib/agent-blocks";
import { Markdown } from "@/lib/markdown";

type Confirmation = {
  id?: string;
  title?: string;
  summary?: string;
  confirmLabel?: string;
  cancelLabel?: string;
};

/**
 * Response status. Anything unrecognised is treated as "completed" — the
 * client never crashes on a status it has not been taught.
 */
type Status =
  | "waiting_for_user"
  | "completed"
  | "confirmation_required"
  | "failed";

/** One visible exchange line. Not a chat message: no author, no timestamp. */
type Turn = {
  key: string;
  from: "merchant" | "lume";
  text: string;
  blocks?: Block[];
  isError?: boolean;
};

/* ── Defensive response probing ──────────────────────────────────────────── */

function str(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function readConfirmation(value: unknown): Confirmation | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  return {
    id: str(record.id),
    title: str(record.title),
    summary: str(record.summary),
    confirmLabel: str(record.confirmLabel),
    cancelLabel: str(record.cancelLabel),
  };
}

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
      {blocks.map((block, index) => {
        const rows = blockRows(block);

        if (rows.length === 0) return null;

        return (
          <div key={index} className="rounded-md border border-border">
            <ul className="divide-y divide-border">
              {rows.map((row) => (
                <li key={row.key} className="px-2 py-1.5">
                  <span className="text-xs/relaxed font-medium text-foreground">
                    {row.label}
                  </span>
                  {row.detail && (
                    <p className="text-[0.6875rem] text-muted-foreground">
                      {row.detail}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </>
  );
}

/**
 * Merchant turns are indented behind a rule and muted; Lume turns sit flush at
 * full contrast and render Markdown. The distinction is structural (indent +
 * rule) as well as tonal, so colour is never the only signal, and a screen
 * reader gets an explicit attribution.
 */
function TurnView({ turn }: { turn: Turn }) {
  if (turn.from === "merchant") {
    return (
      <div className="border-l-2 border-border pl-2">
        <span className="sr-only">You asked: </span>
        <p className="text-xs/relaxed whitespace-pre-wrap text-muted-foreground">
          {turn.text}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <span className="sr-only">Lume replied: </span>
      {turn.isError ? (
        <p className="text-xs/relaxed text-destructive">
          <span className="font-medium">Failed · </span>
          {turn.text}
        </p>
      ) : (
        turn.text && <Markdown>{turn.text}</Markdown>
      )}
      {turn.blocks && <Blocks blocks={turn.blocks} />}
    </div>
  );
}

/* ── The one floating command surface ────────────────────────────────────── */

export function AskLumeSurface() {
  const pathname = usePathname() ?? "";
  const { activeBusiness } = useBusinesses();
  const isHome = pathname === HOME_ROUTE;
  const businessId = activeBusiness?.id;

  const [configured, setConfigured] = useState<boolean | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  /** Server-issued thread id. Ref, not state: it is sent, never rendered. */
  const conversationId = useRef<string | null>(null);
  /** Monotonic key source — no Date.now() during render (hydration safety). */
  const turnSeq = useRef(0);

  const nextKey = useCallback(() => {
    turnSeq.current += 1;
    return `t${turnSeq.current}`;
  }, []);

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

  const reset = useCallback(() => {
    conversationId.current = null;
    setTurns([]);
    setConfirmation(null);
  }, []);

  // Task state is never carried across businesses. Switching starts fresh.
  useEffect(() => {
    reset();
  }, [businessId, reset]);

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

  // The newest turn is at the bottom; the surface grows upward from the input.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns, pending, confirmation]);

  const post = useCallback(
    async (body: Record<string, unknown>) => {
      setPending(true);
      setConfirmation(null);
      try {
        const res = await fetch("/api/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            businessId,
            route: pathname,
            ...(conversationId.current
              ? { conversationId: conversationId.current }
              : {}),
            ...body,
          }),
        });
        if (res.status === 503) {
          setConfigured(false); // a 503 retires the surface
          return;
        }
        if (!res.ok) throw new Error("failed");

        const data: unknown = await res.json();
        const record =
          data && typeof data === "object" ? (data as Record<string, unknown>) : {};

        const threadId = str(record.conversationId);
        if (threadId) conversationId.current = threadId;

        const status = (str(record.status) ?? "completed") as Status;
        const nextConfirmation =
          status === "confirmation_required"
            ? readConfirmation(record.pendingConfirmation)
            : null;

        const text = str(record.message) ?? "";
        const blocks = Array.isArray(record.blocks)
          ? (record.blocks as Block[])
          : undefined;

        if (text || blocks) {
          setTurns((prev) => [
            ...prev,
            {
              key: nextKey(),
              from: "lume",
              text,
              blocks,
              isError: status === "failed",
            },
          ]);
        }

        setConfirmation(nextConfirmation);

        // "waiting_for_user" means Lume asked something — stay ready to answer.
        if (!nextConfirmation) {
          window.setTimeout(() => inputRef.current?.focus(), 0);
        }
      } catch {
        setTurns((prev) => [
          ...prev,
          {
            key: nextKey(),
            from: "lume",
            text: "Couldn't complete that.",
            isError: true,
          },
        ]);
      } finally {
        setPending(false);
      }
    },
    [businessId, nextKey, pathname],
  );

  function submit() {
    const message = input.trim();
    // A pending confirmation can only be resolved by its own controls.
    if (!message || pending || confirmation) return;
    setInput("");
    setTurns((prev) => [
      ...prev,
      { key: nextKey(), from: "merchant", text: message },
    ]);
    void post({ message });
  }

  function collapse() {
    // The conversation survives collapse on the same business.
    setExpanded(false);
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
  const hasConversation = turns.length > 0;
  const showSuggestions = expanded && !hasConversation && !pending;

  return wrapper(
    <div
      onKeyDown={(event) => {
        if (event.key === "Escape") collapse();
      }}
      className="pointer-events-auto w-full max-w-[680px] rounded-lg border border-border bg-card shadow-md focus-within:ring-2 focus-within:ring-ring sm:w-[600px]"
    >
      {(pending || hasConversation) && (
        <div className="border-b border-border">
          {hasConversation && (
            <div className="flex items-center justify-end px-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  reset();
                  inputRef.current?.focus();
                }}
                className="motion-control rounded-md px-1.5 py-0.5 text-[0.6875rem] text-muted-foreground transition-colors duration-(--duration-instant) ease-snap hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                New conversation
              </button>
            </div>
          )}

          <div
            ref={scrollRef}
            role="log"
            aria-live="polite"
            aria-label="Ask Lume conversation"
            className="max-h-[60vh] space-y-2.5 overflow-y-auto p-3"
          >
            {turns.map((turn) => (
              <TurnView key={turn.key} turn={turn} />
            ))}

            {pending && <p className="text-xs text-muted-foreground">Working…</p>}

            {!pending && confirmation && (
              <div className="space-y-2 rounded-md border border-border p-2">
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
                      })
                    }
                  >
                    {confirmation.confirmLabel ?? "Confirm"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      // No cancel endpoint exists: an abandoned proposal expires.
                      setConfirmation(null);
                      setTurns((prev) => [
                        ...prev,
                        {
                          key: nextKey(),
                          from: "lume",
                          text: "Cancelled. Nothing changed.",
                        },
                      ]);
                      inputRef.current?.focus();
                    }}
                  >
                    {confirmation.cancelLabel ?? "Cancel"}
                  </Button>
                </div>
              </div>
            )}
          </div>
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
          placeholder={
            hasConversation ? "Reply to Lume…" : "Ask Lume anything…"
          }
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
