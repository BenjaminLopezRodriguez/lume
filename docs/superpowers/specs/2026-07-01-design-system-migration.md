# Design: Limeday Design System Migration

**Date:** 2026-07-01  
**Status:** Approved

---

## Overview

Migrating Lume to adopt limeday's design philosophy and architecture conventions. Five concrete areas: PRODUCT.md anchor, CSS semantic token system, font system, docs scaffold, and landing page refactor. Goal: consistent patterns across both codebases so conventions transfer without friction.

---

## Area 1 — PRODUCT.md

Add `/PRODUCT.md` to lume root. Single source of truth for product mission, target user, and non-goals. Follows limeday convention where `PRODUCT.md` is the first file any agent reads before touching product code.

**Decision:** Keeps agents aligned to shopper/merchant mission. Prevents scope drift.

---

## Area 2 — CSS Design System (semantic tokens)

Add `--landing-*` custom properties to `src/app/globals.css`. Replace inline constants and magic hex values with tokens.

### Token set

```css
/* brand */
--landing-accent:       #7C3AED;   /* purple-600 */
--landing-accent-light: #A78BFA;   /* purple-400 */
--landing-accent-dark:  #5B21B6;   /* purple-800 */

/* surface */
--landing-bg:           #0A0A0F;   /* near-black */
--landing-surface:      #13131A;   /* card bg */
--landing-border:       rgba(255,255,255,0.08);

/* text */
--landing-text:         #F4F4F5;   /* zinc-100 */
--landing-muted:        #71717A;   /* zinc-500 */

/* spacing rhythm */
--landing-section-y:    clamp(4rem, 8vw, 8rem);
--landing-gutter:       clamp(1rem, 4vw, 2rem);
```

**Decision:** Tokens decouple visual identity from component markup. Same pattern limeday uses for `--ld-*` tokens. Makes theme swaps a one-line CSS edit.

---

## Area 3 — Animation System

Three named spring animations + keyframes added to `globals.css`.

### Animations

| Name | Use | Curve |
|---|---|---|
| `btn-spring` | CTA buttons on hover/active | cubic-bezier(0.34, 1.56, 0.64, 1) 220ms |
| `icon-spring` | Icon nudges, badges | cubic-bezier(0.34, 1.56, 0.64, 1) 180ms |
| `pill-spring` | Tag/pill pop-in | cubic-bezier(0.34, 1.56, 0.64, 1) 160ms |

### Keyframes

```css
@keyframes spring-pop {
  0%   { transform: scale(0.92); opacity: 0; }
  60%  { transform: scale(1.04); }
  100% { transform: scale(1);    opacity: 1; }
}

@keyframes spring-nudge {
  0%   { transform: translateY(0); }
  40%  { transform: translateY(-3px); }
  100% { transform: translateY(0); }
}
```

**Decision:** Elastic spring feel matches limeday's motion language. Named animations are composable via Tailwind `animate-[btn-spring]` or plain `animation:` property.

---

## Area 4 — Font System

Three typefaces, each with a semantic role.

| Variable | Font | Role | Source |
|---|---|---|---|
| `--font-body` | Figtree | Body copy, UI labels, nav | Google Fonts |
| `--font-heading` | Bricolage Grotesque | Section headings, hero H1 | Google Fonts |
| `--font-display` | Space Grotesk | Feature callouts, stat numbers | Google Fonts |

### Load pattern

```ts
// src/app/layout.tsx
import { Figtree, Bricolage_Grotesque, Space_Grotesk } from "next/font/google";

const figtree = Figtree({ subsets: ["latin"], variable: "--font-body" });
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-heading" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-display" });
```

Body defaults to `--font-body`. Headings (`h1–h3`) default to `--font-heading` via `globals.css`. `--font-display` applied per-use via utility class.

**Decision:** Bricolage Grotesque + Figtree pair is already proven in limeday. Space Grotesk added for numeric/stat contexts where a geometric mono-adjacent feel reads better than Figtree.

---

## Area 5 — Landing Refactor

### File move

```
src/app/page.tsx  →  src/app/_components/landing.tsx
src/app/page.tsx  (thin shell, imports Landing, exports metadata)
```

Follows limeday convention: `page.tsx` is a routing shell only, no JSX substance.

### Inline consts → CSS vars

Before:
```ts
const ACCENT = "#7C3AED";
const BG = "#0A0A0F";
```

After: deleted. Components use `var(--landing-accent)`, `var(--landing-bg)` directly.

### Section component split

Each landing section becomes its own file under `_components/`:

```
_components/
  landing.tsx        ← orchestrator, assembles sections
  hero.tsx
  features.tsx
  testimonials.tsx
  shop-cta.tsx
  footer.tsx
```

**Decision:** Matches limeday's `_components/` colocation pattern. Eliminates 500+ line monolith. Each section is independently editable without scroll archaeology.

---

## Cross-cutting: Why limeday conventions

Lume and limeday share the same developer (same repo host, same agent workflows). Aligning conventions means:
- Skills, hooks, and prompts written for limeday work in lume without translation.
- Design tokens can be shared or diverged from a known baseline.
- New contributors (human or agent) onboard to one mental model.
