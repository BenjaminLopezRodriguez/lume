"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";

import { useBusinesses } from "@/app/m/_components/business-provider";
import { AskLumeComposer } from "@/app/m/_components/ask-lume-composer";
import { AskLumeFab } from "@/app/m/_components/ask-lume-fab";
import { AskLumePanel } from "@/app/m/_components/ask-lume-panel";

/* ── Response contract (server: POST /api/agent) ─────────────────────────── */

export type AskLumeEntity = {
  id: string;
  label: string;
  detail?: string;
  href?: string;
};

export type AskLumeBlock =
  | { type: "text"; text: string }
  | { type: "list" | "entities"; title?: string; items: AskLumeEntity[] };

export type AskLumeConfirmation = {
  id?: string;
  title?: string;
  summary?: string;
  confirmLabel?: string;
  cancelLabel?: string;
};

export type AskLumeMessage = {
  id: string;
  role: "user" | "agent";
  text: string;
  blocks?: AskLumeBlock[];
  pendingConfirmation?: AskLumeConfirmation | null;
  isError?: boolean;
};

/* ── Static, trusted suggestions. Only surfaces this repo actually has. ──── */

export const HOME_ROUTE = "/m/dashboard";

const ROUTE_SUGGESTIONS: Record<string, string[]> = {
  "/m/dashboard": [
    "What changed since yesterday?",
    "Which customers came back this week?",
    "What should I set up next?",
  ],
  "/m/orders": [
    "Show my most recent orders",
    "Which orders are still open?",
    "Summarise this week's orders",
  ],
  "/m/ownership": [
    "Who are my repeat customers?",
    "Which customers haven't returned?",
    "Summarise my customer list",
  ],
  "/m/store": [
    "What's in my catalog?",
    "Which items have no description?",
  ],
  "/m/services": [
    "List my services",
    "Which services have no price set?",
  ],
  "/m/event": [
    "List my upcoming events",
    "Which events have unused tickets?",
  ],
  "/m/restaurant": [
    "What's on my menu?",
    "Which menu items are missing a price?",
  ],
  "/m/share": [
    "Which checkout links are live?",
    "How do I share my checkout?",
  ],
  "/m/presence": [
    "Is my site published?",
    "What's on my web presence page?",
  ],
  "/m/agents": [
    "What can my agents do?",
    "Which agents are connected?",
  ],
  "/m/connect": [
    "What integrations are connected?",
  ],
  "/m/support": [
    "What open support threads do I have?",
  ],
  "/m/resolution": [
    "What needs my attention?",
  ],
  "/m/settings": [
    "What business details are missing?",
  ],
};

export function suggestionsForRoute(pathname: string | null): string[] {
  if (!pathname) return [];
  const match = Object.keys(ROUTE_SUGGESTIONS)
    .filter((route) => pathname === route || pathname.startsWith(`${route}/`))
    .sort((a, b) => b.length - a.length)[0];
  return (match ? ROUTE_SUGGESTIONS[match] : undefined) ?? [];
}

/* ── Context ─────────────────────────────────────────────────────────────── */

type AskLumeContextValue = {
  configured: boolean;
  capabilityLoading: boolean;
  open: boolean;
  openPanel: (opts?: { returnFocusTo?: HTMLElement | null }) => void;
  closePanel: () => void;
  messages: AskLumeMessage[];
  input: string;
  setInput: (value: string) => void;
  isSending: boolean;
  send: (message: string) => Promise<void>;
  resolveConfirmation: (
    messageId: string,
    decision: "confirm" | "cancel",
  ) => Promise<void>;
  suggestions: string[];
};

const AskLumeContext = createContext<AskLumeContextValue | null>(null);

export function useAskLume() {
  const context = useContext(AskLumeContext);
  if (!context) {
    throw new Error("useAskLume must be used within AskLumeProvider");
  }
  return context;
}

let messageCounter = 0;
function nextId(prefix: string) {
  messageCounter += 1;
  return `${prefix}-${messageCounter}`;
}

export function AskLumeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { activeBusiness } = useBusinesses();

  const [configured, setConfigured] = useState(false);
  const [capabilityLoading, setCapabilityLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AskLumeMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/agent/capability");
        const data: unknown = res.ok ? await res.json() : null;
        if (cancelled) return;
        setConfigured(
          typeof data === "object" &&
            data !== null &&
            (data as { configured?: unknown }).configured === true,
        );
      } catch {
        if (!cancelled) setConfigured(false);
      } finally {
        if (!cancelled) setCapabilityLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const openPanel = useCallback(
    (opts?: { returnFocusTo?: HTMLElement | null }) => {
      returnFocusRef.current =
        opts?.returnFocusTo ??
        (document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null);
      setOpen(true);
    },
    [],
  );

  const closePanel = useCallback(() => {
    setOpen(false);
    const target = returnFocusRef.current;
    if (target?.isConnected) {
      window.setTimeout(() => target.focus(), 0);
    }
  }, []);

  const post = useCallback(
    async (body: Record<string, unknown>) => {
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
        setConfigured(false);
        throw new Error("Ask Lume isn't configured yet.");
      }
      if (!res.ok) throw new Error("Ask Lume couldn't answer that request.");
      return (await res.json()) as {
        message?: string;
        blocks?: AskLumeBlock[];
        pendingConfirmation?: AskLumeConfirmation | null;
      };
    },
    [activeBusiness?.id, pathname],
  );

  const send = useCallback(
    async (raw: string) => {
      const message = raw.trim();
      if (!message || isSending || !configured) return;
      setInput("");
      setIsSending(true);
      setMessages((prev) => [
        ...prev,
        { id: nextId("u"), role: "user", text: message },
      ]);
      try {
        const data = await post({ message });
        setMessages((prev) => [
          ...prev,
          {
            id: nextId("a"),
            role: "agent",
            text: data.message ?? "",
            blocks: data.blocks,
            pendingConfirmation: data.pendingConfirmation ?? null,
          },
        ]);
      } catch (error) {
        setMessages((prev) => [
          ...prev,
          {
            id: nextId("a"),
            role: "agent",
            text:
              error instanceof Error
                ? error.message
                : "Ask Lume couldn't answer that request.",
            isError: true,
          },
        ]);
      } finally {
        setIsSending(false);
      }
    },
    [configured, isSending, post],
  );

  const resolveConfirmation = useCallback(
    async (messageId: string, decision: "confirm" | "cancel") => {
      const target = messages.find((m) => m.id === messageId);
      const confirmation = target?.pendingConfirmation;
      if (!confirmation) return;

      // Clear the pending state first so neither path can be double-submitted.
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, pendingConfirmation: null } : m,
        ),
      );

      if (decision === "cancel") {
        // No request is made — cancel must never mutate.
        setMessages((prev) => [
          ...prev,
          { id: nextId("a"), role: "agent", text: "Cancelled. Nothing changed." },
        ]);
        return;
      }

      setIsSending(true);
      try {
        const data = await post({
          message: confirmation.confirmLabel ?? "Confirm",
          entityId: confirmation.id,
          confirmationId: confirmation.id,
          confirm: true,
        });
        setMessages((prev) => [
          ...prev,
          {
            id: nextId("a"),
            role: "agent",
            text: data.message ?? "",
            blocks: data.blocks,
            pendingConfirmation: data.pendingConfirmation ?? null,
          },
        ]);
      } catch (error) {
        setMessages((prev) => [
          ...prev,
          {
            id: nextId("a"),
            role: "agent",
            text:
              error instanceof Error
                ? error.message
                : "Ask Lume couldn't complete that action.",
            isError: true,
          },
        ]);
      } finally {
        setIsSending(false);
      }
    },
    [messages, post],
  );

  const suggestions = useMemo(() => suggestionsForRoute(pathname), [pathname]);

  // Cmd/Ctrl+J. Cmd+B is the sidebar toggle (components/ui/sidebar.tsx) —
  // J is unused elsewhere in this repo.
  useEffect(() => {
    if (!configured) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === "j" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((prev) => {
          if (prev) return prev;
          returnFocusRef.current =
            document.activeElement instanceof HTMLElement
              ? document.activeElement
              : null;
          return true;
        });
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [configured]);

  const value = useMemo<AskLumeContextValue>(
    () => ({
      configured,
      capabilityLoading,
      open,
      openPanel,
      closePanel,
      messages,
      input,
      setInput,
      isSending,
      send,
      resolveConfirmation,
      suggestions,
    }),
    [
      configured,
      capabilityLoading,
      open,
      openPanel,
      closePanel,
      messages,
      input,
      isSending,
      send,
      resolveConfirmation,
      suggestions,
    ],
  );

  return (
    <AskLumeContext.Provider value={value}>{children}</AskLumeContext.Provider>
  );
}

/**
 * Route-based surface switch. Home renders the composer, every other /m route
 * renders the FAB. Never both. The panel is shared by both surfaces.
 */
export function AskLumeSurface() {
  const pathname = usePathname();
  const isHome = pathname === HOME_ROUTE;

  return (
    <>
      {isHome ? <AskLumeComposer /> : <AskLumeFab />}
      <AskLumePanel />
    </>
  );
}
