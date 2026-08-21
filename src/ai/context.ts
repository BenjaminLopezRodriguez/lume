import "server-only";

import { createCaller } from "@/server/api/root";
import { assertBusinessOwner } from "@/server/api/lib/assert-business-owner";
import { db } from "@/server/db";

import { sanitizeUntrusted } from "./untrusted";

/**
 * Trusted context for one agent request.
 *
 * The security boundary of the whole agent lives here. `businessId` is resolved
 * once, from the authenticated session, and is never accepted from the model.
 * No tool schema carries a businessId field, so the model is structurally unable
 * to point a tool at a business the caller does not own.
 *
 * Tools reach the domain through `caller` — the real tRPC router — so every call
 * re-runs the same ownership check a merchant clicking in the UI would run. The
 * agent gets no privileged path.
 */
export type AgentContext = {
  userId: string;
  businessId: string;
  businessName: string;
  businessType: string;
  /** Where in the merchant app the request came from. Advisory only. */
  route?: string;
  entityId?: string;
  caller: ReturnType<typeof createCaller>;
};

export type BuildContextInput = {
  userId: string;
  businessId: string;
  headers: Headers;
  route?: string;
  entityId?: string;
};

/**
 * Verifies ownership before anything else runs. Throws (NOT_FOUND) if the
 * signed-in user does not own the business, exactly as the routers do.
 */
export async function buildAgentContext(
  input: BuildContextInput,
): Promise<AgentContext> {
  const business = await assertBusinessOwner(db, input.businessId, input.userId);

  const caller = createCaller({
    db,
    userId: input.userId,
    headers: input.headers,
  });

  return {
    userId: input.userId,
    businessId: business.id,
    businessName: business.name,
    businessType: business.type,
    route: input.route,
    entityId: input.entityId,
    caller,
  };
}

/**
 * The only place business identity is stated to the model. Deliberately short:
 * it is orientation, not data. Anything the model needs to reason about must
 * come from a tool so it is fetched under an ownership check.
 */
export function contextPreamble(ctx: AgentContext): string {
  // The business name is merchant-entered text that lands in the system prompt.
  // It is the one string here an attacker could shape, so it is sanitised on the
  // same path as tool output rather than trusted for being "ours".
  const name = sanitizeUntrusted(ctx.businessName).text;
  const type = sanitizeUntrusted(ctx.businessType).text;
  const lines = [
    `Business: ${name} (type: ${type}).`,
    "All tools operate on this business only. You cannot select another one.",
  ];
  if (ctx.route) {
    lines.push(
      `The merchant is currently viewing: ${sanitizeUntrusted(ctx.route).text}.`,
    );
  }
  return lines.join("\n");
}
