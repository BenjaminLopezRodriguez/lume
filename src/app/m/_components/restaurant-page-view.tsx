"use client";

import { useBusinesses } from "@/app/m/_components/business-provider";
import { ListCard, ListCardRow } from "@/app/m/_components/list-card";
import { PageContent } from "@/app/m/_components/page-content";
import { PageHeader } from "@/app/m/_components/page-header";
import { SalesBarGraph } from "@/app/m/_components/sales-bar-graph";
import { SectionHeader } from "@/app/m/_components/section-header";

const DEFAULT_TABLES = [
  { label: "Table 1", trailing: "Open", dot: "#22c55e" },
  { label: "Table 4", trailing: "Ordering", dot: "#f59e0b" },
  { label: "Table 7", trailing: "Paid", dot: "#6366f1" },
  { label: "Patio 2", trailing: "Open", dot: "#22c55e" },
] as const;

export function RestaurantPageView() {
  const { getLatestByType } = useBusinesses();
  const restaurant = getLatestByType("restaurant");

  return (
    <PageContent>
      <PageHeader
        title={restaurant?.name ?? "Restaurant"}
        meta={
          restaurant ? (
            <>
              <span className="text-neutral-700">
                {restaurant.cuisine || "Cuisine not set"}
              </span>
              <span className="text-neutral-400"> · </span>
              <span className="text-neutral-500">
                {restaurant.address || "Address not set"}
              </span>
            </>
          ) : (
            <span className="text-neutral-500">
              Create a restaurant to set up QR ordering and kitchen sync
            </span>
          )
        }
      />

      <div className="mt-8 flex flex-col gap-8">
        <section className="flex flex-col gap-3">
          <SalesBarGraph
            label="Covers this week"
            color="#e85d04"
            valueFormat="number"
            data={[
              { label: "Mon", value: 42 },
              { label: "Tue", value: 38 },
              { label: "Wed", value: 51 },
              { label: "Thu", value: 64 },
              { label: "Fri", value: 92 },
              { label: "Sat", value: 118 },
              { label: "Sun", value: 86 },
            ]}
          />
          <SectionHeader title="Tables" />
          <ListCard
            footer={{
              label: "Manage floor plan →",
              href: "/m/restaurant",
            }}
          >
            {DEFAULT_TABLES.map(({ label, trailing, dot }) => (
              <ListCardRow key={label} dot={dot} label={label} trailing={trailing} />
            ))}
          </ListCard>
        </section>
      </div>
    </PageContent>
  );
}
