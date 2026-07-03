"use client";

import Link from "next/link";
import { useBusinesses } from "@/app/m/_components/business-provider";
import { ListCard, ListCardRow } from "@/app/m/_components/list-card";
import { SectionHeader } from "@/app/m/_components/section-header";
import { api } from "@/trpc/react";
import { BUSINESS_ROUTES } from "@/verticals/types";

const ASSET_TYPE_LABEL: Record<string, string> = {
  product: "Product",
  dining_relationship: "Dining",
  completed_work: "Service",
  attendance: "Event",
};

const ASSET_TYPE_DOT: Record<string, string> = {
  product: "#6366f1",
  dining_relationship: "#e85d04",
  completed_work: "#2d5be3",
  attendance: "#e85d9b",
};

const ASSET_TYPE_TO_ROUTE: Record<string, string> = {
  product: "/m/store",
  completed_work: "/m/services",
  attendance: "/m/event",
  dining_relationship: "/m/restaurant",
};

function daysSince(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  return days === 0 ? "today" : days === 1 ? "1d ago" : `${days}d ago`;
}

export function SupportPageView() {
  const { activeBusiness } = useBusinesses();
  const businessId = activeBusiness?.id;

  const { data: ownerships = [] } = api.ownership.listByBusiness.useQuery(
    { businessId: businessId ?? "", limit: 50 },
    { enabled: !!businessId },
  );

  const pendingOwnerships = ownerships.filter((o) => o.status === "pending_action");

  const groupedByType = pendingOwnerships.reduce<
    Record<string, typeof pendingOwnerships>
  >((acc, o) => {
    acc[o.assetType] = [...(acc[o.assetType] ?? []), o];
    return acc;
  }, {});

  const sortedTypes = Object.entries(groupedByType).sort(([aType], [bType]) => {
    const order = { product: 0, completed_work: 1, attendance: 2, dining_relationship: 3 };
    return (order[aType as keyof typeof order] ?? 99) - (order[bType as keyof typeof order] ?? 99);
  });

  return (
    <div className="mt-8 flex flex-col gap-8">
      {sortedTypes.length > 0 ? (
        sortedTypes.map(([assetType, items]) => {
          const label = ASSET_TYPE_LABEL[assetType] ?? assetType;
          const route = ASSET_TYPE_TO_ROUTE[assetType];
          if (!route) return null;

          return (
            <section key={assetType} className="flex flex-col gap-3">
              <Link href={route} className="hover:underline">
                <SectionHeader title={`${label} (${items.length})`} />
              </Link>
              <ListCard>
                {items.map((o) => (
                  <ListCardRow
                    key={o.id}
                    dot={ASSET_TYPE_DOT[assetType] ?? "#a3a3a3"}
                    label={o.customerName}
                    trailing={daysSince(o.createdAt)}
                  />
                ))}
              </ListCard>
            </section>
          );
        })
      ) : (
        <section className="flex flex-col gap-3">
          <SectionHeader title="No pending issues" />
          <ListCard>
            <ListCardRow
              dot="#a3a3a3"
              label="All customers are up to date"
              trailing="Great job!"
            />
          </ListCard>
        </section>
      )}
    </div>
  );
}
