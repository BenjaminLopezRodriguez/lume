import { accountGroupRouter } from "@/server/api/routers/accountGroup";
import { businessRouter } from "@/server/api/routers/business";
import { capabilitySetRouter } from "@/server/api/routers/capabilitySet";
import { eventRouter } from "@/server/api/routers/event";
import { integrationRouter } from "@/server/api/routers/integration";
import { orderRouter } from "@/server/api/routers/order";
import { ownershipRouter } from "@/server/api/routers/ownership";
import { servicesRouter } from "@/server/api/routers/services";
import { storeRouter } from "@/server/api/routers/store";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";

export const appRouter = createTRPCRouter({
  accountGroup: accountGroupRouter,
  business: businessRouter,
  capabilitySet: capabilitySetRouter,
  integration: integrationRouter,
  order: orderRouter,
  ownership: ownershipRouter,
  services: servicesRouter,
  event: eventRouter,
  store: storeRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
