"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useBusinesses } from "@/app/m/_components/business-provider";
import { SectionHeader } from "@/app/m/_components/section-header";
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

const ASSET_TYPE_LABEL: Record<string, string> = {
  product: "Product",
  dining_relationship: "Dining",
  completed_work: "Service",
  attendance: "Event",
};

const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  pending_action: "Needs attention",
  completed: "Completed",
  transferred: "Transferred",
};

export function OwnershipPageView() {
  const { activeBusiness } = useBusinesses();
  const businessId = activeBusiness?.id;

  const { data: customers = [] } = api.ownership.listByBusiness.useQuery(
    { businessId: businessId ?? "", limit: 100 },
    { enabled: !!businessId },
  );

  const grouped = useMemo(() => {
    const groups = {
      active: [] as typeof customers,
      pending_action: [] as typeof customers,
      completed: [] as typeof customers,
    };

    customers.forEach((o) => {
      if (o.status === "active") {
        groups.active.push(o);
      } else if (o.status === "pending_action") {
        groups.pending_action.push(o);
      } else if (o.status === "completed" || o.status === "transferred") {
        groups.completed.push(o);
      }
    });

    return groups;
  }, [customers]);

  const hasAny =
    grouped.active.length > 0 ||
    grouped.pending_action.length > 0 ||
    grouped.completed.length > 0;

  function CustomerTable({ rows }: { rows: typeof customers }) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((o) => (
            <TableRow key={o.id}>
              <TableCell>{o.customerName}</TableCell>
              <TableCell className="text-muted-foreground">
                {ASSET_TYPE_LABEL[o.assetType] ?? o.assetType}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {STATUS_LABEL[o.status] ?? o.status}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  return (
    <div className="mt-8 flex flex-col gap-8">
      {!hasAny ? (
        <section className="flex flex-col gap-6">
          <Empty className="border">
            <EmptyHeader>
              <EmptyTitle>Customers</EmptyTitle>
              <EmptyDescription>
                Customers appear here after their first interaction.
              </EmptyDescription>
              <EmptyDescription>
                Track purchases, payment preferences, refunds, and authorized
                agents in one customer record.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent className="flex-row justify-center">
              <Button asChild size="sm">
                <Link href="/m/share">Share checkout link</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/m/dashboard">Go to dashboard</Link>
              </Button>
            </EmptyContent>
          </Empty>

          <div className="flex flex-col gap-2">
            <SectionHeader title="Example" />
            <div aria-hidden="true" className="pointer-events-none opacity-50 select-none">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Spend</TableHead>
                    <TableHead>Last activity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Example customer</TableCell>
                    <TableCell>3</TableCell>
                    <TableCell>$128.40</TableCell>
                    <TableCell>2 hours ago</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            <p className="text-muted-foreground text-xs">
              Sample data shown for illustration only.
            </p>
          </div>
        </section>
      ) : (
        <>
          {grouped.active.length > 0 && (
            <section className="flex flex-col gap-3">
              <SectionHeader title="Active" />
              <CustomerTable rows={grouped.active} />
            </section>
          )}

          {grouped.pending_action.length > 0 && (
            <section className="flex flex-col gap-3">
              <SectionHeader title="Needs attention" />
              <CustomerTable rows={grouped.pending_action} />
            </section>
          )}

          {grouped.completed.length > 0 && (
            <section className="flex flex-col gap-3">
              <SectionHeader title="Completed" />
              <CustomerTable rows={grouped.completed} />
            </section>
          )}
        </>
      )}
    </div>
  );
}
