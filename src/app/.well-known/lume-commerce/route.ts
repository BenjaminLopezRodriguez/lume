import { NextResponse } from "next/server";
import { env } from "@/env";

/**
 * Capability discovery: lets a purchasing agent learn what this Lume deployment
 * supports without a human reading docs. Public and unauthenticated by design.
 * See docs/superpowers/specs/agent-commerce-boundary.md
 */
export function GET() {
  const enabled = Boolean(env.COMMERCE_API_KEY);

  return NextResponse.json(
    {
      version: "2026-08-20",
      checkout: true,
      quotes: enabled,
      agent_purchase: enabled,
      refunds: false,
      // Above this, a human confirms — regardless of what an agent asserts.
      human_confirmation: "per_delegation",
      endpoints: enabled
        ? {
            purchase_intents: "/api/commerce/purchase-intents",
            authorize: "/api/commerce/purchase-intents/{id}/authorize",
            confirm: "/api/commerce/purchase-intents/{id}/confirm",
          }
        : {},
    },
    { headers: { "cache-control": "public, max-age=300" } },
  );
}
