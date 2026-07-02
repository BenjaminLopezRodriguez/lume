import { ListCard, ListCardRow } from "@/app/m/_components/list-card";
import { PageContent } from "@/app/m/_components/page-content";
import { PageHeader } from "@/app/m/_components/page-header";
import { SectionHeader } from "@/app/m/_components/section-header";

const EVENTS = [
  { label: "Wine dinner · July 12", trailing: "18 seats", dot: "#6366f1" },
  { label: "Chef's table · July 19", trailing: "8 seats", dot: "#e85d9b" },
  { label: "Sunday brunch · July 21", trailing: "42 seats", dot: "#22c55e" },
] as const;

export default function EventPage() {
  return (
    <PageContent>
      <PageHeader
        title="Event"
        meta={
          <>
            <span className="text-neutral-700">3 upcoming</span>
            <span className="text-neutral-400"> · </span>
            <span className="text-neutral-500">Ticket sales and deposits</span>
          </>
        }
      />

      <div className="mt-8 flex flex-col gap-8">
        <section className="flex flex-col gap-3">
          <SectionHeader title="Upcoming" />
          <ListCard
            footer={{
              label: "Create event →",
              href: "/m/event",
            }}
          >
            {EVENTS.map(({ label, trailing, dot }) => (
              <ListCardRow key={label} dot={dot} label={label} trailing={trailing} />
            ))}
          </ListCard>
        </section>
      </div>
    </PageContent>
  );
}
