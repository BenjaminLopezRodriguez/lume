"use client";

import { useBusinesses } from "@/app/m/_components/business-provider";
import { ListCard, ListCardRow } from "@/app/m/_components/list-card";
import { PageContent } from "@/app/m/_components/page-content";
import { PageHeader } from "@/app/m/_components/page-header";
import { SalesBarGraph } from "@/app/m/_components/sales-bar-graph";
import { SectionHeader } from "@/app/m/_components/section-header";

const DEFAULT_PRODUCTS = [
  { label: "House olive oil", trailing: "$18.00", dot: "#6366f1" },
  { label: "Sourdough loaf", trailing: "$9.50", dot: "#22c55e" },
  { label: "Gift card", trailing: "$50.00", dot: "#f59e0b" },
] as const;

export function StorePageView() {
  const { getLatestByType } = useBusinesses();
  const store = getLatestByType("store");

  return (
    <PageContent>
      <PageHeader
        title={store?.name ?? "Store"}
        meta={
          store ? (
            <>
              <span className="text-neutral-700">
                {store.description || "No description yet"}
              </span>
              <span className="text-neutral-400"> · </span>
              <span className="text-neutral-500">Link-based checkout for retail</span>
            </>
          ) : (
            <span className="text-neutral-500">
              Create a store to start selling with link-based checkout
            </span>
          )
        }
      />

      <div className="mt-8 flex flex-col gap-8">
        <section className="flex flex-col gap-3">
          <SalesBarGraph
            label="Sales this week"
            color="#6366f1"
            data={[
              { label: "Mon", value: 120 },
              { label: "Tue", value: 180 },
              { label: "Wed", value: 95 },
              { label: "Thu", value: 210 },
              { label: "Fri", value: 260 },
              { label: "Sat", value: 340 },
              { label: "Sun", value: 275 },
            ]}
          />
          <SectionHeader title="Products" />
          <ListCard
            footer={{
              label: "Add product →",
              href: "/m/store",
            }}
          >
            {DEFAULT_PRODUCTS.map(({ label, trailing, dot }) => (
              <ListCardRow key={label} dot={dot} label={label} trailing={trailing} />
            ))}
          </ListCard>
        </section>
      </div>
    </PageContent>
  );
}
