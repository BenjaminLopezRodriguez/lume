"use client";

import Link from "next/link";

import { useBusinesses } from "@/app/m/_components/business-provider";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/trpc/react";

/** Merchant-facing names for the interface an order came through. */
const SOURCE_LABEL: Record<string, string> = {
  web: "Online store",
  qr: "QR",
  payment_link: "Payment link",
  api: "API",
  agent: "Agent",
};

/** Merchant-facing names for order states. Never show the raw value. */
const STATUS_LABEL: Record<string, string> = {
  pending: "Awaiting payment",
  awaiting_payment: "Awaiting payment",
  paid: "Paid",
  confirmed: "Confirmed",
  preparing: "Preparing",
  in_progress: "In progress",
  ready: "Ready",
  out_for_delivery: "Out for delivery",
  fulfilled: "Fulfilled",
  completed: "Completed",
  delivered: "Delivered",
  cancelled: "Cancelled",
  canceled: "Cancelled",
  refunded: "Refunded",
  failed: "Payment failed",
};

/** Fallback: turn any unmapped stored value into plain sentence case. */
function humanize(value: string) {
  const words = value.replace(/[_-]+/g, " ").trim();
  if (!words) return "Unknown";
  return words.charAt(0).toUpperCase() + words.slice(1).toLowerCase();
}

function money(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function when(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function OrdersPageView() {
  const { activeBusiness } = useBusinesses();
  const businessId = activeBusiness?.id;

  const { data: orders = [] } = api.order.list.useQuery(
    { businessId: businessId ?? "", limit: 100 },
    { enabled: !!businessId },
  );

  const hasAny = orders.length > 0;

  return (
    <div
      key={hasAny ? "populated" : "empty"}
      className="motion-page mt-8 flex flex-col gap-8"
    >
      {!hasAny ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>No orders yet</EmptyTitle>
            <EmptyDescription>
              Share your online store, a payment link, or a QR code to start
              selling.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent className="flex-row justify-center">
            <Button asChild size="sm" className="motion-control">
              <Link href="/m/share">Share your store</Link>
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Placed</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">{order.label}</TableCell>
                <TableCell className="text-muted-foreground">
                  {order.source ? SOURCE_LABEL[order.source] ?? "Unknown" : "Unknown"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {STATUS_LABEL[order.status] ?? humanize(order.status)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {when(order.createdAt)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {money(order.totalCents)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
