import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { assertBusinessOwner } from "@/server/api/lib/assert-business-owner";
import { events, ticketTiers, tickets } from "@/server/db/schema";
import { createTicketPaymentLink, generateCheckInCode } from "@/server/stripe";

const tierInput = z.object({
  name: z.string().min(1),
  priceCents: z.number().int().positive(),
  capacity: z.number().int().positive(),
});

export const eventRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({ businessId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      await assertBusinessOwner(ctx.db, input.businessId, ctx.userId);
      return ctx.db.query.events.findMany({
        where: (row, { eq: equals }) => equals(row.businessId, input.businessId),
        orderBy: (row, { desc: orderDesc }) => [orderDesc(row.createdAt)],
        with: { tiers: true, tickets: true },
      });
    }),

  getLatest: protectedProcedure
    .input(z.object({ businessId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      await assertBusinessOwner(ctx.db, input.businessId, ctx.userId);
      const event = await ctx.db.query.events.findFirst({
        where: (row, { eq: equals }) => equals(row.businessId, input.businessId),
        orderBy: (row, { desc: orderDesc }) => [orderDesc(row.createdAt)],
        with: { tiers: true },
      });
      return event ?? null;
    }),

  create: protectedProcedure
    .input(
      z.object({
        businessId: z.string().uuid(),
        name: z.string().min(1),
        eventDate: z.string().optional(),
        location: z.string().optional(),
        capacity: z.number().int().positive().optional(),
        depositPercent: z.number().int().min(0).max(100).optional(),
        tiers: z.array(tierInput).min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertBusinessOwner(ctx.db, input.businessId, ctx.userId);

      const primaryTier = input.tiers[0];
      if (!primaryTier) throw new TRPCError({ code: "BAD_REQUEST" });

      const paymentLink = await createTicketPaymentLink(
        input.name,
        primaryTier.name,
        primaryTier.priceCents,
        1,
        { businessId: input.businessId },
      );

      const [event] = await ctx.db
        .insert(events)
        .values({
          businessId: input.businessId,
          name: input.name,
          eventDate: input.eventDate ?? null,
          location: input.location ?? null,
          capacity: input.capacity ?? null,
          depositPercent: input.depositPercent ?? null,
          status: "published",
          stripePaymentLinkUrl: paymentLink.url,
          stripePaymentLinkId: paymentLink.id,
        })
        .returning();

      if (!event) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await ctx.db.insert(ticketTiers).values(
        input.tiers.map((tier) => ({
          eventId: event.id,
          name: tier.name,
          priceCents: tier.priceCents,
          capacity: tier.capacity,
        })),
      );

      return event;
    }),

  listAttendees: protectedProcedure
    .input(z.object({ eventId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const event = await ctx.db.query.events.findFirst({
        where: (row, { eq: equals }) => equals(row.id, input.eventId),
      });
      if (!event) throw new TRPCError({ code: "NOT_FOUND" });
      await assertBusinessOwner(ctx.db, event.businessId, ctx.userId);

      return ctx.db.query.tickets.findMany({
        where: (row, { eq: equals }) => equals(row.eventId, input.eventId),
        orderBy: (row, { desc: orderDesc }) => [orderDesc(row.createdAt)],
        with: { tier: true },
      });
    }),

  checkIn: protectedProcedure
    .input(z.object({ checkInCode: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const ticket = await ctx.db.query.tickets.findFirst({
        where: (row, { eq: equals }) => equals(row.checkInCode, input.checkInCode),
      });
      if (!ticket) throw new TRPCError({ code: "NOT_FOUND" });
      await assertBusinessOwner(ctx.db, ticket.businessId, ctx.userId);

      const [updated] = await ctx.db
        .update(tickets)
        .set({ status: "checked_in", checkedInAt: new Date() })
        .where(eq(tickets.id, ticket.id))
        .returning();

      return updated;
    }),

  createTicket: protectedProcedure
    .input(
      z.object({
        eventId: z.string().uuid(),
        tierId: z.string().uuid(),
        attendeeName: z.string().min(1),
        attendeeEmail: z.string().email().optional(),
        quantity: z.number().int().positive().default(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const event = await ctx.db.query.events.findFirst({
        where: (row, { eq: equals }) => equals(row.id, input.eventId),
        with: { tiers: true },
      });
      if (!event) throw new TRPCError({ code: "NOT_FOUND" });
      await assertBusinessOwner(ctx.db, event.businessId, ctx.userId);

      const tier = event.tiers.find((t) => t.id === input.tierId);
      if (!tier) throw new TRPCError({ code: "NOT_FOUND" });

      const totalCents = tier.priceCents * input.quantity;
      const paymentLink = await createTicketPaymentLink(
        event.name,
        tier.name,
        tier.priceCents,
        input.quantity,
        { eventId: event.id, tierId: tier.id },
      );

      const [ticket] = await ctx.db
        .insert(tickets)
        .values({
          eventId: event.id,
          tierId: tier.id,
          businessId: event.businessId,
          attendeeName: input.attendeeName,
          attendeeEmail: input.attendeeEmail ?? null,
          quantity: input.quantity,
          totalCents,
          status: "pending",
          checkInCode: generateCheckInCode(),
          stripePaymentLinkUrl: paymentLink.url,
        })
        .returning();

      return ticket;
    }),
});
