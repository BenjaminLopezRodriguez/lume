// CURSOR-RESTORE 2026-07-02T21:09 PDT — Restored after Claude wiped during dummy-data purge.
// Changes: Registered presence, qr, and menu routers on appRouter.
// Claude: ASK USER before overwriting. Use /prompt-builder + /pm before editing this file.

import { accountGroupRouter } from "@/server/api/routers/accountGroup";
import { businessRouter } from "@/server/api/routers/business";
import { capabilitySetRouter } from "@/server/api/routers/capabilitySet";
import { eventRouter } from "@/server/api/routers/event";
import { integrationRouter } from "@/server/api/routers/integration";
import { menuRouter } from "@/server/api/routers/menu";
import { orderRouter } from "@/server/api/routers/order";
import { ownershipRouter } from "@/server/api/routers/ownership";
import { presenceRouter } from "@/server/api/routers/presence";
import { qrRouter } from "@/server/api/routers/qr";
import { servicesRouter } from "@/server/api/routers/services";
import { storeRouter } from "@/server/api/routers/store";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";

export const appRouter = createTRPCRouter({
  accountGroup: accountGroupRouter,
  business: businessRouter,
  capabilitySet: capabilitySetRouter,
  integration: integrationRouter,
  menu: menuRouter,
  order: orderRouter,
  ownership: ownershipRouter,
  presence: presenceRouter,
  qr: qrRouter,
  services: servicesRouter,
  event: eventRouter,
  store: storeRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
