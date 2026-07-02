import { ListCard, ListCardRow } from "@/app/m/_components/list-card";
import { PageContent } from "@/app/m/_components/page-content";
import { PageHeader } from "@/app/m/_components/page-header";
import { SectionHeader } from "@/app/m/_components/section-header";
import { SalesBarGraph } from "@/app/m/_components/sales-bar-graph";

const ORDERS = [
  { label: "Table 4 · 2 items", trailing: "$38.50", dot: "#f59e0b" },
  { label: "Pickup · Rosemary pasta", trailing: "$24.00", dot: "#22c55e" },
  { label: "DoorDash · Burger combo", trailing: "$19.75", dot: "#e85d9b" },
  { label: "Uber Eats · Family platter", trailing: "$52.00", dot: "#06c167" },
  { label: "Grubhub · Soup & salad", trailing: "$16.50", dot: "#f63440" },
  { label: "Lume direct · QR order", trailing: "$31.25", dot: "#6366f1" },
] as const;

const CHANNELS = [
  { label: "Uber Eats", trailing: "12 orders", dot: "#06c167" },
  { label: "DoorDash", trailing: "8 orders", dot: "#ff3008" },
  { label: "Grubhub", trailing: "6 orders", dot: "#f63440" },
  { label: "Lume direct", trailing: "26 total", dot: "#6366f1" },
] as const;

export default function DashboardPage() {
  return (
    <PageContent>
      <PageHeader
        title="Rosemary Bistro"
        meta={
          <>
            <span className="text-neutral-700">26 orders today</span>
            <span className="text-neutral-400"> · </span>
            <span className="text-neutral-500">$1,284 revenue · $49 avg. ticket</span>
          </>
        }
      />

      <div className="mt-8 flex flex-col gap-8">
        <section className="flex flex-col gap-3">
          <SalesBarGraph label="Revenue this week" />
          <SectionHeader title="Live orders" />
          <ListCard
            footer={{
              label: "View all orders in Dashboard →",
              href: "/m/dashboard",
            }}
          >
            {ORDERS.map(({ label, trailing, dot }) => (
              <ListCardRow key={label} dot={dot} label={label} trailing={trailing} />
            ))}
          </ListCard>
        </section>

        <section className="flex flex-col gap-3">
          <SectionHeader title="Channels" />
          <ListCard>
            {CHANNELS.map(({ label, trailing, dot }) => (
              <ListCardRow key={label} dot={dot} label={label} trailing={trailing} />
            ))}
          </ListCard>
        </section>
      </div>
    </PageContent>
  );
}
