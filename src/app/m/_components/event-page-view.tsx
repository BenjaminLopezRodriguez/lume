"use client";

import { useState } from "react";
import { useBusinesses } from "@/app/m/_components/business-provider";
import { ListCard, ListCardRow } from "@/app/m/_components/list-card";
import { PageContent } from "@/app/m/_components/page-content";
import { PageHeader } from "@/app/m/_components/page-header";
import { SectionHeader } from "@/app/m/_components/section-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PaymentStatusChip } from "@/verticals/shared/payment-status-chip";
import { VERTICAL_CONFIG } from "@/verticals/types";
import { api } from "@/trpc/react";

function formatEventDate(date: string | Date | null) {
  if (!date) return "Date not set";
  const value = typeof date === "string" ? `${date}T12:00:00` : date.toISOString();
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function EventPageView() {
  const { activeBusiness, getBusinessByType } = useBusinesses();
  const eventBusiness = getBusinessByType("event");
  const businessId = eventBusiness?.id ?? activeBusiness?.id;
  const accent = VERTICAL_CONFIG.event.accent;

  const utils = api.useUtils();
  const { data: eventList = [] } = api.event.list.useQuery(
    { businessId: businessId ?? "" },
    { enabled: !!businessId },
  );

  const [name, setName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState("");
  const [tierName, setTierName] = useState("General admission");
  const [tierPrice, setTierPrice] = useState("");
  const [checkInCode, setCheckInCode] = useState("");

  const createEvent = api.event.create.useMutation({
    onSuccess: async () => {
      await utils.event.invalidate();
      setName("");
      setEventDate("");
      setLocation("");
      setCapacity("");
      setTierPrice("");
    },
  });

  const checkIn = api.event.checkIn.useMutation({
    onSuccess: async () => {
      await utils.event.invalidate();
      setCheckInCode("");
    },
  });

  const selectedEvent = eventList[0];
  const { data: attendees = [] } = api.event.listAttendees.useQuery(
    { eventId: selectedEvent?.id ?? "" },
    { enabled: !!selectedEvent?.id },
  );

  const soldSeats = selectedEvent?.tiers.reduce((sum, tier) => sum + tier.soldCount, 0) ?? 0;
  const totalCapacity =
    selectedEvent?.capacity ??
    selectedEvent?.tiers.reduce((sum, tier) => sum + tier.capacity, 0) ??
    0;

  return (
    <PageContent>
      <PageHeader
        title={eventBusiness?.name ?? "Event"}
        meta={
          selectedEvent ? (
            <>
              <span className="text-neutral-700">
                {formatEventDate(selectedEvent.eventDate)}
              </span>
              <span className="text-neutral-400"> · </span>
              <span className="text-neutral-500">
                {selectedEvent.location ?? "Location not set"}
                {totalCapacity > 0
                  ? ` · ${soldSeats}/${totalCapacity} seats`
                  : ""}
              </span>
            </>
          ) : (
            <span className="text-neutral-500">
              Ticket checkout — sell seats and check in attendees
            </span>
          )
        }
      />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="issues">Issues</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
      <div className="mt-8 flex flex-col gap-8">
        <section className="flex flex-col gap-3">
          <SectionHeader title="New event" />
          <form
            className="flex flex-col gap-3 rounded-xl border border-[#ebebeb] bg-white p-5"
            onSubmit={(event) => {
              event.preventDefault();
              const priceCents = Math.round(parseFloat(tierPrice) * 100);
              if (!businessId || !name.trim() || !priceCents) return;
              createEvent.mutate({
                businessId,
                name: name.trim(),
                eventDate: eventDate || undefined,
                location: location.trim() || undefined,
                capacity: capacity ? parseInt(capacity, 10) : undefined,
                tiers: [
                  {
                    name: tierName.trim() || "General admission",
                    priceCents,
                    capacity: capacity ? parseInt(capacity, 10) : 50,
                  },
                ],
              });
            }}
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="event-name">Event name</Label>
              <Input
                id="event-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Wine dinner"
                className="h-10 rounded-lg"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="event-date">Date</Label>
                <Input
                  id="event-date"
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="h-10 rounded-lg"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="event-capacity">Capacity</Label>
                <Input
                  id="event-capacity"
                  type="number"
                  min={1}
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="24"
                  className="h-10 rounded-lg"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="event-location">Location</Label>
              <Input
                id="event-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Private dining room"
                className="h-10 rounded-lg"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="tier-name">Ticket tier</Label>
                <Input
                  id="tier-name"
                  value={tierName}
                  onChange={(e) => setTierName(e.target.value)}
                  className="h-10 rounded-lg"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="tier-price">Price ($)</Label>
                <Input
                  id="tier-price"
                  type="number"
                  min={0}
                  step={0.01}
                  value={tierPrice}
                  onChange={(e) => setTierPrice(e.target.value)}
                  placeholder="85.00"
                  className="h-10 rounded-lg"
                />
              </div>
            </div>
            <Button
              type="submit"
              className="h-10 rounded-lg"
              disabled={createEvent.isPending || !businessId}
            >
              {createEvent.isPending ? "Creating..." : "Create event"}
            </Button>
          </form>
        </section>

        <section className="flex flex-col gap-3">
          <SectionHeader title="Upcoming" />
          <ListCard footer={{ label: "Share ticket link →", href: "/m/share" }}>
            {eventList.length > 0 ? (
              eventList.map((event) => (
                <ListCardRow
                  key={event.id}
                  dot={accent}
                  label={`${event.name} · ${formatEventDate(event.eventDate)}`}
                  trailing={
                    event.capacity
                      ? `${event.capacity} seats`
                      : formatEventDate(event.eventDate)
                  }
                />
              ))
            ) : (
              <ListCardRow
                dot="#a3a3a3"
                label="No events yet"
                trailing="Create one above"
              />
            )}
          </ListCard>
        </section>

        <section className="flex flex-col gap-3">
          <SectionHeader title="CheckInScanner" />
          <form
            className="flex gap-2 rounded-xl border border-[#ebebeb] bg-white p-5"
            onSubmit={(event) => {
              event.preventDefault();
              if (!checkInCode.trim()) return;
              checkIn.mutate({ checkInCode: checkInCode.trim() });
            }}
          >
            <Input
              value={checkInCode}
              onChange={(e) => setCheckInCode(e.target.value)}
              placeholder="LUME-ABC123"
              className="h-10 rounded-lg"
            />
            <Button type="submit" className="rounded-lg" disabled={checkIn.isPending}>
              Check in
            </Button>
          </form>
        </section>

        {attendees.length > 0 ? (
          <section className="flex flex-col gap-3">
            <SectionHeader title="TicketReceipt · Attendees" />
            <ListCard>
              {attendees.map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex items-center justify-between gap-3 px-5 py-4"
                >
                  <ListCardRow
                    dot={accent}
                    label={`${ticket.attendeeName} · ${ticket.checkInCode}`}
                    trailing={`$${(ticket.totalCents / 100).toFixed(2)}`}
                    className="flex-1 px-0 py-0"
                  />
                  <PaymentStatusChip status={ticket.status} />
                </div>
              ))}
            </ListCard>
          </section>
        ) : null}
      </div>
        </TabsContent>
        <TabsContent value="issues">
          <div className="mt-6 flex flex-col gap-3">
            <ListCard>
              <ListCardRow dot="#a3a3a3" label="No issues" trailing="Coming soon" />
            </ListCard>
          </div>
        </TabsContent>
      </Tabs>
    </PageContent>
  );
}
