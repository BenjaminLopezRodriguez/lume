"use client";

import { useBusinesses } from "@/app/m/_components/business-provider";
import { ListCard, ListCardRow } from "@/app/m/_components/list-card";
import { PageContent } from "@/app/m/_components/page-content";
import { PageHeader } from "@/app/m/_components/page-header";
import { SalesBarGraph } from "@/app/m/_components/sales-bar-graph";
import { SectionHeader } from "@/app/m/_components/section-header";

const DEFAULT_EVENTS = [
  { label: "Wine dinner · July 12", trailing: "18 seats", dot: "#6366f1" },
  { label: "Chef's table · July 19", trailing: "8 seats", dot: "#e85d9b" },
  { label: "Sunday brunch · July 21", trailing: "42 seats", dot: "#22c55e" },
] as const;

function formatEventDate(date: string) {
  if (!date) return "Date not set";

  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function EventPageView() {
  const { getLatestByType } = useBusinesses();
  const event = getLatestByType("event");

  return (
    <PageContent>
      <PageHeader
        title={event?.name ?? "Event"}
        meta={
          event ? (
            <>
              <span className="text-neutral-700">{formatEventDate(event.date)}</span>
              <span className="text-neutral-400"> · </span>
              <span className="text-neutral-500">
                {event.location || "Location not set"}
                {event.capacity ? ` · ${event.capacity} seats` : ""}
              </span>
            </>
          ) : (
            <span className="text-neutral-500">
              Create an event to start selling tickets and deposits
            </span>
          )
        }
      />

      <div className="mt-8 flex flex-col gap-8">
        <section className="flex flex-col gap-3">
          <SalesBarGraph
            label="Ticket sales this week"
            color="#e85d9b"
            valueFormat="number"
            data={[
              { label: "Mon", value: 8 },
              { label: "Tue", value: 12 },
              { label: "Wed", value: 10 },
              { label: "Thu", value: 18 },
              { label: "Fri", value: 24 },
              { label: "Sat", value: 36 },
              { label: "Sun", value: 28 },
            ]}
          />
          <SectionHeader title="Upcoming" />
          <ListCard
            footer={{
              label: "Create event →",
              href: "/m/event",
            }}
          >
            {event ? (
              <ListCardRow
                dot="#6366f1"
                label={event.name}
                trailing={
                  event.capacity
                    ? `${event.capacity} seats`
                    : formatEventDate(event.date)
                }
              />
            ) : (
              DEFAULT_EVENTS.map(({ label, trailing, dot }) => (
                <ListCardRow key={label} dot={dot} label={label} trailing={trailing} />
              ))
            )}
          </ListCard>
        </section>
      </div>
    </PageContent>
  );
}
