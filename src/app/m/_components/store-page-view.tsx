"use client";

import { PageContent } from "@/app/m/_components/page-content";
import { PageHeader } from "@/app/m/_components/page-header";

export function StorePageView() {
  return (
    <PageContent>
      <PageHeader
        title="Store"
        meta="Retail checkout with link-based selling — launching soon."
      />

      <div className="mt-8 rounded-xl border border-[#ebebeb] bg-white px-5 py-10 text-center">
        <span className="inline-block rounded-full bg-[#f5f5f5] px-3 py-1 text-xs font-medium text-neutral-600">
          Coming soon
        </span>
        <h2 className="mt-4 text-base font-semibold text-neutral-950">
          Store checkout is on the way
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-500">
          We&apos;re focused on restaurants first. Store and retail checkout will
          ship in a later release.
        </p>
      </div>
    </PageContent>
  );
}
