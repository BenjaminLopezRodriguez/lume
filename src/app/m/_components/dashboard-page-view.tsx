"use client";

import Link from "next/link";
import { useBusinesses } from "@/app/m/_components/business-provider";
import { PageContent } from "@/app/m/_components/page-content";
import { PageHeader } from "@/app/m/_components/page-header";
import { SalesBarGraph } from "@/app/m/_components/sales-bar-graph";
import { SectionHeader } from "@/app/m/_components/section-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/trpc/react";
import { BUSINESS_ROUTES } from "@/verticals/types";

const PLATFORM_LABELS: Record<string, string> = {
  ubereats: "Uber Eats",
  doordash: "DoorDash",
  grubhub: "Grubhub",
  lume_direct: "Lume direct",
};

const ASSET_TYPE_LABEL: Record<string, string> = {
  product: "Product",
  dining_relationship: "Dining",
  completed_work: "Service",
  attendance: "Event",
};

const ASSET_TYPE_TO_BUSINESS: Record<string, string> = {
  product: "store",
  completed_work: "services",
  attendance: "event",
  dining_relationship: "restaurant",
};

const CHANNEL_KEYS = ["lume_direct", "ubereats", "doordash", "grubhub"] as const;

function money(cents: number) {
  return `$${(cents / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function greeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

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

  const { data: ownerships = [] } = api.ownership.listByBusiness.useQuery(
    { businessId: businessId ?? "", limit: 20 },
    { enabled: !!businessId },
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todaysOrders = orders.filter((order) => order.createdAt >= today);
  const todaysRevenueCents = todaysOrders.reduce(
    (sum, order) => sum + order.totalCents,
    0,
  );
  const avgOrderCents =
    todaysOrders.length > 0
      ? Math.round(todaysRevenueCents / todaysOrders.length)
      : 0;

  const pending = ownerships.filter((o) => o.status === "pending_action");
  const hasChartData = !!salesByDay?.some((day) => day.value > 0);
  const channelTotal = channelStats?.total ?? 0;

  const todayFigures = [
    { label: "Revenue", value: money(todaysRevenueCents) },
    { label: "Orders", value: todaysOrders.length.toLocaleString() },
    {
      label: "Avg. order",
      value: todaysOrders.length > 0 ? money(avgOrderCents) : "—",
    },
  ];

  return (
    <PageContent width="full">
      <PageHeader
        title={`${greeting(new Date().getHours())}${
          activeBusiness ? `, ${activeBusiness.name}` : ""
        }`}
        meta={
          activeBusiness ? (
            <dl className="mt-1 flex flex-wrap items-end gap-x-10 gap-y-4">
              {todayFigures.map((figure) => (
                <div key={figure.label} className="flex flex-col gap-1">
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {figure.label} today
                  </dt>
                  <dd className="text-2xl font-semibold tabular-nums text-foreground">
                    {figure.value}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <span>Create a business to start tracking orders</span>
          )
        }
      />

      <div className="mt-10 flex flex-col gap-10">
        <section className="flex flex-col gap-3">
          <SectionHeader title="Revenue" />
          {hasChartData ? (
            <SalesBarGraph label="This week" data={salesByDay ?? []} />
          ) : (
            <p className="border-t border-border pt-4 text-sm text-muted-foreground">
              No revenue recorded this week.
            </p>
          )}
        </section>

        <div className="grid gap-10 lg:grid-cols-2">
          <section className="flex flex-col gap-3">
            <SectionHeader title="Recent orders" />
            {orders.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead scope="col">Order</TableHead>
                    <TableHead scope="col">Channel</TableHead>
                    <TableHead scope="col" className="text-right">
                      Total
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.slice(0, 8).map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium text-foreground">
                        {order.label}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {PLATFORM_LABELS[order.platform] ?? order.platform}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {money(order.totalCents)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="border-t border-border pt-4 text-sm text-muted-foreground">
                No orders yet.{" "}
                <Link
                  href="/m/connect"
                  className="underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  Connect delivery apps
                </Link>
              </p>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <SectionHeader title="Needs attention" />
            {pending.length > 0 ? (
              <ul className="border-t border-border">
                {pending.map((o) => {
                  const businessType = ASSET_TYPE_TO_BUSINESS[o.assetType];
                  const route = businessType
                    ? BUSINESS_ROUTES[businessType as keyof typeof BUSINESS_ROUTES]
                    : undefined;
                  const label = ASSET_TYPE_LABEL[o.assetType] ?? o.assetType;
                  return (
                    <li
                      key={o.id}
                      className="flex items-center justify-between gap-4 border-b border-border py-3 text-sm"
                    >
                      <span className="font-medium text-foreground">
                        {o.customerName}
                      </span>
                      <span className="flex items-center gap-3 text-muted-foreground">
                        {label}
                        {route ? (
                          <Link
                            href={route}
                            className="underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                          >
                            View
                          </Link>
                        ) : null}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="border-t border-border pt-4 text-sm text-muted-foreground">
                Nothing needs attention.
              </p>
            )}
          </section>
        </div>

        <section className="flex flex-col gap-3">
          <SectionHeader title="Sales by channel" />
          {channelTotal > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">Channel</TableHead>
                  <TableHead scope="col" className="text-right">
                    Orders
                  </TableHead>
                  <TableHead scope="col" className="text-right">
                    Share
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {CHANNEL_KEYS.map((key) => {
                  const count = channelStats?.[key] ?? 0;
                  return (
                    <TableRow key={key}>
                      <TableCell className="font-medium text-foreground">
                        {PLATFORM_LABELS[key]}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {count.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {Math.round((count / channelTotal) * 100)}%
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <p className="border-t border-border pt-4 text-sm text-muted-foreground">
              No attributed orders yet.
            </p>
          )}
        </section>
      </div>
    </PageContent>
  );
}
