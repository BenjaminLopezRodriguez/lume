import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { TRPCError } from "@trpc/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  apiStatusFor,
  appendMessage,
  createConversation,
  loadConversation,
  newTask,
  resolveSkill,
  saveConversationState,
  statePreamble,
  taskStatusFor,
  type ConversationTask,
  type LoadedConversation,
} from "@/ai/conversation";
import { buildAgentContext } from "@/ai/context";
import { confirmAndResume, runTurn, type AgentResult } from "@/ai/executor";
import { isAgentConfigured } from "@/ai/model";
import { DEFAULT_SKILL, type SkillName } from "@/ai/skills";
import { ensureUser } from "@/server/auth";

/**
 * POST /api/agent — one merchant agent turn, or the confirmation of a proposal,
 * within a persistent conversation.
 *
 * Authentication mirrors tRPC's protectedProcedure exactly: Kinde session, then
 * ensureUser(). Authorization is never taken on trust from the body — the
 * businessId the client sends is verified against the signed-in owner in
 * buildAgentContext before the model runs, and every tool re-checks it.
 *
 * A conversationId is subject to the same rule. It is resolved through
 * loadConversation, which verifies BOTH businessId and userId and refuses
 * (404/403) rather than re-scoping someone else's conversation to the caller.
 *
 * A confirmation carries only `confirmationId`. The tool and its arguments were
 * stored server-side when the proposal was made, so nothing the client sends on
 * the second leg can change what executes. The client never decides which tool
 * runs next — it sends text or an id, and the server runs the loop.
 */

const requestSchema = z.object({
  /** Required for a normal turn; omitted on a confirmation. */
  message: z.string().min(1).max(2000).optional(),
  businessId: z.string().uuid(),
  /** Continues an existing conversation. Absent starts a new one. */
  conversationId: z.string().uuid().optional(),
  route: z.string().max(256).optional(),
  entityId: z.string().max(256).optional(),
  confirm: z.boolean().optional(),
  confirmationId: z.string().uuid().optional(),
  /** Optional identity echo. When present it must match the stored proposal. */
  confirmText: z.string().max(128).optional(),
});

/** The response shape, assembled in one place so every path answers the same. */
function reply(
  conversationId: string,
  result: AgentResult,
  status = 200,
): NextResponse {
  return NextResponse.json(
    {
      conversationId,
      message: result.message,
      status: apiStatusFor(result.state),
      blocks: result.blocks,
      pendingConfirmation: result.pendingConfirmation,
      skill: result.skill,
    },
    { status },
  );
}

/**
 * Records the turn: the assistant's prose, and only what the server observed.
 * Tool payloads never land in agentMessages — execution metadata is in
 * agentToolCalls, where the injection signals already live.
 */
async function persistTurn(
  loaded: LoadedConversation,
  skill: SkillName,
  result: AgentResult,
): Promise<void> {
  await appendMessage(loaded.conversation.id, "assistant", result.message);

  const previous = loaded.conversation.task;
  const task: ConversationTask = {
    ...(previous ?? newTask(skill)),
    skill,
    status: taskStatusFor(result.state),
    fields: previous?.fields ?? {},
    pending: result.pendingConfirmation
      ? {
          tool: result.pendingConfirmation.tool,
          summary: result.pendingConfirmation.summary,
          confirmationId: result.pendingConfirmation.id,
        }
      : null,
  };

  await saveConversationState(loaded.conversation.id, task, loaded.summary);
}

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

  const identity = { businessId: ctx.businessId, userId: ctx.userId };

  // A named conversation is resolved before anything else runs. The scope check
  // is inside loadConversation, so there is no path that reads a conversation
  // without it.
  let loaded: LoadedConversation | null = null;
  if (input.conversationId) {
    const outcome = await loadConversation(input.conversationId, identity);
    if (!outcome.ok) {
      return NextResponse.json({ error: outcome.error }, { status: outcome.status });
    }
    loaded = outcome.loaded;
  }

  // ── Confirmation ─────────────────────────────────────────────────────────
  if (input.confirm) {
    if (!input.confirmationId) {
      return NextResponse.json(
        { error: "A confirmation must name which proposal it confirms." },
        { status: 400 },
      );
    }

    const skill = loaded?.conversation.task?.skill ?? DEFAULT_SKILL;
    const outcome = await confirmAndResume(ctx, {
      confirmationId: input.confirmationId,
      echoedConfirmText: input.confirmText,
      skill,
      history: loaded?.recent,
      statePreamble: loaded
        ? statePreamble(loaded.conversation.task, loaded.summary)
        : null,
    });

    if (!outcome.ok) {
      // Truthful failure. Never a message that reads as if the action ran.
      const message = `That did not run: ${outcome.error}`;
      if (loaded) {
        await appendMessage(loaded.conversation.id, "assistant", message);
      }
      return NextResponse.json(
        { conversationId: loaded?.conversation.id ?? null, message, status: "failed" },
        { status: 400 },
      );
    }

    if (!loaded) {
      // A confirmation with no conversation still answers, it just has nothing
      // to continue.
      return NextResponse.json({
        conversationId: null,
        message: outcome.turn.message,
        status: apiStatusFor(outcome.turn.state),
        blocks: outcome.turn.blocks,
        pendingConfirmation: outcome.turn.pendingConfirmation,
        skill: outcome.turn.skill,
      });
    }

    await persistTurn(loaded, skill, outcome.turn);
    return reply(loaded.conversation.id, outcome.turn);
  }

  // ── Normal turn ──────────────────────────────────────────────────────────
  if (!input.message) {
    return NextResponse.json(
      { error: "A message is required." },
      { status: 400 },
    );
  }

  // A follow-up that matches no intent stays in the skill the conversation is
  // already in, so answering "12" to "what price?" does not fall back to the
  // read-only skill and lose the task.
  const skill = resolveSkill(loaded?.conversation.task?.skill ?? null, input.message);

  if (!loaded) {
    const conversation = await createConversation(identity, skill);
    loaded = { conversation, recent: [], summary: null };
  }

  await appendMessage(loaded.conversation.id, "user", input.message);

  const result = await runTurn(ctx, {
    skill,
    history: loaded.recent,
    statePreamble: statePreamble(loaded.conversation.task, loaded.summary),
    userMessage: input.message,
  });

  await persistTurn(loaded, skill, result);
  return reply(loaded.conversation.id, result);
}
