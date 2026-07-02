"use client";

import { useState } from "react";
import { Check, Copy } from "@phosphor-icons/react";
import { useBusinesses } from "@/app/m/_components/business-provider";
import { ListCard, ListCardRow } from "@/app/m/_components/list-card";
import { PageContent } from "@/app/m/_components/page-content";
import { PageHeader } from "@/app/m/_components/page-header";
import { SectionHeader } from "@/app/m/_components/section-header";
import { Button } from "@/components/ui/button";

const SHARE_OPTIONS = [
  { label: "Table QR", trailing: "Print for dine-in", dot: "#6366f1" },
  { label: "Checkout link", trailing: "Share online", dot: "#22c55e" },
  { label: "Text to guest", trailing: "Send by SMS", dot: "#f59e0b" },
] as const;

export default function SharePage() {
  const { activeBusiness } = useBusinesses();
  const checkoutUrl = activeBusiness?.stripePaymentLinkUrl;
  const [copied, setCopied] = useState(false);

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
          <>
            <span className="text-neutral-700">$0 commission</span>
            <span className="text-neutral-400"> · </span>
            <span className="text-neutral-500">
              Guests scan or tap your link to order and pay direct
            </span>
          </>
        }
      />

      <div className="mt-8 flex flex-col gap-8">
        <section className="flex flex-col gap-3">
          <SectionHeader title="Checkout link" />
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
          <ListCard
            footer={{
              label: "Download QR code →",
              href: "/m/share",
            }}
          >
            {SHARE_OPTIONS.map(({ label, trailing, dot }) => (
              <ListCardRow key={label} dot={dot} label={label} trailing={trailing} />
            ))}
          </ListCard>
        </section>
      </div>
    </PageContent>
  );
}
