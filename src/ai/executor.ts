import "server-only";

import { createHash } from "node:crypto";

import type { AIMessage } from "@langchain/core/messages";
import {
  HumanMessage,
  SystemMessage,
  ToolMessage,
  type BaseMessage,
} from "@langchain/core/messages";
import { eq } from "drizzle-orm";

import { db } from "@/server/db";
import { agentRuns, agentToolCalls } from "@/server/db/schema";
import {
  consumeSingleUse,
  storeSingleUse,
} from "@/server/commerce/idempotency";

import type { AgentContext } from "./context";
import { contextPreamble } from "./context";
import { chatModel, modelName } from "./model";
import {
  checkBudget,
  isKnownTool,
  newTally,
  recordCall,
  requireClass,
  requiresConfirmation,
  RUN_LIMITS,
  type RunTally,
  type ToolName,
} from "./policy";
import { DEFAULT_SKILL, routeSkill, SKILLS, skillTools } from "./skills";
import { TRUST_PREAMBLE, wrapToolResult } from "./untrusted";
import { bindableTools, toolDef } from "./tools";

/**
 * The tool-call loop.
 *
 * Four things it will not do, all deliberate:
 *
 * - It will not execute a tool that requires confirmation. Such a call is stored
 *   server-side and returned as a proposal; execution is a second request that
 *   carries only an id.
 * - It will not let a tool result act as instruction. Every result goes through
 *   wrapToolResult() in src/ai/untrusted.ts — nonced boundary, marker
 *   neutralisation, rule after the payload. None of that is reimplemented here.
 * - It will not act on a stale id. An id read more than STALE_AFTER_CALLS tool
 *   calls ago is refused and the model is told to re-read — the wrong-row delete
 *   is the failure mode that actually costs a merchant something.
 * - It will not report success it did not observe.
 */

/** How long an id from a read stays usable as a mutation argument. */
const STALE_AFTER_CALLS = 3;

/** Proposals are short-lived: a confirmation minutes later is a different decision. */
const PROPOSAL_TTL_MS = 10 * 60 * 1000;

const PROPOSAL_OPERATION = "agent.proposal" as const;

export type AgentBlock = {
  kind: "tool_result";
  tool: ToolName;
  data: unknown;
};

export type PendingConfirmation = {
  /** Echoed back by the client as `confirmationId`. The only thing it sends. */
  id: string;
  title: string;
  summary: string;
  confirmLabel: string;
  cancelLabel: string;
  tool: ToolName;
  classification: string;
  /** Identity-bound token naming the exact row/values this decision covers. */
  confirmText: string;
};

export type AgentResult = {
  message: string;
  blocks?: AgentBlock[];
  pendingConfirmation?: PendingConfirmation;
  skill: string;
};

const EMPTY_RULE =
  "If hasData is false, say the data does not exist. Do not infer, estimate, or reuse a number from an earlier answer.";

function systemPrompt(ctx: AgentContext, skill: keyof typeof SKILLS): string {
  return [
    // First, always. The shared preamble carries the trust, no-fabrication, and
    // business-scoping rules; it is imported rather than restated so a prompt
    // cannot ship without them.
    TRUST_PREAMBLE,
    "You are Lume's operating agent for one merchant. You answer with what the tools actually return.",
    contextPreamble(ctx),
    EMPTY_RULE,
    "Never claim to have done something. Actions that change data are confirmed by the merchant separately; until then, describe what you propose.",
    "Lume cannot refund, cancel, or move money. If asked, say so plainly.",
    "An id used as a tool argument must come from a result you read in this same conversation, moments ago. If it is older than that, read again first.",
    `Skill: ${SKILLS[skill].name}. ${SKILLS[skill].instructions}`,
  ].join("\n\n");
}

/**
 * The only path by which tool output reaches the model. Delimiting, nonce,
 * marker neutralisation, and rule placement all live in src/ai/untrusted.ts —
 * hand-rolling any of it here would be a second, weaker implementation.
 */
function asDataMessage(
  tool: string,
  payload: unknown,
  toolCallId: string,
): ToolMessage {
  const wrapped = wrapToolResult(tool, payload);
  return new ToolMessage({
    tool_call_id: toolCallId,
    name: tool,
    content: `${wrapped.content}\n${EMPTY_RULE}`,
  });
}

/** Injection signals for the audit row. Recorded, never used to auto-block. */
function scanForSignals(payload: unknown) {
  const { signals, hadMarkers } = wrapToolResult("scan", payload);
  return { signals, hadMarkers };
}

function hashArgs(args: unknown): string {
  return createHash("sha256").update(JSON.stringify(args ?? {})).digest("hex");
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Unknown error";
}

function textOf(reply: AIMessage): string {
  if (typeof reply.content === "string") return reply.content;
  return reply.content
    .map((part) =>
      typeof part === "string" ? part : "text" in part ? String(part.text) : "",
    )
    .join("")
    .trim();
}

// ─── Audit ─────────────────────────────────────────────────────────────────

async function startRun(ctx: AgentContext, skill: string) {
  const [run] = await db
    .insert(agentRuns)
    .values({
      businessId: ctx.businessId,
      userId: ctx.userId,
      model: modelName(),
      skill,
      status: "running",
    })
    .returning({ id: agentRuns.id });
  return run?.id ?? null;
}

async function finishRun(runId: string | null, status: string) {
  if (!runId) return;
  await db
    .update(agentRuns)
    .set({ status, completedAt: new Date() })
    .where(eq(agentRuns.id, runId));
}

async function recordToolCall(
  runId: string | null,
  tool: ToolName,
  args: unknown,
  status: string,
  startedAt: Date,
  errorCode?: string,
  /** From wrapToolResult. Recorded as a security signal, never acted on. */
  detection?: { signals: string[]; hadMarkers: boolean },
) {
  if (!runId) return;
  await db.insert(agentToolCalls).values({
    runId,
    tool,
    classification: requireClass(tool),
    // The arguments are hashed and the payload is never stored. What is kept is
    // the fact that something in the result tried to talk to the model.
    inputHash: hashArgs(args),
    status,
    startedAt,
    completedAt: new Date(),
    errorCode: errorCode?.slice(0, 64) ?? null,
    injectionSignals: detection?.signals.length ? detection.signals : null,
    hadMarkers: detection?.hadMarkers ?? false,
  });
}

// ─── Proposal store ────────────────────────────────────────────────────────

type StoredProposal = {
  tool: ToolName;
  args: Record<string, unknown>;
  businessId: string;
  userId: string;
  confirmText: string;
  summary: string;
  expiresAt: number;
};

/**
 * The arguments live on the server, keyed by an opaque id. The client confirms
 * an id, never a payload, so a tampered client cannot alter what executes.
 * Reuses the idempotency table: it already has the unique (operation, key) index
 * that makes single-use a write race rather than a read-then-check.
 */
async function storeProposal(proposal: StoredProposal): Promise<string> {
  return storeSingleUse(
    PROPOSAL_OPERATION,
    proposal,
    hashArgs({ tool: proposal.tool, args: proposal.args }),
  );
}

type ClaimResult =
  | { ok: true; proposal: StoredProposal }
  | { ok: false; error: string };

/**
 * Consumes a proposal exactly once. The conditional UPDATE (responseStatus IS
 * NULL) is the lock: a replayed confirm loses it and gets nothing.
 */
async function claimProposal(id: string): Promise<ClaimResult> {
  const consumed = await consumeSingleUse<StoredProposal>(PROPOSAL_OPERATION, id);
  if (!consumed.ok) {
    return {
      ok: false,
      error:
        consumed.reason === "unknown"
          ? "That confirmation is unknown."
          : "That confirmation was already used.",
    };
  }

  // Expiry is checked after the claim, so a stale confirm still burns its
  // single use rather than remaining replayable.
  if (Date.now() > consumed.payload.expiresAt) {
    return { ok: false, error: "That confirmation has expired. Ask again." };
  }
  return { ok: true, proposal: consumed.payload };
}

// ─── Run ───────────────────────────────────────────────────────────────────

export async function runAgent(
  ctx: AgentContext,
  message: string,
): Promise<AgentResult> {
  const skill = routeSkill(message) ?? DEFAULT_SKILL;
  const allowed = skillTools(skill);
  const runId = await startRun(ctx, skill);

  const model = chatModel().bindTools(bindableTools(allowed));
  const messages: BaseMessage[] = [
    new SystemMessage(systemPrompt(ctx, skill)),
    new HumanMessage(message),
  ];

  const blocks: AgentBlock[] = [];
  let tally: RunTally = newTally(Date.now());
  let callIndex = 0;
  /** Call index of the most recent read that handed the model a row id. */
  let lastIdReadAt: number | null = null;

  try {
    for (let step = 0; step < RUN_LIMITS.maxToolCalls; step += 1) {
      const reply = (await model.invoke(messages)) as AIMessage;
      messages.push(reply);

      const calls = reply.tool_calls ?? [];
      if (calls.length === 0) {
        await finishRun(runId, "completed");
        return {
          message: textOf(reply),
          blocks: blocks.length ? blocks : undefined,
          skill,
        };
      }

      for (const call of calls) {
        const callId = call.id ?? `${call.name}-${step}`;

        // A tool outside the routed skill is not merely unhelpful — it is the
        // model reaching past the capability it was granted.
        if (!isKnownTool(call.name) || !allowed.includes(call.name)) {
          messages.push(
            asDataMessage(
              call.name,
              { hasData: false, error: "This tool is not available here." },
              callId,
            )
          );
          continue;
        }

        const name: ToolName = call.name;
        const verdict = checkBudget(tally, name, Date.now());
        if (!verdict.ok) {
          await recordToolCall(runId, name, call.args, "blocked", new Date(), "budget");
          await finishRun(runId, "failed");
          return {
            message: `I stopped before finishing: ${verdict.reason} Nothing further was run.`,
            blocks: blocks.length ? blocks : undefined,
            skill,
          };
        }

        const def = toolDef(name);
        const parsed = def.schema.safeParse(call.args ?? {});
        if (!parsed.success) {
          await recordToolCall(
            runId,
            name,
            call.args,
            "failed",
            new Date(),
            "invalid_arguments",
          );
          messages.push(
            asDataMessage(
              name,
              {
                hasData: false,
                error: "Invalid arguments.",
                details: parsed.error.flatten(),
              },
              callId,
            )
          );
          tally = recordCall(tally, name);
          continue;
        }

        const args = parsed.data as Record<string, unknown>;

        // Stale-id guard. An id the model is holding from several steps back is
        // the classic wrong-row mutation: the merchant means the row on screen,
        // the model means the last one it happened to read.
        if (
          requiresConfirmation(name) &&
          typeof args.id === "string" &&
          (lastIdReadAt === null || callIndex - lastIdReadAt > STALE_AFTER_CALLS)
        ) {
          await recordToolCall(runId, name, args, "blocked", new Date(), "stale_reference");
          messages.push(
            asDataMessage(
              name,
              {
                hasData: false,
                error:
                  "Stale reference: that id was not read recently enough. Read the current list again, then propose using an id from that result.",
              },
              callId,
            )
          );
          callIndex += 1;
          tally = recordCall(tally, name);
          continue;
        }

        // Anything that is not a READ stops here. It is proposed, not performed.
        if (requiresConfirmation(name)) {
          const summary = def.summarize(parsed.data);
          const confirmText = def.confirmText?.(parsed.data) ?? hashArgs(args);
          const id = await storeProposal({
            tool: name,
            args,
            businessId: ctx.businessId,
            userId: ctx.userId,
            confirmText,
            summary,
            expiresAt: Date.now() + PROPOSAL_TTL_MS,
          });

          await recordToolCall(runId, name, args, "awaiting_confirmation", new Date());
          await finishRun(runId, "awaiting_confirmation");

          return {
            message: `This needs your confirmation before it runs: ${summary}`,
            blocks: blocks.length ? blocks : undefined,
            pendingConfirmation: {
              id,
              title:
                requireClass(name) === "DESTRUCTIVE"
                  ? "Confirm deletion"
                  : "Confirm change",
              summary,
              confirmLabel: requireClass(name) === "DESTRUCTIVE" ? "Delete" : "Confirm",
              cancelLabel: "Cancel",
              tool: name,
              classification: requireClass(name),
              confirmText,
            },
            skill,
          };
        }

        const startedAt = new Date();
        callIndex += 1;
        tally = recordCall(tally, name);
        try {
          const data = await def.execute(ctx, parsed.data);
          const wrapped = asDataMessage(name, data, callId);
          const scan = scanForSignals(data);
          // Signals never gate the answer — containment is the defence, and the
          // merchant still gets to see their own data.
          await recordToolCall(runId, name, args, "ok", startedAt, undefined, {
            signals: scan.signals,
            hadMarkers: scan.hadMarkers,
          });
          if (name === "qr_list") lastIdReadAt = callIndex;
          blocks.push({ kind: "tool_result", tool: name, data });
          messages.push(wrapped);
        } catch (error) {
          const reason = errorMessage(error);
          await recordToolCall(runId, name, args, "failed", startedAt, reason);
          // The model is told the truth so it cannot narrate a success.
          messages.push(
            asDataMessage(
              name,
              { hasData: false, succeeded: false, error: reason },
              callId,
            )
          );
        }
      }
    }

    await finishRun(runId, "failed");
    return {
      message:
        "I stopped before finishing: this request took more steps than one run allows. Nothing further was run.",
      blocks: blocks.length ? blocks : undefined,
      skill,
    };
  } catch (error) {
    await finishRun(runId, "failed");
    return {
      message: `I could not complete that: ${errorMessage(error)}`,
      blocks: blocks.length ? blocks : undefined,
      skill,
    };
  }
}

// ─── Confirmed execution ───────────────────────────────────────────────────

export type ConfirmResult =
  | { ok: true; tool: ToolName; summary: string; data: unknown }
  | { ok: false; error: string };

/**
 * Runs a proposal the merchant approved. The model is not in this path: the tool
 * and its arguments come from the server-side proposal, are re-validated against
 * the same schema, and run under the same ownership-checked context. A confirm
 * request carries an id and nothing else that can change the outcome.
 */
export async function confirmProposal(
  ctx: AgentContext,
  confirmationId: string,
  echoedConfirmText?: string,
): Promise<ConfirmResult> {
  const claim = await claimProposal(confirmationId);
  if (!claim.ok) return { ok: false, error: claim.error };

  const proposal = claim.proposal;

  // The proposal is bound to the business it was made for, re-checked against
  // the context this request authenticated into.
  if (proposal.businessId !== ctx.businessId || proposal.userId !== ctx.userId) {
    return { ok: false, error: "That confirmation belongs to a different session." };
  }
  if (echoedConfirmText && echoedConfirmText !== proposal.confirmText) {
    return { ok: false, error: "That confirmation does not match what was proposed." };
  }
  if (!isKnownTool(proposal.tool) || !requiresConfirmation(proposal.tool)) {
    return { ok: false, error: "That action is not confirmable." };
  }

  const def = toolDef(proposal.tool);
  const parsed = def.schema.safeParse(proposal.args);
  if (!parsed.success) {
    return { ok: false, error: "The proposed action is no longer valid." };
  }

  const runId = await startRun(ctx, `confirm:${proposal.tool}`);
  const startedAt = new Date();
  try {
    const data = await def.execute(ctx, parsed.data);
    await recordToolCall(runId, proposal.tool, proposal.args, "ok", startedAt);
    await finishRun(runId, "completed");
    return { ok: true, tool: proposal.tool, summary: proposal.summary, data };
  } catch (error) {
    const reason = errorMessage(error);
    await recordToolCall(runId, proposal.tool, proposal.args, "failed", startedAt, reason);
    await finishRun(runId, "failed");
    return { ok: false, error: reason };
  }
}
