# Claude Code workflow for Lume

How to use Claude CLI with this repo so every session builds from [thesis.md](../thesis.md).

## Start a session

```bash
cd /Users/benji/projects/lume
claude
```

Claude Code auto-loads [CLAUDE.md](../CLAUDE.md), which points at the thesis and doc hierarchy.

## Typical prompts

```bash
# Orient before building
claude "Read thesis.md and docs/THESIS_MAP.md. What should we build next?"

# Spec a feature from thesis
claude "Read thesis.md section on Recovery Paths. Draft a spec for restaurant happy-hour recovery."

# Implement from an approved plan
claude "Implement Phase 1 ownership schema per docs/superpowers/plans/ownership-roadmap.md"

# Review alignment
claude "Does the current share page align with thesis SMS principles? List gaps only."
```

## Spec-before-code pattern

Do not jump straight to implementation for thesis-sized work.

1. **Reference** — User cites thesis section or `docs/THESIS_MAP.md` gap.
2. **Spec** — Claude writes `docs/superpowers/specs/YYYY-MM-DD-<feature>.md` (problem, scope, acceptance criteria).
3. **Plan** — Claude writes `docs/superpowers/plans/YYYY-MM-DD-<feature>.md` (files to touch, sequence).
4. **Approve** — User confirms plan.
5. **Implement** — Claude codes against the plan only.
6. **Audit** — Append one line to `.claude/memory.md`:

   ```
   | ISO8601 | task-name | agent | duration | status | files |
   ```

Existing spec example: [docs/superpowers/specs/2026-07-01-design-system-migration.md](./superpowers/specs/2026-07-01-design-system-migration.md).

## Document hierarchy (do not confuse layers)

| File | Purpose |
|------|---------|
| `thesis.md` | Why Lume exists — ownership-first |
| `PRODUCT.md` | Who, brand, principles |
| `VERTICALS.md` | Vertical assets, checkout entry, lifecycles, UI primitives |
| `docs/THESIS_MAP.md` | Thesis ↔ code gaps |
| `docs/superpowers/specs/` | Feature specs |
| `docs/superpowers/plans/` | Implementation plans + roadmap |

## Decision checklist (before merging)

- [ ] Does this create or extend an **ownership** record after purchase?
- [ ] If a workflow can fail, is there a **recovery path** (not only an error)?
- [ ] Does SMS/notification have **checkpoint or recovery** context?
- [ ] Does Lume Shop work use **ownership quality**, not SKU catalog alone?
- [ ] tRPC queries return `null` not `undefined` when empty?

## Optional: slash command

If using Claude Code custom commands, add `.claude/commands/thesis.md`:

```markdown
Read thesis.md and docs/THESIS_MAP.md before answering.
State which thesis principle the task serves.
If the task is checkout-only with no lifecycle impact, say which phase it belongs in.
```

## What not to do

- Add features that end at payment with no ownership record (without flagging Phase 1+).
- Treat returns, cancellations, empty tables, or unused tickets as terminal only.
- Build Lume Shop as a generic ecommerce marketplace.
- Auto-send merchant or customer messages without checkpoint/recovery context.
