"use client";

import { useState } from "react";
import { Plus, X } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ELEMENT_OPTIONS,
  SCHEME_LABELS,
  SITE_SCHEMES,
  type SiteScheme,
} from "@/lib/site-types";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";

type Props = {
  businessId: string;
  onEditSite: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const SCHEMES = Object.keys(SCHEME_LABELS) as SiteScheme[];

const CATEGORIES = [
  { id: "restaurant", label: "Restaurant", defaults: ["checkout", "menu_preview", "hours", "location"] },
  { id: "event",      label: "Event",      defaults: ["checkout", "about", "location"] },
  { id: "services",   label: "Service",    defaults: ["checkout", "about", "hours"] },
  { id: "shop",       label: "Shop",       defaults: ["checkout", "about", "social"] },
] as const;

const ELEMENT_LABEL = Object.fromEntries(ELEMENT_OPTIONS.map((e) => [e.type, e.label]));

export function CreateSiteDialog({ businessId, onEditSite, open: openProp, onOpenChange }: Props) {
  const utils = api.useUtils();

  const saveSite = api.presence.saveSite.useMutation({
    onSuccess: () => utils.presence.invalidate(),
  });

  const controlled = openProp !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlled ? openProp! : internalOpen;
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCaps, setSelectedCaps] = useState<string[]>(["checkout"]);
  const [selectedScheme, setSelectedScheme] = useState<SiteScheme>("neutral");

  function reset() {
    setStep(1);
    setSelectedCategory(null);
    setSelectedCaps(["checkout"]);
    setSelectedScheme("neutral");
  }

  function handleOpenChange(next: boolean) {
    if (!controlled) setInternalOpen(next);
    onOpenChange?.(next);
    if (!next) reset();
  }

  function selectCategory(id: string, defaults: readonly string[]) {
    setSelectedCategory(id);
    setSelectedCaps([...defaults]);
  }

  function removeCap(type: string) {
    if (type === "checkout") return;
    setSelectedCaps((prev) => prev.filter((c) => c !== type));
  }

  function addCap(type: string) {
    setSelectedCaps((prev) => (prev.includes(type) ? prev : [...prev, type]));
  }

  async function handleSave(editAfter: boolean) {
    await saveSite.mutateAsync({
      businessId,
      scheme: selectedScheme,
      layout: "single",
      sections: selectedCaps.map((type) => ({ type })),
    });
    handleOpenChange(false);
    reset();
    if (editAfter) onEditSite();
  }

  const availableToAdd = ELEMENT_OPTIONS.filter((e) => !selectedCaps.includes(e.type));

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!controlled && (
        <DialogTrigger asChild>
          <Button
            type="button"
            className="mt-4 h-10 rounded-lg bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Plus size={14} weight="bold" aria-hidden />
            Create site
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="gap-0 p-0 sm:max-w-md">
        {/* Step 1 — Capabilities by category */}
        {step === 1 && (
          <>
            <DialogHeader className="border-b border-border px-5 py-4">
              <DialogTitle className="text-base font-semibold text-foreground">
                What will your site include?
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Pick your category — you can always add more.
              </DialogDescription>
            </DialogHeader>

            <div className="divide-y divide-border">
              {CATEGORIES.map(({ id, label, defaults }) => {
                const active = selectedCategory === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => selectCategory(id, defaults)}
                    className={cn(
                      "motion-control w-full px-5 py-4 text-left",
                      active ? "bg-muted" : "hover:bg-muted",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground">{label}</p>
                      <span
                        className={cn(
                          "flex size-4 items-center justify-center rounded-full border-2 transition-colors",
                          active ? "border-primary bg-primary" : "border-border",
                        )}
                      >
                        {active && (
                          <span className="size-1.5 rounded-full bg-card" />
                        )}
                      </span>
                    </div>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {defaults.map((type) => (
                        <span
                          key={type}
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-xs font-medium",
                            active
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {ELEMENT_LABEL[type] ?? type}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Add more chips — only shown when a category is selected */}
            {selectedCategory && availableToAdd.length > 0 && (
              <div className="border-t border-border px-5 py-4">
                <p className="mb-2.5 text-xs font-medium text-muted-foreground/70">Add more</p>
                <div className="flex flex-wrap gap-1.5">
                  {/* Currently selected extras (beyond category defaults) */}
                  {selectedCaps
                    .filter(
                      (c) =>
                        !CATEGORIES.find((cat) => cat.id === selectedCategory)?.defaults.includes(c as never),
                    )
                    .map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => removeCap(type)}
                        className="motion-control flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground"
                      >
                        {ELEMENT_LABEL[type] ?? type}
                        <X size={10} weight="bold" />
                      </button>
                    ))}
                  {/* Available to add */}
                  {availableToAdd.map(({ type, label }) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => addCap(type)}
                      className="motion-control flex items-center gap-1 rounded-full border border-dashed border-border px-2.5 py-0.5 text-xs text-muted-foreground/70 hover:border-foreground/30 hover:text-foreground"
                    >
                      <Plus size={10} weight="bold" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end border-t border-border px-5 py-4">
              <Button
                type="button"
                className="h-10 rounded-lg bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                disabled={!selectedCategory}
                onClick={() => setStep(2)}
              >
                Next →
              </Button>
            </div>
          </>
        )}

        {/* Step 2 — Scheme */}
        {step === 2 && (
          <>
            <DialogHeader className="border-b border-border px-5 py-4">
              <DialogTitle className="text-base font-semibold text-foreground">
                Choose a look
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Pick a color scheme for your site.
              </DialogDescription>
            </DialogHeader>
            <div className="px-5 py-5">
              <div className="grid grid-cols-3 gap-3">
                {SCHEMES.map((scheme) => {
                  const s = SITE_SCHEMES[scheme];
                  const active = selectedScheme === scheme;
                  return (
                    <button
                      key={scheme}
                      type="button"
                      className="motion-control flex flex-col items-center gap-1.5"
                      onClick={() => setSelectedScheme(scheme)}
                    >
                      <span
                        className="flex h-[72px] w-[72px] items-center justify-center rounded-xl"
                        style={{
                          background: s.bg,
                          border: `2px solid ${active ? "var(--chart-1)" : s.border}`,
                        }}
                      >
                        <span
                          className="h-5 w-5 rounded-full"
                          style={{ background: s.accent }}
                        />
                      </span>
                      <span
                        className="text-xs"
                        style={{ color: active ? "var(--chart-1)" : "var(--muted-foreground)" }}
                      >
                        {SCHEME_LABELS[scheme]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-2 border-t border-border px-5 py-4">
              <Button
                type="button"
                variant="outline"
                className="h-10 flex-1 rounded-lg border-border"
                onClick={() => setStep(1)}
              >
                Back
              </Button>
              <Button
                type="button"
                className="h-10 flex-1 rounded-lg bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                onClick={() => setStep(3)}
              >
                Next →
              </Button>
            </div>
          </>
        )}

        {/* Step 3 — Done */}
        {step === 3 && (
          <>
            <DialogHeader className="border-b border-border px-5 py-4">
              <DialogTitle className="text-base font-semibold text-foreground">
                Your site is ready
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Edit your site to customize sections and content, or launch with
                your selected look.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-2 px-5 py-5">
              <Button
                type="button"
                className="h-10 flex-1 rounded-lg bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                disabled={saveSite.isPending}
                onClick={() => handleSave(true)}
              >
                {saveSite.isPending ? "Saving…" : "Edit site"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-10 flex-1 rounded-lg border-border"
                disabled={saveSite.isPending}
                onClick={() => handleSave(false)}
              >
                Launch
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
