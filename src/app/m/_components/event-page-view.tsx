"use client";

import { PageContent } from "@/app/m/_components/page-content";
import { PageHeader } from "@/app/m/_components/page-header";

export function EventPageView() {
  return (
    <PageContent>
      <PageHeader
        title="Event"
        meta="Ticket sales and deposits — launching soon."
      />

      <div className="mt-8 rounded-xl border border-[#ebebeb] bg-white px-5 py-10 text-center">
        <span className="inline-block rounded-full bg-[#f5f5f5] px-3 py-1 text-xs font-medium text-neutral-600">
          Coming soon
        </span>
        <h2 className="mt-4 text-base font-semibold text-neutral-950">
          Event ticketing is on the way
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-500">
          Wine dinners, chef&apos;s tables, and ticketed experiences are planned
          for a future release. Restaurants are live today.
        </p>
      </div>
    </PageContent>
  );
}
