"use client";

import { useState } from "react";
import { Check, Copy } from "@phosphor-icons/react";
import { useBusinesses } from "@/app/m/_components/business-provider";
import { ListCard, ListCardRow } from "@/app/m/_components/list-card";
import { PageContent } from "@/app/m/_components/page-content";
import { PageHeader } from "@/app/m/_components/page-header";
import { SectionHeader } from "@/app/m/_components/section-header";
import { Button } from "@/components/ui/button";
import { getShareModesForVertical, getVerticalConfig } from "@/verticals/types";
import { api } from "@/trpc/react";

export function SharePageView() {
  const { activeBusiness } = useBusinesses();
  const vertical = getVerticalConfig(activeBusiness?.type);
  const shareModes = getShareModesForVertical(activeBusiness?.type);
  const [copied, setCopied] = useState(false);

  const { data: storefront } = api.store.getStorefront.useQuery(
    { businessId: activeBusiness?.id ?? "" },
    { enabled: activeBusiness?.type === "store" && !!activeBusiness?.id },
  );

  const { data: latestInvoice } = api.services.getLatestInvoice.useQuery(
    { businessId: activeBusiness?.id ?? "" },
    { enabled: activeBusiness?.type === "services" && !!activeBusiness?.id },
  );

  const { data: latestEvent } = api.event.getLatest.useQuery(
    { businessId: activeBusiness?.id ?? "" },
    { enabled: activeBusiness?.type === "event" && !!activeBusiness?.id },
  );

  function resolveCheckoutUrl() {
    if (!activeBusiness) return null;

    switch (activeBusiness.type) {
      case "store":
        return storefront
          ? `${typeof window !== "undefined" ? window.location.origin : ""}/s/${storefront.slug}`
          : activeBusiness.stripePaymentLinkUrl;
      case "services":
        return latestInvoice?.stripePaymentLinkUrl ?? null;
      case "event":
        return latestEvent?.stripePaymentLinkUrl ?? activeBusiness.stripePaymentLinkUrl;
      default:
        return activeBusiness.stripePaymentLinkUrl;
    }
  }

  const checkoutUrl = resolveCheckoutUrl();

  async function copyLink() {
    if (!checkoutUrl) return;
    await navigator.clipboard.writeText(checkoutUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <PageContent>
      <PageHeader
        title="Share checkout"
        meta={
          activeBusiness?.type === "restaurant" ? (
            <>
              <span className="text-neutral-700">$0 commission</span>
              <span className="text-neutral-400"> · </span>
              <span className="text-neutral-500">{vertical.shareMeta}</span>
            </>
          ) : (
            <span className="text-neutral-500">{vertical.shareMeta}</span>
          )
        }
      />

      <div className="mt-8 flex flex-col gap-8">
        <section className="flex flex-col gap-3">
          <SectionHeader title={vertical.checkoutLinkLabel} />
          <div className="flex items-center gap-2 rounded-xl border border-[#ebebeb] bg-white px-4 py-3">
            <p className="min-w-0 flex-1 truncate text-sm text-neutral-600">
              {checkoutUrl ?? "Create a business to generate your checkout link"}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 shrink-0 rounded-lg border-[#ebebeb] px-3"
              onClick={copyLink}
              disabled={!checkoutUrl}
            >
              {copied ? (
                <>
                  <Check size={14} aria-hidden />
                  Copied
                </>
              ) : (
                <>
                  <Copy size={14} aria-hidden />
                  Copy
                </>
              )}
            </Button>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <SectionHeader title="Ways to share" />
          <ListCard footer={{ label: "Download QR code →", href: "/m/share" }}>
            {shareModes.map((mode) => (
              <ListCardRow
                key={mode.id}
                dot={vertical.accent}
                label={mode.label}
                trailing={mode.trailing}
              />
            ))}
          </ListCard>
        </section>
      </div>
    </PageContent>
  );
}
