import { TRPCError } from "@trpc/server";

import type { db } from "@/server/db";

type Db = typeof db;

export async function assertBusinessOwner(
  database: Db,
  businessId: string,
  userId: string,
) {
  const business = await database.query.businesses.findFirst({
    where: (row, { and: andWhere, eq: equals }) =>
      andWhere(equals(row.id, businessId), equals(row.ownerId, userId)),
  });
  if (!business) throw new TRPCError({ code: "NOT_FOUND" });
  return business;
}
