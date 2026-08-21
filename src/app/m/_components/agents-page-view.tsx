"use client";

import { useBusinesses } from "@/app/m/_components/business-provider";
import { SectionHeader } from "@/app/m/_components/section-header";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/trpc/react";

function money(minor: number | null, currency = "usd") {
  if (minor === null) return "No limit set";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(minor / 100);
}

/** Plain language first. Technical detail lives behind the disclosure. */
const EVENT_PHRASE: Record<string, string> = {
  quote_returned: "Priced an order",
  policy_evaluated: "Checked the customer's spending rules",
  human_authorized: "Customer approved the order",
  payment_authorized: "Payment approved",
  confirmed: "Order confirmed",
  fulfilled: "Order fulfilled",
  declined: "Order declined",
  cancelled: "Order cancelled",
  expired: "Order expired",
};

/**
 * Controls with no backing field in `delegations` and no server-side
 * enforcement. Shown disabled and labelled, never as working switches.
 */
const UNAVAILABLE_CONTROLS = [
  {
    label: "Allow AI-assisted purchases",
    help: "There is no merchant-level on/off field yet. Today, limits come from each customer's own assistant permissions.",
  },
  {
    label: "Let assistants browse your products",
    help: "No product-visibility permission exists in the policy engine yet.",
  },
  {
    label: "Let assistants check availability",
    help: "No availability permission exists in the policy engine yet.",
  },
  {
    label: "Let assistants cancel or refund orders",
    help: "Cancellations and refunds are never delegated today. Not available yet.",
  },
];

export function AgentsPageView() {
  const { activeBusiness } = useBusinesses();
  const businessId = activeBusiness?.id;

  const { data: policy } = api.agent.policy.useQuery(
    { businessId: businessId ?? "" },
    { enabled: !!businessId },
  );
  const { data: activity = [] } = api.agent.activity.useQuery(
    { businessId: businessId ?? "", limit: 25 },
    { enabled: !!businessId },
  );

  const delegationRows = policy?.delegations ?? [];

  return (
    <div className="motion-page mt-8 flex flex-col gap-10">
      {/* Purchase rules — read-only, sourced from real delegation rows. */}
      <section className="flex flex-col gap-3">
        <SectionHeader title="Purchase rules in effect" />
        <p className="text-muted-foreground text-sm">
          Each customer&apos;s assistant buys under permissions their owner set.
          These are the rules Lume enforced on orders placed at your business.
        </p>

        {delegationRows.length === 0 ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyTitle>No assistant purchases yet</EmptyTitle>
              <EmptyDescription>
                When a customer buys through an AI assistant, the spending
                limits their assistant was given will appear here.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Assistant</TableHead>
                <TableHead>Approves automatically under</TableHead>
                <TableHead>Maximum order</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {delegationRows.map((d) => {
                const expired =
                  d.expiresAt !== null && new Date(d.expiresAt) <= new Date();
                return (
                  <TableRow key={d.id}>
                    <TableCell>{d.agent}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {d.requiresConfirmationAbove === null
                        ? "Customer approves every order"
                        : `${money(d.requiresConfirmationAbove)} — above that, the customer is asked`}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {money(d.maxTransaction)}
                    </TableCell>
                    <TableCell>
                      {d.revokedAt ? (
                        <Badge variant="destructive">Revoked</Badge>
                      ) : expired ? (
                        <Badge variant="secondary">Expired</Badge>
                      ) : (
                        <Badge variant="secondary">Active</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
        <p className="text-muted-foreground text-xs">
          Read-only. These limits are set by the customer, not by you.
        </p>
      </section>

      {/* Honest disabled controls: no backing field, no enforcement. */}
      <section className="flex flex-col gap-3">
        <SectionHeader title="Merchant controls" />
        <div className="divide-border divide-y rounded-lg border">
          {UNAVAILABLE_CONTROLS.map((c) => (
            <div
              key={c.label}
              className="flex items-start justify-between gap-6 p-4"
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-foreground text-sm font-medium">
                    {c.label}
                  </span>
                  <Badge variant="outline">Not available yet</Badge>
                </div>
                <p className="text-muted-foreground text-xs">{c.help}</p>
              </div>
              <Switch checked={false} disabled aria-label={c.label} />
            </div>
          ))}
        </div>
      </section>

      {/* Protocol status: nothing implements ACP or MCP here. */}
      <section className="flex flex-col gap-3">
        <SectionHeader title="Connections" />
        <div className="flex items-center justify-between gap-6 rounded-lg border p-4">
          <div className="flex flex-col gap-1">
            <span className="text-foreground text-sm font-medium">
              Assistant discovery
            </span>
            <p className="text-muted-foreground text-xs">
              Nothing is connected. Lume does not yet publish your products to
              assistant marketplaces.
            </p>
          </div>
          <Badge variant="outline">Not configured</Badge>
        </div>
      </section>

      {/* Real audit events only. Empty today. */}
      <section className="flex flex-col gap-3">
        <SectionHeader title="Activity" />
        {activity.length === 0 ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyTitle>Nothing here yet</EmptyTitle>
              <EmptyDescription>
                Every step an assistant takes on an order gets recorded here —
                what it priced, what the customer approved, and what shipped.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ul className="divide-border divide-y rounded-lg border">
            {activity.map((e) => (
              <li key={e.id} className="flex flex-col gap-2 p-4">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-foreground text-sm">
                    {EVENT_PHRASE[e.kind] ?? "Order updated"}
                    {e.amount !== null
                      ? ` — ${money(e.amount, e.currency)}`
                      : ""}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {new Date(e.createdAt).toLocaleString()}
                  </span>
                </div>
                <Collapsible>
                  <CollapsibleTrigger className="motion-control text-muted-foreground hover:text-foreground text-xs underline underline-offset-4">
                    View technical details
                  </CollapsibleTrigger>
                  <CollapsibleContent className="text-muted-foreground mt-2 flex flex-col gap-1 text-xs">
                    <span>Purchase intent: {e.intentId}</span>
                    <span>Event: {e.kind}</span>
                    <span>
                      Status: {e.fromStatus ?? "—"} → {e.toStatus ?? "—"}
                    </span>
                    <span>Actor: {e.actor ?? "—"}</span>
                    <span>Purchaser: {e.purchaserKind}</span>
                    {e.policyReason ? (
                      <span>Policy: {e.policyReason}</span>
                    ) : null}
                  </CollapsibleContent>
                </Collapsible>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
