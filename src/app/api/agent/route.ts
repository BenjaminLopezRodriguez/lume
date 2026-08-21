import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { TRPCError } from "@trpc/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { buildAgentContext } from "@/ai/context";
import { confirmProposal, runAgent } from "@/ai/executor";
import { isAgentConfigured } from "@/ai/model";
import { ensureUser } from "@/server/auth";

/**
 * POST /api/agent — one merchant agent turn, or the confirmation of a proposal.
 *
 * Authentication mirrors tRPC's protectedProcedure exactly: Kinde session, then
 * ensureUser(). Authorization is never taken on trust from the body — the
 * businessId the client sends is verified against the signed-in owner in
 * buildAgentContext before the model runs, and every tool re-checks it.
 *
 * A confirmation carries only `confirmationId`. The tool and its arguments were
 * stored server-side when the proposal was made, so nothing the client sends on
 * the second leg can change what executes.
 */

const requestSchema = z.object({
  message: z.string().min(1).max(2000),
  businessId: z.string().uuid(),
  route: z.string().max(256).optional(),
  entityId: z.string().max(256).optional(),
  confirm: z.boolean().optional(),
  confirmationId: z.string().uuid().optional(),
  /** Optional identity echo. When present it must match the stored proposal. */
  confirmText: z.string().max(128).optional(),
});

export async function POST(req: Request) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Sign in to use the agent." }, { status: 401 });
  }
  await ensureUser();

  if (!isAgentConfigured()) {
    return NextResponse.json(
      { error: "The merchant agent is not configured on this deployment." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON." }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const input = parsed.data;

  let ctx;
  try {
    ctx = await buildAgentContext({
      userId: user.id,
      businessId: input.businessId,
      headers: req.headers,
      route: input.route,
      entityId: input.entityId,
    });
  } catch (error) {
    if (error instanceof TRPCError && error.code === "NOT_FOUND") {
      return NextResponse.json({ error: "Business not found." }, { status: 404 });
    }
    return NextResponse.json({ error: "Could not start the agent." }, { status: 500 });
  }

  if (input.confirm) {
    if (!input.confirmationId) {
      return NextResponse.json(
        { error: "A confirmation must name which proposal it confirms." },
        { status: 400 },
      );
    }

    const result = await confirmProposal(
      ctx,
      input.confirmationId,
      input.confirmText,
    );

    if (!result.ok) {
      // Truthful failure. Never a message that reads as if the action ran.
      return NextResponse.json(
        { message: `That did not run: ${result.error}` },
        { status: 400 },
      );
    }

    return NextResponse.json({
      message: `Done: ${result.summary}`,
      blocks: [{ kind: "tool_result", tool: result.tool, data: result.data }],
    });
  }

  const result = await runAgent(ctx, input.message);
  return NextResponse.json({
    message: result.message,
    blocks: result.blocks,
    pendingConfirmation: result.pendingConfirmation,
    skill: result.skill,
  });
}
