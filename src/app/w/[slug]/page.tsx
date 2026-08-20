// CURSOR-RESTORE 2026-07-02T21:09 PDT — Restored after Claude wiped during dummy-data purge.
// Changes: Public Lume-hosted site at /w/[slug].
// Claude: ASK USER before overwriting. Use /prompt-builder + /pm before editing this file.

import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/server/db";
import { businesses, webPresences } from "@/server/db/schema";
import { getVerticalConfig, type VerticalConfig } from "@/verticals/types";

type SiteSection =
  | { type: "hero"; title?: string; subtitle?: string }
  | { type: "checkout"; label?: string }
  | { type: "about"; body?: string }
  | { type: "hours"; text?: string }
  | { type: "location"; mapUrl?: string; mapLabel?: string }
  | { type: "social"; links?: { platform: string; url: string }[] }
  | { type: "menu_preview" };

const SCHEMES = {
  neutral: { bg: "#faf8f6", text: "#171717", accent: "#6366f1", muted: "#737373", border: "#ebebeb" },
  warm:    { bg: "#fdf6ef", text: "#292218", accent: "#e85d04", muted: "#78716c", border: "#e8d5c4" },
  bold:    { bg: "#171717", text: "#fafafa", accent: "#6366f1", muted: "#a3a3a3", border: "#333333" },
  brand:   null,
  ink:     { bg: "#1a1a2e", text: "#e8e8f0", accent: "#818cf8", muted: "#94a3b8", border: "#2d2d4e" },
};

type Scheme = { bg: string; text: string; accent: string; muted: string; border: string };

type BusinessShape = {
  name: string;
  description: string | null;
  stripePaymentLinkUrl: string | null;
};

function renderSection(
  section: SiteSection,
  scheme: Scheme,
  business: BusinessShape,
  vertical: VerticalConfig,
  idx: number,
) {
  const darkBg = scheme.bg === "#171717" || scheme.bg === "#1a1a2e";

  switch (section.type) {
    case "hero":
      return (
        <div key={idx} className="py-8 text-center" style={{ color: scheme.text }}>
          <h1 className="text-3xl font-bold tracking-tight">{section.title ?? business.name}</h1>
          {(section.subtitle ?? business.description) && (
            <p className="mt-3 text-sm leading-relaxed" style={{ color: scheme.muted }}>
              {section.subtitle ?? business.description}
            </p>
          )}
        </div>
      );

    case "checkout":
      return (
        <div
          key={idx}
          className="overflow-hidden rounded-xl text-left"
          style={{ border: `1px solid ${scheme.border}`, background: darkBg ? "#ffffff11" : "white" }}
        >
          <div className="px-5 py-4" style={{ borderBottom: `1px solid ${scheme.border}` }}>
            <p className="text-sm font-semibold" style={{ color: scheme.text }}>
              {section.label ?? "Visit & checkout"}
            </p>
            <p className="mt-1 text-sm" style={{ color: scheme.muted }}>
              Order, book, or pay — ownership starts at checkout.
            </p>
          </div>
          {business.stripePaymentLinkUrl ? (
            <div className="px-5 py-5">
              <a
                href={business.stripePaymentLinkUrl}
                className="inline-flex h-11 w-full items-center justify-center rounded-lg text-sm font-semibold text-white"
                style={{ backgroundColor: scheme.accent }}
              >
                Continue to checkout
              </a>
            </div>
          ) : (
            <div className="px-5 py-8 text-center text-sm" style={{ color: scheme.muted }}>
              Checkout link coming soon.
            </div>
          )}
        </div>
      );

    case "about":
      return (
        <div
          key={idx}
          className="rounded-xl px-5 py-4"
          style={{ border: `1px solid ${scheme.border}`, background: "transparent" }}
        >
          <p className="text-sm leading-relaxed" style={{ color: scheme.muted }}>
            {section.body ?? business.description ?? "About us"}
          </p>
        </div>
      );

    case "hours":
      return (
        <div key={idx} className="rounded-xl px-5 py-4" style={{ border: `1px solid ${scheme.border}` }}>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide" style={{ color: scheme.muted }}>
            Hours
          </p>
          <p className="text-sm" style={{ color: scheme.text }}>
            {section.text ?? "Contact us for hours"}
          </p>
        </div>
      );

    case "location":
      return (
        <div key={idx}>
          {section.mapUrl ? (
            <a
              href={section.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm font-medium underline-offset-4 hover:underline"
              style={{ color: scheme.accent }}
            >
              {section.mapLabel ?? "Get directions →"}
            </a>
          ) : (
            <p className="text-sm" style={{ color: scheme.muted }}>
              Location coming soon
            </p>
          )}
        </div>
      );

    case "social":
      return (
        <div key={idx} className="flex flex-wrap gap-3">
          {(section.links ?? []).map((l, i) => (
            <a
              key={i}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium capitalize"
              style={{ color: scheme.accent }}
            >
              {l.platform}
            </a>
          ))}
        </div>
      );

    case "menu_preview":
      return (
        <div key={idx}>
          <a href="#" className="text-sm font-medium" style={{ color: scheme.accent }}>
            View menu →
          </a>
        </div>
      );

    default:
      return null;
  }
}

export default async function WebPresencePublicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const presence = await db.query.webPresences.findFirst({
    where: eq(webPresences.slug, slug),
  });

  if (!presence) notFound();

  const business = await db.query.businesses.findFirst({
    where: eq(businesses.id, presence.businessId),
  });

  if (!business) notFound();

  const vertical = getVerticalConfig(business.type);

  const schemeKey = (presence.scheme ?? "neutral") as keyof typeof SCHEMES;
  const rawScheme = SCHEMES[schemeKey] ?? SCHEMES.neutral;
  const scheme: Scheme =
    schemeKey === "brand" ? { ...SCHEMES.neutral, accent: vertical.accent } : rawScheme!;
  const sections = presence.sections as SiteSection[] | null;

  if (!sections?.length || !presence.layout) {
    return (
      <main className="min-h-dvh bg-[#faf8f6] px-4 py-10">
        <div className="mx-auto max-w-lg text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Powered by Lume
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-neutral-950">
            {business.name}
          </h1>
          {business.description ? (
            <p className="mt-3 text-sm leading-relaxed text-neutral-600">
              {business.description}
            </p>
          ) : (
            <p className="mt-3 text-sm text-neutral-500">
              Your {vertical.label.toLowerCase()} — hosted by Lume
            </p>
          )}

          <div className="mt-10 overflow-hidden rounded-xl border border-[#ebebeb] bg-white text-left">
            <div className="border-b border-[#ebebeb] px-5 py-4">
              <p className="text-sm font-semibold text-neutral-900">Visit & checkout</p>
              <p className="mt-1 text-sm text-neutral-500">
                Order, book, or pay directly — ownership starts at checkout.
              </p>
            </div>
            {business.stripePaymentLinkUrl ? (
              <div className="px-5 py-5">
                <a
                  href={business.stripePaymentLinkUrl}
                  className="inline-flex h-11 w-full items-center justify-center rounded-lg text-sm font-semibold text-white"
                  style={{ backgroundColor: vertical.accent }}
                >
                  Continue to checkout
                </a>
              </div>
            ) : (
              <div className="px-5 py-8 text-center text-sm text-neutral-500">
                Checkout link coming soon.
              </div>
            )}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh px-4 py-10" style={{ backgroundColor: scheme.bg }}>
      <div className="mx-auto max-w-lg">
        <p
          className="mb-6 text-center text-xs font-medium uppercase tracking-wide"
          style={{ color: scheme.muted }}
        >
          Powered by Lume
        </p>
        <div className="flex flex-col gap-6">
          {sections.map((section, idx) => renderSection(section, scheme, business, vertical, idx))}
        </div>
      </div>
    </main>
  );
}
