"use client";

import { useState } from "react";

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { SITE_SCHEMES } from "@/lib/site-types";
import { api } from "@/trpc/react";
import { X, Plus, ArrowsOut, PencilSimple } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

type SiteLayout = "single" | "split" | "cardstack";
type SiteSection =
  | { type: "hero"; title?: string; subtitle?: string }
  | { type: "checkout"; label?: string }
  | { type: "about"; body?: string }
  | { type: "hours"; text?: string }
  | { type: "location"; mapUrl?: string; mapLabel?: string }
  | { type: "social"; links?: { platform: string; url: string }[] }
  | { type: "menu_preview" };

type SchemeColors = (typeof SITE_SCHEMES)[keyof typeof SITE_SCHEMES];

function SlotPreview({ type, scheme }: { type: string; scheme: SchemeColors }) {
  switch (type) {
    case "hero":
      return (
        <div className="flex w-full flex-col items-center gap-1.5 px-6">
          <div className="h-3 w-3/5 rounded-full" style={{ background: scheme.text, opacity: 0.85 }} />
          <div className="h-2 w-2/5 rounded-full" style={{ background: scheme.muted, opacity: 0.6 }} />
        </div>
      );
    case "checkout":
      return (
        <div className="flex h-8 w-4/5 items-center justify-center rounded-lg" style={{ background: scheme.accent }}>
          <div className="h-2 w-2/5 rounded-full bg-card opacity-90" />
        </div>
      );
    case "about":
      return (
        <div className="flex w-full flex-col gap-1.5 px-6">
          <div className="h-2 w-full rounded-full" style={{ background: scheme.muted, opacity: 0.5 }} />
          <div className="h-2 w-5/6 rounded-full" style={{ background: scheme.muted, opacity: 0.4 }} />
          <div className="h-2 w-3/4 rounded-full" style={{ background: scheme.muted, opacity: 0.35 }} />
        </div>
      );
    case "hours":
      return (
        <div className="flex w-full flex-col gap-2 px-6">
          <div className="h-1.5 w-1/4 rounded-full" style={{ background: scheme.muted, opacity: 0.4 }} />
          <div className="h-2 w-2/5 rounded-full" style={{ background: scheme.text, opacity: 0.6 }} />
        </div>
      );
    case "location":
      return <div className="h-2 w-2/5 rounded-full" style={{ background: scheme.accent, opacity: 0.7 }} />;
    case "social":
      return (
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="size-5 rounded-full" style={{ background: scheme.accent, opacity: 0.6 }} />
          ))}
        </div>
      );
    case "menu_preview":
      return <div className="h-2 w-1/3 rounded-full" style={{ background: scheme.accent, opacity: 0.7 }} />;
    default:
      return null;
  }
}

const LAYOUTS: { id: SiteLayout; label: string; desc: string }[] = [
  { id: "single",    label: "Single",     desc: "Stacked sections, full width" },
  { id: "split",     label: "Split",      desc: "Content left, checkout right" },
  { id: "cardstack", label: "Card Stack", desc: "Elevated cards, layered look" },
];

const LAYOUT_SLOT_COUNT: Record<SiteLayout, number> = {
  single: 4,
  split: 3,
  cardstack: 3,
};

const ELEMENTS = [
  { type: "hero",         label: "Hero",     desc: "Big title + tagline" },
  { type: "checkout",     label: "Checkout", desc: "Payment button" },
  { type: "about",        label: "About",    desc: "Short description" },
  { type: "hours",        label: "Hours",    desc: "Business hours" },
  { type: "location",     label: "Location", desc: "Map link" },
  { type: "social",       label: "Social",   desc: "Icon links" },
  { type: "menu_preview", label: "Menu",     desc: "View menu link" },
] as const;

// ── Props ─────────────────────────────────────────────────────────────────────

type Presence = {
  layout?: string | null;
  scheme?: string | null;
  sections?: unknown;
};

function getScheme(key: string | null | undefined): SchemeColors {
  return SITE_SCHEMES[(key ?? "neutral") as keyof typeof SITE_SCHEMES] ?? SITE_SCHEMES.neutral;
}

type Props = {
  open: boolean;
  onClose: () => void;
  businessId: string;
  presence?: Presence | null;
};

// ── Component ─────────────────────────────────────────────────────────────────

export function SiteEditorOverlay({ open, onClose, businessId, presence }: Props) {
  const [layout, setLayout] = useState<SiteLayout>(
    (presence?.layout as SiteLayout | null) ?? "single",
  );

  const [slots, setSlots] = useState<(SiteSection | null)[]>(() => {
    const existing = presence?.sections as SiteSection[] | null;
    const count = LAYOUT_SLOT_COUNT[layout];
    if (existing?.length) {
      return [
        ...existing.slice(0, count),
        ...Array<null>(Math.max(0, count - existing.length)).fill(null),
      ];
    }
    return Array<null>(count).fill(null);
  });

  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [showLayoutPicker, setShowLayoutPicker] = useState(!presence?.layout);

  // ── Mutation ────────────────────────────────────────────────────────────────

  const utils = api.useUtils();
  const saveMutation = api.presence.saveSite.useMutation({
    onSuccess: async () => {
      await utils.presence.invalidate();
      onClose();
    },
  });

  // ── Handlers ────────────────────────────────────────────────────────────────

  function handleLayoutChange(l: SiteLayout) {
    setLayout(l);
    setSlots(Array<null>(LAYOUT_SLOT_COUNT[l]).fill(null));
    setShowLayoutPicker(false);
  }

  function handleSave() {
    saveMutation.mutate({
      businessId,
      layout,
      sections: slots.filter(Boolean) as Record<string, unknown>[],
    });
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  if (!open) return null;

  const scheme = getScheme(presence?.scheme);

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: scheme.bg }}>
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
        <button
          onClick={onClose}
          className="motion-control motion-control-icon flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
        >
          <X size={18} />
        </button>
        <p className="text-sm font-semibold text-foreground">Edit site</p>
        <button
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="motion-control h-8 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground disabled:opacity-50"
        >
          {saveMutation.isPending ? "Saving…" : "Save"}
        </button>
      </div>

      {/* Layout label + change button */}
      <div className="flex items-center justify-between px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground/70">
          Layout: {LAYOUTS.find((l) => l.id === layout)?.label}
        </p>
        <button
          onClick={() => setShowLayoutPicker(true)}
          className="motion-control text-xs font-medium text-primary"
        >
          Change
        </button>
      </div>

      {/* Slot grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-8">
        <div
          className={cn(
            "flex flex-col gap-3",
            layout === "split" && "sm:grid sm:grid-cols-2",
          )}
        >
          {slots.map((slot, i) =>
            slot ? (
              <button
                key={i}
                type="button"
                onClick={() => setActiveSlot(i)}
                className="motion-control flex min-h-[96px] w-full flex-col items-center justify-center gap-3 rounded-xl border"
                style={{ background: scheme.bg, borderColor: scheme.border }}
              >
                <SlotPreview type={slot.type} scheme={scheme} />
                <p
                  className="text-[10px] font-medium uppercase tracking-wide"
                  style={{ color: scheme.muted }}
                >
                  {slot.type.replace("_", " ")}
                </p>
              </button>
            ) : (
              <button
                key={i}
                type="button"
                onClick={() => setActiveSlot(i)}
                className="motion-control flex min-h-[96px] w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-transparent text-muted-foreground/70 hover:border-foreground/30"
              >
                <Plus size={20} />
                <p className="text-xs">Add element</p>
              </button>
            ),
          )}
        </div>
      </div>

      {/* Layout Picker Drawer */}
      <Drawer open={showLayoutPicker} onOpenChange={setShowLayoutPicker}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Choose layout</DrawerTitle>
          </DrawerHeader>
          <div className="flex flex-col divide-y divide-border px-4 pb-6">
            {LAYOUTS.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => handleLayoutChange(l.id)}
                className={cn(
                  "motion-control flex items-center gap-3 py-4 text-left",
                  layout === l.id && "text-primary",
                )}
              >
                <div
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-lg border-2",
                    layout === l.id
                      ? "border-primary bg-accent"
                      : "border-border bg-muted",
                  )}
                >
                  <ArrowsOut size={16} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{l.label}</p>
                  <p className="text-xs text-muted-foreground">{l.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Element Picker Drawer */}
      <Drawer
        open={activeSlot !== null}
        onOpenChange={(o) => {
          if (!o) setActiveSlot(null);
        }}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Add element</DrawerTitle>
          </DrawerHeader>
          <div className="flex flex-col divide-y divide-border px-4 pb-6">
            {ELEMENTS.map((el) => (
              <button
                key={el.type}
                type="button"
                onClick={() => {
                  if (activeSlot === null) return;
                  const next = [...slots];
                  next[activeSlot] = { type: el.type } as SiteSection;
                  setSlots(next);
                  setActiveSlot(null);
                }}
                className="flex items-center gap-3 py-4 text-left hover:bg-muted"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted">
                  <PencilSimple size={16} className="text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{el.label}</p>
                  <p className="text-xs text-muted-foreground">{el.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
