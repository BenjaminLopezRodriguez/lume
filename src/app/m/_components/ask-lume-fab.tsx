"use client";

import { useRef } from "react";
import { ChatCircleIcon } from "@phosphor-icons/react";

import { useAskLume } from "@/app/m/_components/ask-lume-provider";
import { Button } from "@/components/ui/button";

export function AskLumeFab() {
  const { configured, capabilityLoading, openPanel, open } = useAskLume();
  const ref = useRef<HTMLButtonElement>(null);

  // Not configured -> no FAB at all.
  if (capabilityLoading || !configured) return null;

  return (
    <Button
      ref={ref}
      type="button"
      size="lg"
      variant="secondary"
      aria-label="Ask Lume"
      aria-haspopup="dialog"
      aria-expanded={open}
      onClick={() => openPanel({ returnFocusTo: ref.current })}
      className="fixed right-(--ask-lume-inset-x) bottom-(--ask-lume-inset-y) z-40 h-9 gap-1.5 rounded-full border border-border bg-secondary px-3 text-secondary-foreground shadow-xs hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring"
      style={
        {
          "--ask-lume-inset-x": "calc(env(safe-area-inset-right, 0px) + 24px)",
          "--ask-lume-inset-y": "calc(env(safe-area-inset-bottom, 0px) + 24px)",
        } as React.CSSProperties
      }
    >
      <ChatCircleIcon aria-hidden="true" className="text-primary" />
      <span>Ask Lume</span>
    </Button>
  );
}
