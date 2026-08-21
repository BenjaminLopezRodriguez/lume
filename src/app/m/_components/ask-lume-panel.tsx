"use client";

import { useEffect, useRef } from "react";
import { ArrowUpIcon } from "@phosphor-icons/react";

import {
  useAskLume,
  type AskLumeBlock,
  type AskLumeMessage,
} from "@/app/m/_components/ask-lume-provider";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useIsMobile } from "@/hooks/use-mobile";

function Blocks({ blocks }: { blocks: AskLumeBlock[] }) {
  return (
    <div className="space-y-2">
      {blocks.map((block, index) => {
        if (block.type === "text") {
          return (
            <p
              key={index}
              className="text-xs/relaxed whitespace-pre-wrap text-foreground"
            >
              {block.text}
            </p>
          );
        }
        return (
          <div
            key={index}
            className="rounded-md border border-border bg-card p-2"
          >
            {block.title && (
              <p className="mb-1 text-[0.625rem] font-medium tracking-wide text-muted-foreground uppercase">
                {block.title}
              </p>
            )}
            <ul className="divide-y divide-border">
              {block.items.map((item) => (
                <li key={item.id} className="py-1.5">
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
        );
      })}
    </div>
  );
}

function Confirmation({ message }: { message: AskLumeMessage }) {
  const { resolveConfirmation, isSending } = useAskLume();
  const confirmation = message.pendingConfirmation;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  if (!confirmation) return null;

  return (
    <div
      ref={ref}
      role="alertdialog"
      aria-label={confirmation.title ?? "Confirm this action"}
      tabIndex={-1}
      className="rounded-md border border-warning bg-warning/10 p-3 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <p className="text-xs/relaxed font-medium text-foreground">
        {confirmation.title ?? "Confirm this action"}
      </p>
      {confirmation.summary && (
        <p className="mt-1 text-xs/relaxed text-muted-foreground">
          {confirmation.summary}
        </p>
      )}
      <div className="mt-2 flex gap-2">
        <Button
          type="button"
          size="sm"
          disabled={isSending}
          onClick={() => void resolveConfirmation(message.id, "confirm")}
        >
          {confirmation.confirmLabel ?? "Confirm"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => void resolveConfirmation(message.id, "cancel")}
        >
          {confirmation.cancelLabel ?? "Cancel"}
        </Button>
      </div>
    </div>
  );
}

export function AskLumePanel() {
  const {
    open,
    closePanel,
    configured,
    messages,
    input,
    setInput,
    isSending,
    send,
    suggestions,
  } = useAskLume();
  const isMobile = useIsMobile();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ block: "end" });
  }, [open, messages]);

  if (!configured) return null;

  function submit() {
    const value = input.trim();
    if (!value) return;
    void send(value);
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) closePanel();
      }}
    >
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          inputRef.current?.focus();
        }}
        className={
          isMobile
            ? "h-[92dvh] max-h-[92dvh] gap-0 rounded-t-xl p-0 sm:max-w-none"
            : "w-full gap-0 p-0 sm:w-[400px] sm:max-w-[440px]"
        }
      >
        <SheetHeader className="border-b border-border p-4">
          <SheetTitle>Ask Lume</SheetTitle>
          <SheetDescription>
            Answers about this business. Actions always ask first.
          </SheetDescription>
        </SheetHeader>

        <div
          className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4"
          role="log"
          aria-live="polite"
          aria-label="Ask Lume conversation"
        >
          {messages.length === 0 && suggestions.length > 0 && (
            <div className="space-y-2">
              <p className="text-[0.625rem] font-medium tracking-wide text-muted-foreground uppercase">
                Try asking
              </p>
              <ul className="flex flex-wrap gap-1.5">
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
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={
                message.role === "user"
                  ? "ml-auto w-fit max-w-[85%] rounded-md bg-secondary px-2.5 py-1.5"
                  : "space-y-2"
              }
            >
              <p className="sr-only">
                {message.role === "user" ? "You said" : "Ask Lume said"}
              </p>
              {message.text && (
                <p
                  className={
                    message.isError
                      ? "text-xs/relaxed whitespace-pre-wrap text-destructive"
                      : "text-xs/relaxed whitespace-pre-wrap text-foreground"
                  }
                >
                  {message.text}
                </p>
              )}
              {message.blocks && message.blocks.length > 0 && (
                <Blocks blocks={message.blocks} />
              )}
              {message.pendingConfirmation && (
                <Confirmation message={message} />
              )}
            </div>
          ))}

          {isSending && (
            <p className="text-xs/relaxed text-muted-foreground">Thinking…</p>
          )}
          <div ref={endRef} />
        </div>

        <form
          className="flex items-end gap-2 border-t border-border bg-popover p-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)]"
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
            className="max-h-32 min-h-9"
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
      </SheetContent>
    </Sheet>
  );
}
