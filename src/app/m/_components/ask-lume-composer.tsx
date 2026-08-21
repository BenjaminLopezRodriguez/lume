"use client";

import { useRef } from "react";
import { ArrowUpIcon, WarningCircleIcon } from "@phosphor-icons/react";

import { useAskLume } from "@/app/m/_components/ask-lume-provider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function AskLumeComposer() {
  const {
    configured,
    capabilityLoading,
    input,
    setInput,
    isSending,
    send,
    openPanel,
    suggestions,
  } = useAskLume();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  if (capabilityLoading) return null;

  if (!configured) {
    return (
      <div className="sticky bottom-0 z-20 border-t border-border bg-card px-4 py-3 sm:px-6">
        <div
          className="mx-auto flex w-full max-w-3xl items-start gap-2 rounded-md border border-dashed border-border bg-muted/40 px-3 py-3"
          role="note"
        >
          <WarningCircleIcon
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-muted-foreground"
          />
          <div className="space-y-1">
            <p className="text-xs/relaxed font-medium text-foreground">
              Ask Lume isn&apos;t configured yet.
            </p>
            <Textarea
              disabled
              readOnly
              aria-label="Ask Lume (unavailable)"
              value=""
              placeholder="Unavailable"
              rows={1}
              className="min-h-9 cursor-not-allowed opacity-60"
            />
          </div>
        </div>
      </div>
    );
  }

  function submit() {
    const value = input.trim();
    if (!value) return;
    openPanel({ returnFocusTo: inputRef.current });
    void send(value);
  }

  return (
    <div className="sticky bottom-0 z-20 border-t border-border bg-card px-4 py-3 sm:px-6">
      <div className="mx-auto w-full max-w-3xl space-y-2">
        {suggestions.length > 0 && (
          <ul className="flex flex-wrap gap-1.5" aria-label="Suggested prompts">
            {suggestions.map((suggestion) => (
              <li key={suggestion}>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setInput(suggestion);
                    inputRef.current?.focus();
                  }}
                >
                  {suggestion}
                </Button>
              </li>
            ))}
          </ul>
        )}
        <form
          className="flex items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                submit();
              }
            }}
            rows={1}
            aria-label="Ask Lume"
            placeholder="Ask anything about your business…"
            className="min-h-9"
          />
          <Button
            type="submit"
            size="icon"
            aria-label="Send to Ask Lume"
            disabled={isSending || input.trim().length === 0}
          >
            <ArrowUpIcon aria-hidden="true" />
          </Button>
        </form>
      </div>
    </div>
  );
}
