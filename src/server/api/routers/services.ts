import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { assertBusinessOwner } from "@/server/api/lib/assert-business-owner";
import {
  serviceInvoiceLineItems,
  serviceInvoices,
  serviceJobs,
} from "@/server/db/schema";
import { createInvoicePaymentLink } from "@/server/stripe";

const lineItemInput = z.object({
  label: z.string().min(1),
  amountCents: z.number().int().positive(),
  quantity: z.number().int().positive().default(1),
});

export const servicesRouter = createTRPCRouter({
  listJobs: protectedProcedure
    .input(z.object({ businessId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      await assertBusinessOwner(ctx.db, input.businessId, ctx.userId);
      return ctx.db.query.serviceJobs.findMany({
        where: (row, { eq: equals }) => equals(row.businessId, input.businessId),
        orderBy: (row, { desc: orderDesc }) => [orderDesc(row.createdAt)],
        with: { invoices: { with: { lineItems: true } } },
      });
    }),

  createJob: protectedProcedure
    .input(
      z.object({
        businessId: z.string().uuid(),
        clientName: z.string().min(1),
        clientPhone: z.string().optional(),
        clientAddress: z.string().optional(),
        title: z.string().min(1),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertBusinessOwner(ctx.db, input.businessId, ctx.userId);
      const [job] = await ctx.db
        .insert(serviceJobs)
        .values({
          businessId: input.businessId,
          clientName: input.clientName,
          clientPhone: input.clientPhone ?? null,
          clientAddress: input.clientAddress ?? null,
          title: input.title,
          description: input.description ?? null,
          status: "in_progress",
        })
        .returning();
      if (!job) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return job;
    }),

  createInvoice: protectedProcedure
    .input(
      z.object({
        jobId: z.string().uuid(),
        lineItems: z.array(lineItemInput).min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const job = await ctx.db.query.serviceJobs.findFirst({
        where: (row, { eq: equals }) => equals(row.id, input.jobId),
      });
      if (!job) throw new TRPCError({ code: "NOT_FOUND" });
      await assertBusinessOwner(ctx.db, job.businessId, ctx.userId);

      const totalCents = input.lineItems.reduce(
        (sum, item) => sum + item.amountCents * item.quantity,
        0,
      );

      const paymentLink = await createInvoicePaymentLink(
        job.title,
        input.lineItems,
        { jobId: job.id, businessId: job.businessId },
      );

      const [invoice] = await ctx.db
        .insert(serviceInvoices)
        .values({
          jobId: job.id,
          businessId: job.businessId,
          status: "sent",
          totalCents,
          stripePaymentLinkUrl: paymentLink.url,
          stripePaymentLinkId: paymentLink.id,
          sentAt: new Date(),
        })
        .returning();

      if (!invoice) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await ctx.db.insert(serviceInvoiceLineItems).values(
        input.lineItems.map((item) => ({
          invoiceId: invoice.id,
          label: item.label,
          amountCents: item.amountCents,
          quantity: item.quantity,
        })),
      );

      await ctx.db
        .update(serviceJobs)
        .set({ status: "completed" })
        .where(eq(serviceJobs.id, job.id));

      return invoice;
    }),

  getLatestInvoice: protectedProcedure
    .input(z.object({ businessId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      await assertBusinessOwner(ctx.db, input.businessId, ctx.userId);
      const invoice = await ctx.db.query.serviceInvoices.findFirst({
        where: (row, { eq: equals }) => equals(row.businessId, input.businessId),
        orderBy: (row, { desc: orderDesc }) => [orderDesc(row.createdAt)],
        with: { lineItems: true, job: true },
      });
      return invoice ?? null;
    }),

  listInvoices: protectedProcedure
    .input(z.object({ businessId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      await assertBusinessOwner(ctx.db, input.businessId, ctx.userId);
      return ctx.db.query.serviceInvoices.findMany({
        where: (row, { eq: equals }) => equals(row.businessId, input.businessId),
        orderBy: (row, { desc: orderDesc }) => [orderDesc(row.createdAt)],
        with: { lineItems: true, job: true },
      });
    }),
});
