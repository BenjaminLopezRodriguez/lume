export type SiteScheme = "neutral" | "warm" | "bold" | "brand" | "ink";
export type SiteLayout = "single" | "split" | "cardstack";

export type SiteSection =
  | { type: "hero"; title?: string; subtitle?: string }
  | { type: "checkout"; label?: string }
  | { type: "about"; body?: string }
  | { type: "hours"; text?: string }
  | { type: "location"; mapUrl?: string; mapLabel?: string }
  | { type: "social"; links?: { platform: string; url: string }[] }
  | { type: "menu_preview" };

export const SITE_SCHEMES: Record<SiteScheme, { bg: string; text: string; accent: string; muted: string; border: string }> = {
  neutral: { bg: "#faf8f6", text: "#171717", accent: "#6366f1", muted: "#737373", border: "#ebebeb" },
  warm:    { bg: "#fdf6ef", text: "#292218", accent: "#e85d04", muted: "#78716c", border: "#e8d5c4" },
  bold:    { bg: "#171717", text: "#fafafa", accent: "#6366f1", muted: "#a3a3a3", border: "#333333" },
  brand:   { bg: "#faf8f6", text: "#171717", accent: "#6366f1", muted: "#737373", border: "#ebebeb" },
  ink:     { bg: "#1a1a2e", text: "#e8e8f0", accent: "#818cf8", muted: "#94a3b8", border: "#2d2d4e" },
};

export const SCHEME_LABELS: Record<SiteScheme, string> = {
  neutral: "Neutral",
  warm: "Warm",
  bold: "Bold",
  brand: "Brand",
  ink: "Ink",
};

export const LAYOUT_LABELS: Record<SiteLayout, string> = {
  single: "Single",
  split: "Split",
  cardstack: "Card Stack",
};

export const LAYOUT_SLOT_COUNT: Record<SiteLayout, number> = {
  single: 4,
  split: 3,
  cardstack: 3,
};

export const ELEMENT_OPTIONS = [
  { type: "hero",         label: "Hero",          desc: "Big title + tagline" },
  { type: "checkout",     label: "Checkout",       desc: "Payment button" },
  { type: "about",        label: "About",          desc: "Short description" },
  { type: "hours",        label: "Hours",          desc: "Business hours" },
  { type: "location",     label: "Location",       desc: "Map link" },
  { type: "social",       label: "Social",         desc: "Icon links" },
  { type: "menu_preview", label: "Menu",           desc: "View menu link" },
] as const;
