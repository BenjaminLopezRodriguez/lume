// CURSOR-RESTORE 2026-07-02T21:09 PDT — Restored after Claude wiped during dummy-data purge.
// Changes: Public Lume-hosted site at /w/[slug].
// Claude: ASK USER before overwriting. Use /prompt-builder + /pm before editing this file.

import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/server/db";
import { businesses, webPresences } from "@/server/db/schema";
import { getVerticalConfig } from "@/verticals/types";

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
