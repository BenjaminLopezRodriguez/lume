import "server-only";

import { ChatOpenAI } from "@langchain/openai";

import { env } from "@/env";

/**
 * Model access for the merchant agent.
 *
 * Provider-neutral by intent: everything above this file talks about "the model",
 * and only this file knows it is DeepSeek. Swapping providers should mean editing
 * here, not editing tools.
 *
 * DeepSeek V4 Flash speaks the OpenAI Chat Completions shape, so the standard
 * LangChain provider is used rather than a bespoke inference stack.
 */

export const DEFAULT_MODEL = "deepseek-v4-flash";
const BASE_URL = "https://api.deepseek.com";

/**
 * Whether the merchant agent can run at all. Checked before any surface is shown,
 * so the UI never offers a composer that would 503.
 */
export function isAgentConfigured(): boolean {
  return Boolean(env.DEEPSEEK_API_KEY);
}

export function modelName(): string {
  return env.DEEPSEEK_MODEL ?? DEFAULT_MODEL;
}

/**
 * Thinking mode is ON by default on V4 Flash, at `high` effort — verified against
 * the live API, where a 10-token budget was consumed entirely by reasoning and
 * returned empty content. Merchant operations are tool selection and lookup, not
 * hard reasoning, so it is disabled: faster, cheaper, and it actually answers.
 *
 * Verified 2026-08-20: with thinking disabled the same prompt returned content in
 * 1 completion token; with it enabled, 10 reasoning tokens and no content.
 */
const NON_THINKING = { thinking: { type: "disabled" } } as const;

export function chatModel(): ChatOpenAI {
  const apiKey = env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    // Fail closed. Never substitute another provider or a canned reply — a
    // merchant must not receive something that looks like an answer but is not.
    throw new Error("Merchant agent is not configured.");
  }

  return new ChatOpenAI({
    apiKey,
    model: modelName(),
    // Low but non-zero: tool arguments should be stable, prose need not be robotic.
    temperature: 0.2,
    maxTokens: 1024,
    timeout: 30_000,
    maxRetries: 2,
    configuration: { baseURL: BASE_URL },
    modelKwargs: NON_THINKING,
  });
}
