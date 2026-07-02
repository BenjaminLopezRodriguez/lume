import { businessRouter } from "@/server/api/routers/business";
import { integrationRouter } from "@/server/api/routers/integration";
import { orderRouter } from "@/server/api/routers/order";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";

export const appRouter = createTRPCRouter({
  business: businessRouter,
  integration: integrationRouter,
  order: orderRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
