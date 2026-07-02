import { ListCard, ListCardRow } from "@/app/m/_components/list-card";
import { PageContent } from "@/app/m/_components/page-content";
import { PageHeader } from "@/app/m/_components/page-header";
import { SectionHeader } from "@/app/m/_components/section-header";

const TABLES = [
  { label: "Table 1", trailing: "Open", dot: "#22c55e" },
  { label: "Table 4", trailing: "Ordering", dot: "#f59e0b" },
  { label: "Table 7", trailing: "Paid", dot: "#6366f1" },
  { label: "Patio 2", trailing: "Open", dot: "#22c55e" },
] as const;

export default function RestaurantPage() {
  return (
    <PageContent>
      <PageHeader
        title="Restaurant"
        meta={
          <>
            <span className="text-neutral-700">4 active tables</span>
            <span className="text-neutral-400"> · </span>
            <span className="text-neutral-500">QR ordering and kitchen sync</span>
          </>
        }
      />

      <div className="mt-8 flex flex-col gap-8">
        <section className="flex flex-col gap-3">
          <SectionHeader title="Tables" />
          <ListCard
            footer={{
              label: "Manage floor plan →",
              href: "/m/restaurant",
            }}
          >
            {TABLES.map(({ label, trailing, dot }) => (
              <ListCardRow key={label} dot={dot} label={label} trailing={trailing} />
            ))}
          </ListCard>
        </section>
      </div>
    </PageContent>
  );
}
