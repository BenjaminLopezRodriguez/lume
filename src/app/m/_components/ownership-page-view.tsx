"use client";

import { useMemo } from "react";
import { useBusinesses } from "@/app/m/_components/business-provider";
import { ListCard, ListCardRow } from "@/app/m/_components/list-card";
import { SectionHeader } from "@/app/m/_components/section-header";
import { api } from "@/trpc/react";

const ASSET_TYPE_LABEL: Record<string, string> = {
  product: "Product",
  dining_relationship: "Dining",
  completed_work: "Service",
  attendance: "Event",
};

const ASSET_TYPE_DOT: Record<string, string> = {
  product: "var(--chart-1)",
  dining_relationship: "var(--chart-2)",
  completed_work: "var(--chart-3)",
  attendance: "var(--chart-4)",
};

const STATUS_DOT: Record<string, string> = {
  active: "var(--success)",
  pending_action: "var(--warning)",
  completed: "var(--muted-foreground)",
  transferred: "var(--muted-foreground)",
};

export function OwnershipPageView() {
  const { activeBusiness } = useBusinesses();
  const businessId = activeBusiness?.id;

  const { data: ownerships = [] } = api.ownership.listByBusiness.useQuery(
    { businessId: businessId ?? "", limit: 100 },
    { enabled: !!businessId },
  );

  const groupedOwnerships = useMemo(() => {
    const groups = {
      active: [] as typeof ownerships,
      pending_action: [] as typeof ownerships,
      completed: [] as typeof ownerships,
    };

    ownerships.forEach((o) => {
      if (o.status === "active") {
        groups.active.push(o);
      } else if (o.status === "pending_action") {
        groups.pending_action.push(o);
      } else if (o.status === "completed" || o.status === "transferred") {
        groups.completed.push(o);
      }
    });

    return groups;
  }, [ownerships]);

  const hasAny =
    groupedOwnerships.active.length > 0 ||
    groupedOwnerships.pending_action.length > 0 ||
    groupedOwnerships.completed.length > 0;

  return (
    <div className="mt-8 flex flex-col gap-8">
      {!hasAny ? (
        <section className="flex flex-col gap-3">
          <ListCard>
            <ListCardRow
              dot="var(--muted-foreground)"
              label="No customers yet"
              trailing="Ownerships are created at checkout"
            />
          </ListCard>
        </section>
      ) : (
        <>
          {groupedOwnerships.active.length > 0 && (
            <section className="flex flex-col gap-3">
              <SectionHeader title="Active" />
              <ListCard>
                {groupedOwnerships.active.map((o) => (
                  <ListCardRow
                    key={o.id}
                    dot={ASSET_TYPE_DOT[o.assetType] ?? "var(--muted-foreground)"}
                    label={o.customerName}
                    trailing={ASSET_TYPE_LABEL[o.assetType] ?? o.assetType}
                  />
                ))}
              </ListCard>
            </section>
          )}

          {groupedOwnerships.pending_action.length > 0 && (
            <section className="flex flex-col gap-3">
              <SectionHeader title="Needs attention" />
              <ListCard>
                {groupedOwnerships.pending_action.map((o) => (
                  <ListCardRow
                    key={o.id}
                    dot={STATUS_DOT.pending_action}
                    label={o.customerName}
                    trailing={ASSET_TYPE_LABEL[o.assetType] ?? o.assetType}
                  />
                ))}
              </ListCard>
            </section>
          )}

          {groupedOwnerships.completed.length > 0 && (
            <section className="flex flex-col gap-3">
              <SectionHeader title="Completed" />
              <ListCard>
                {groupedOwnerships.completed.map((o) => (
                  <ListCardRow
                    key={o.id}
                    dot={STATUS_DOT.completed}
                    label={o.customerName}
                    trailing={ASSET_TYPE_LABEL[o.assetType] ?? o.assetType}
                  />
                ))}
              </ListCard>
            </section>
          )}
        </>
      )}
    </div>
  );
}
