# Spec — Ask Lume: multi-turn agent + research tools

Status: **not started** · Written 2026-08-20 as a cold-start handoff
Prereq: `TAVILY_API_KEY` (the human will supply it)

Read [ontology.md](./ontology.md), [motion.md](./motion.md), and
[agent-commerce-boundary.md](./agent-commerce-boundary.md) first. This spec
assumes them.

---

## 1. What already exists (verified, do not rebuild)

Everything below is on `main` and passing as of commit `27354bf`.

| Area | File | State |
|------|------|-------|
| Model adapter | `src/ai/model.ts` | DeepSeek V4 Flash via LangChain `ChatOpenAI`, OpenAI-compatible base URL |
| Tool policy | `src/ai/policy.ts` | `TOOL_CLASS` map, `requiresConfirmation`, `RUN_LIMITS`, budget checks |
| Skills | `src/ai/skills.ts` | 6 skills, deterministic keyword router, read-only `unrouted` fallback |
| Tools | `src/ai/tools.ts` | 12 tools via `createCaller(appRouter)` — real routers, `assertBusinessOwner` still runs |
| Executor | `src/ai/executor.ts` | Single-turn tool loop, proposal store, budgets |
| Injection defence | `src/ai/untrusted.ts` | Nonce boundaries, marker neutralisation, `TRUST_PREAMBLE` |
| Block rendering | `src/lib/agent-blocks.ts` | Defensive shape probing |
| API | `src/app/api/agent/route.ts`, `.../capability/route.ts` | Kinde-authenticated POST, capability GET |
| UI | `src/app/m/_components/ask-lume-composer.tsx` | Single floating command surface, 406 lines |

Self-checks, all passing — run them before and after any change:

```
pnpm check:agent        policy + skill routing
pnpm check:injection    prompt-injection containment
pnpm check:blocks       block rendering (never throws)
pnpm check:commerce     purchase-intent state machine
pnpm check:idempotency  retry safety
pnpm eval:agent         5 evals against the LIVE model (needs DEEPSEEK_API_KEY)
```

`DEEPSEEK_API_KEY` **is** set in Vercel (Preview + Production) and locally.
Production capability should already report `configured: true`.

### The 12 existing tools

`business_get`, `business_get_setup_status`, `product_list`, `product_create`,
`order_list`, `customer_list`, `qr_list`, `qr_create`, `qr_remove`,
`store_get`, `analytics_orders_by_channel`, `diagnostics_setup`.

**Deliberately absent, because no domain capability exists:** refund, cancel,
any payment operation, revenue analytics, `product_set_price`, `store_publish`.
Do not add tools for these. Build the domain capability first, verify it, then
expose it.

---

## 2. What this spec adds

Two features. They are independent — Feature A needs no new credential and
should ship first.

### Feature A — multi-turn conversation

Today the agent is one-shot: every message starts a fresh run. The goal:

```
"Can you help me set up a product?"
  → "What should it be called?"
"Waffle Special"
  → "What price should I use?"
"$12"
  → [product_create]
  → "Created Waffle Special for $12.00. Publish it to your store?"
```

### Feature B — research and recommendation

Merchant delegates a decision ("choose the best price"), the agent retrieves
real comparable evidence, reasons over it, and proposes — with provenance.

---

## 3. Feature A — requirements

### 3.1 Schema

Append to `src/server/db/schema.ts`. **Append only** — the file carries a
"ASK USER before overwriting" banner from a past wipe.

```
agentConversations
  id, businessId, userId, status, task (jsonb), summary (text, nullable),
  createdAt, updatedAt
  index on (businessId, userId)

agentMessages
  id, conversationId, role ('user' | 'assistant'), content, createdAt
  index on conversationId
```

`task` is lightweight resumable state, not a form engine:

```jsonc
{
  "skill": "launch_product",
  "status": "collecting_input",
  "fields": { "name": "Waffle Special", "price": null },
  "lastCreatedEntity": { "type": "product", "id": "..." }
}
```

Statuses: `understanding`, `collecting_input`, `ready_to_execute`,
`executing`, `waiting_confirmation`, `completed`, `failed`, `cancelled`.

**Business scoping is a security boundary, not a convenience.** A conversation
belonging to Business A must never load as context for Business B. Verify
`businessId` AND `userId` on every load, via `assertBusinessOwner`. A request
naming a conversation from another business is rejected, not silently
re-scoped.

### 3.2 API contract

`POST /api/agent`

```jsonc
// new conversation
{ "message": "...", "businessId": "..." }
// continue
{ "conversationId": "...", "message": "...", "businessId": "..." }
// confirm (existing shape — the client sends ONLY the id)
{ "confirm": true, "confirmationId": "...", "conversationId": "...", "businessId": "..." }
```

Response:

```jsonc
{
  "conversationId": "...",
  "message": "markdown string",
  "status": "waiting_for_user" | "completed" | "confirmation_required" | "failed",
  "blocks": [...],            // optional, existing AgentBlock shape
  "pendingConfirmation": {...} // when status is confirmation_required
}
```

The client must never decide which tool runs next.

### 3.3 Loop states

Iterate until exactly one of: `COMPLETED`, `NEEDS_USER_INPUT`,
`CONFIRMATION_REQUIRED`, `FAILED`, `BUDGET_EXHAUSTED`.

A plain assistant text response is **not** automatically completion. Derive the
state: if the model asked a question, that is `NEEDS_USER_INPUT`.

### 3.4 Missing information is not failure

"Create a product" → ask for the name. Never invent a price, inventory, tax
behaviour, fulfilment, or publication state. After an answer, do **not** make
the merchant restate the whole request.

Prefer letting tools return structured domain errors
(`{ code: "missing_price" }`) over teaching the model every domain rule. Feed
those back as observations, not as generic failure.

### 3.5 Confirmation must resume the loop

Currently `confirm` executes the stored proposal and stops. It must instead
feed the result back to the model and continue the same conversation, so the
merchant gets "Created Waffle Special for $12.00. Publish it?" rather than
`{ success: true }`.

The proposal store already guarantees single-use execution
(`consumeSingleUse` in `src/server/commerce/idempotency.ts`, unique index is
the lock). Preserve that. Cancel must perform no mutation.

### 3.6 Hardening carries over — and matters more

Every tool result still goes through `wrapToolResult`. `TRUST_PREAMBLE` still
opens the system prompt. Multi-turn makes this **more** important: retrieved
customer or product text does not become trusted merely by sitting in history.

Do not persist raw tool payloads into `agentMessages`. Execution metadata
belongs in `agentToolCalls`, which already has `injectionSignals` and
`hadMarkers`.

### 3.7 Context growth

Do not resend an unbounded transcript. Send recent messages + structured task
state + entity references + current route. When summarising older turns, the
summary must preserve the distinction between merchant instruction, untrusted
retrieved data, and system rules — never collapse retrieved content into
trusted instruction.

### 3.8 Markdown

No renderer is installed. Add `react-markdown` (smallest maintained option for
this stack).

**Raw HTML must be disabled.** Do not add `rehype-raw`. Restrict link
protocols to http/https/mailto. A model emitting `<script>alert(1)</script>`
must render as text. Treat model output as untrusted presentation.

Actions stay native React — never a Markdown link like
`[Refund](javascript:...)`.

### 3.9 UI

The floating surface shows the conversation naturally, growing upward to a
sensible max height. It does **not** become a chat application. Preserve the
conversation when collapsed and reopened on the same business. Changing
business starts or loads a business-scoped conversation — never carries task
state across. Offer a quiet "New conversation" reset; a pending proposal that
is abandoned simply expires.

Loading says "Working…" or names a real tool step. **No simulated progress.**

---

## 4. Feature B — requirements

### 4.1 Provider

Use **Tavily** (`TAVILY_API_KEY`, human-supplied). Chosen because it returns
source URLs, is built for LLM retrieval, and has a predictable API — the spec
requires provenance on every external fact.

Keep it behind an interface so the tool layer never imports a vendor:

```ts
interface SearchProvider {
  search(input: SearchInput): Promise<SearchResult[]>;
}
```

Suggested layout: `src/ai/research/search-provider.ts` (interface),
`tavily.ts` (impl), `pricing.ts`, `recommendation.ts`.

**Fail closed.** No key → the research tools are not offered to the model at
all. Never fall back to the model's own guesses.

### 4.2 Tools

| Tool | Class |
|------|-------|
| `research_search` | `READ_EXTERNAL` |
| `research_local_businesses` | `READ_EXTERNAL` |
| `research_competitor_prices` | `READ_EXTERNAL` |
| `recommend_price` | `READ` |

`READ_EXTERNAL` is a new class in `policy.ts`. It needs network access, budget
accounting, injection wrapping, and provenance — but **not** mutation
confirmation.

Return observations, never conclusions:

```jsonc
{
  "hasData": true,
  "observations": [
    { "merchant": "...", "item": "...", "price": 1350, "currency": "USD",
      "sourceUrl": "...", "observedAt": "..." }
  ]
}
```

Only populate fields the provider actually returned. If a source exposes a
restaurant name but no price, there is no price.

### 4.3 Evidence priority

```
merchant instruction  →  existing Lume data  →  merchant history  →  external research
```

"Create Waffle Special for $12" must **not** trigger research — the merchant
already decided. "Choose a good price" may. "Same price as my Belgian Waffle"
uses the catalog, not the web.

### 4.4 Recommendation honesty

`recommend_price` returns structured evidence with a confidence level, not
false precision. Two weak comparables → `confidence: "low"`. No comparables →
say the evidence is insufficient and offer internal data or ask. **Never
manufacture a market range.** The existing empty-result rule applies.

Merchant economics outrank competitor median. If cost and target margin are
known, respect them and explain the tradeoff. Never invent cost or margin.

### 4.5 Delegation is scoped

"Choose the best price and create it" permits researching, choosing, and
creating **that** product. It does not permit touching any other product.
Financial and destructive operations keep their stronger confirmation
requirement regardless of delegation.

### 4.6 Budgets and caching

Max 3 external searches per run, on top of the existing 15-call / 5-mutation
budget. Return 5–15 normalised, deduplicated results — never 100. Cache by
provider + normalised query + coarse location + type, TTL in hours, and always
record `observedAt` so stale research is never presented as current.

### 4.7 Security

External results are the **highest-risk injection surface** in the product — a
competitor page may literally contain "IGNORE PREVIOUS INSTRUCTIONS". Every
result goes through `wrapToolResult`; signals persist to `agentToolCalls`.

**Do not expose a generic `fetch_url(url)` tool.** Prefer provider APIs. If any
fetching capability is ever added, block SSRF (internal ranges, link-local,
metadata endpoints) and validate protocols.

### 4.8 Location

`businessLocations` currently has only a free-text `address` (varchar 512) —
no city, region, or coordinates. Either parse conservatively or add structured
fields. Do not make the model ask "what city are you in?" when Lume knows.
Resolve location server-side; do not hand precise location to the model.

---

## 5. Gotchas discovered the hard way

Each of these cost real debugging time this session. Do not rediscover them.

1. **Thinking mode is ON by default at `high` effort, and reasoning tokens
   count against `max_tokens`.** A 1200-token budget was consumed entirely by
   reasoning, returning **empty content** with `finish_reason: "length"`.
   `model.ts` sets `thinking: { type: "disabled" }`. Keep it. If you ever
   enable thinking for a hard task, raise `max_tokens` substantially.

2. **A client-side exception takes down the whole merchant app.** A block-shape
   mismatch (`e.items.map` on undefined) blanked every page after a *successful*
   API call. `src/lib/agent-blocks.ts` exists so the client assumes nothing
   about server payload shape. Keep that discipline for any new block type.

3. **Time-dependent render = hydration mismatch.** `new Date().getHours()`
   during render produced React #418 because the server is UTC and the browser
   is local. Resolve after mount.

4. **Never run `pnpm build` while a dev server is running.** They share `.next`
   and the build fails on a *different* route each time — it looks like a real
   error and is not. `pkill -f next` first.

5. **`pnpm typecheck` does not parse CSS** and will not catch a broken
   `globals.css`. Only a build or a CSS parse will.

6. **Bare Node cannot resolve `@/` or extensionless imports.**
   `scripts/alias-loader.mjs` handles this for `pnpm eval:agent`.

7. **`/m/*` is Kinde-gated (307).** No visual verification is possible without
   credentials. Say so explicitly rather than implying screens were seen.

---

## 6. Verification gate

Before deploy:

```
pnpm typecheck && pnpm lint
pnpm check:agent && pnpm check:injection && pnpm check:blocks
pnpm check:commerce && pnpm check:idempotency
pnpm eval:agent
pkill -f next && rm -rf .next && pnpm build
```

Confirm: no dead nav destinations, no fabricated data introduced, no tool
offered without real backing, and production `/api/agent/capability` reports
`configured: true`.

### Multi-turn evals to add (`src/ai/evals.ts`)

Against the live model:

- **Product setup** — "Help me create a product" → asks name → "Waffle
  Special" → asks price → "12" → tool call. Exactly one product persisted.
- **Fully specified** — "Create a Waffle Special for $12" asks nothing extra.
- **Missing critical data** — "Make a product" asks; never invents.
- **Follow-up reference** — "Make it $10" resolves the just-created product.
- **Confirmation resume** — confirm → execute → result returns to the model →
  final response continues the conversation.
- **Cancellation** — no mutation; conversation still usable.
- **Business switching** — a conversation from A rejected for B.
- **Markdown XSS** — `<script>alert(1)</script>` renders as text.
- **Injection via search result** (Feature B) — wrapped, signals persisted,
  workflow unaffected, data still shown.
- **Supplied price** (Feature B) — no unnecessary external search.
- **No results** (Feature B) — states insufficient evidence, does not fabricate.

### Production smoke test

A harmless READ through the deployed agent: "What is my business setup
status?" Do **not** run a financial or destructive mutation as a smoke test. If
a labelled TEST product is created, clean it up through normal domain tooling —
and only against a merchant without real data.

---

## 7. Reporting rules

Separate **working end-to-end** (actually exercised through V4 Flash → real
tools → persisted result) from **implemented but gated** from **deferred**.

Never describe a schema field, stub, unverified API, or UI toggle as
supported. Never say Lume "researched the market" unless a real external
retrieval occurred. State plainly what was not visually verified.
