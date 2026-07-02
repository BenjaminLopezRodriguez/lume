"use client";

import { useBusinesses } from "@/app/m/_components/business-provider";
import { ListCard, ListCardRow } from "@/app/m/_components/list-card";
import { PageContent } from "@/app/m/_components/page-content";
import { PageHeader } from "@/app/m/_components/page-header";
import { SalesBarGraph } from "@/app/m/_components/sales-bar-graph";
import { SectionHeader } from "@/app/m/_components/section-header";
import { api } from "@/trpc/react";

const PLATFORM_COLORS: Record<string, string> = {
  ubereats: "#06c167",
  doordash: "#ff3008",
  grubhub: "#f63440",
  lume_direct: "#6366f1",
};

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

const PLATFORM_LABELS: Record<string, string> = {
  ubereats: "Uber Eats",
  doordash: "DoorDash",
  grubhub: "Grubhub",
  lume_direct: "Lume direct",
};

export function DashboardPageView() {
  const { activeBusiness } = useBusinesses();
  const businessId = activeBusiness?.id;

  const { data: orders = [] } = api.order.list.useQuery(
    { businessId: businessId ?? "", limit: 20 },
    { enabled: !!businessId },
  );

  const { data: channelStats } = api.order.channelStats.useQuery(
    { businessId: businessId ?? "" },
    { enabled: !!businessId },
  );

  const { data: salesByDay } = api.order.salesByDay.useQuery(
    { businessId: businessId ?? "" },
    { enabled: !!businessId },
  );

  const { data: activeOwnerships = [] } = api.ownership.listByBusiness.useQuery(
    { businessId: businessId ?? "", limit: 10 },
    { enabled: !!businessId },
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todaysOrders = orders.filter((order) => order.createdAt >= today);
  const todaysRevenueCents = todaysOrders.reduce(
    (sum, order) => sum + order.totalCents,
    0,
  );
  const avgTicket =
    todaysOrders.length > 0
      ? todaysRevenueCents / todaysOrders.length / 100
      : 0;

  const channels = [
    { key: "ubereats", label: "Uber Eats", dot: PLATFORM_COLORS.ubereats },
    { key: "doordash", label: "DoorDash", dot: PLATFORM_COLORS.doordash },
    { key: "grubhub", label: "Grubhub", dot: PLATFORM_COLORS.grubhub },
    { key: "lume_direct", label: "Lume direct", dot: PLATFORM_COLORS.lume_direct },
  ] as const;

  return (
    <PageContent>
      <PageHeader
        title={activeBusiness?.name ?? "Dashboard"}
        meta={
          activeBusiness ? (
            <>
              <span className="text-neutral-700">
                {todaysOrders.length} orders today
              </span>
              <span className="text-neutral-400"> · </span>
              <span className="text-neutral-500">
                ${(todaysRevenueCents / 100).toLocaleString()} revenue · $
                {avgTicket.toFixed(0)} avg. ticket
              </span>
            </>
          ) : (
            <span className="text-neutral-500">
              Create a restaurant to start tracking orders
            </span>
          )
        }
      />

      <div className="mt-8 flex flex-col gap-8">
        <section className="flex flex-col gap-3">
          <SalesBarGraph
            label="Revenue this week"
            data={salesByDay}
          />
          <SectionHeader title="Live orders" />
          <ListCard
            footer={{
              label: "Connect delivery apps →",
              href: "/m/connect",
            }}
          >
            {orders.length > 0 ? (
              orders.map((order) => (
                <ListCardRow
                  key={order.id}
                  dot={PLATFORM_COLORS[order.platform] ?? "#a3a3a3"}
                  label={order.label}
                  trailing={`$${(order.totalCents / 100).toFixed(2)}`}
                />
              ))
            ) : (
              <ListCardRow
                dot="#a3a3a3"
                label="No orders yet"
                trailing="Connect a platform"
              />
            )}
          </ListCard>
        </section>

        <section className="flex flex-col gap-3">
          <SectionHeader title="Active ownerships" />
          <ListCard>
            {activeOwnerships.length > 0 ? (
              activeOwnerships.map((o) => (
                <ListCardRow
                  key={o.id}
                  dot={ASSET_TYPE_DOT[o.assetType] ?? "#a3a3a3"}
                  label={o.customerName}
                  trailing={ASSET_TYPE_LABEL[o.assetType] ?? o.assetType}
                />
              ))
            ) : (
              <ListCardRow
                dot="#a3a3a3"
                label="No ownerships yet"
                trailing="Created at checkout"
              />
            )}
          </ListCard>
        </section>

        <section className="flex flex-col gap-3">
          <SectionHeader title="Channels" />
          <ListCard>
            {channels.map(({ key, label, dot }) => (
              <ListCardRow
                key={key}
                dot={dot}
                label={label}
                trailing={
                  channelStats
                    ? `${channelStats[key]} orders`
                    : PLATFORM_LABELS[key]
                }
              />
            ))}
          </ListCard>
        </section>
      </div>
    </PageContent>
  );
}
