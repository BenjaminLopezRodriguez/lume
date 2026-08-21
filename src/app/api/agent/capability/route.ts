import { NextResponse } from "next/server";

import { isAgentConfigured } from "@/ai/model";

/**
 * GET /api/agent/capability — can the agent run at all?
 *
 * A boolean and nothing else. No model name, no provider, no hint about the
 * credential: an unconfigured deployment should reveal that it is unconfigured,
 * not what it is missing.
 */
export function GET() {
  return NextResponse.json(
    { configured: isAgentConfigured() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
