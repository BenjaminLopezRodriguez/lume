# UX Bug Ledger — Lume

## 2026-08-19 — Audit + Fix Session (landing page)

Scope: user-reported — animation jank, nonsensical borders, generic AI feel.

### Bugs fixed
| ID | Slug | File | Severity | Fix |
|----|------|------|----------|-----|
| A2/A5 | scroll-jank | landing.tsx:539 FeatureScroll | P1 | rAF-coalesced scroll handler; was read+write per event → layout thrash |
| A4 | no-prefers-reduced-motion | landing.tsx:539 | P1 | JS inline transforms bypassed the CSS reduced-motion block; now bails out |
| B1/C4 | color-token-drift | landing.tsx ×7 | P2 | border-gray-100 → var(--landing-border) |
| S1 | redundant-section-border | landing.tsx ×4 + footer | P2 | Removed border-t where background already changes |
| — | fabricated-social-proof | landing.tsx:87 REVIEWS | P0 | Removed fake merchants + "4.8 stars from real merchants" |
| N5 | dead-control | landing.tsx BottomCTA | P1 | "Talk to sales" <button> had no handler; removed |

### Verified after fix
- Scroll: 102 frames, 0 over 34ms, worst 9ms
- Section borders remaining: 1 (intentional white/8% inside dark section)
- Fake review strings in DOM: 0

### Open / not fixed (logged, out of scope)
| ID | Slug | File | Severity | Note |
|----|------|------|----------|------|
| N5 | broken-link | landing.tsx nav+footer | P1 | 4× href="#" — "For shoppers", "For developers" |
| — | unshipped-feature-claim | landing.tsx:76 | P2 | "Verified reviews from real customers" — no review system exists |
| — | orphaned-route | /sign-in, /sign-up | P2 | Nothing links to them; CTAs hit /api/auth/* directly |
| B1 | color-token-drift | landing.tsx | P2 | #faf8f6 / bg-white still off-token vs the app's design system |

### Recurring patterns
- color-token-drift: landing.tsx is the last surface not on design tokens → systemic; merchant app was migrated 2026-08-19.

## 2026-08-19 — Fix Session 2 (AI-generated feel + remaining honesty issues)

### Bugs fixed
| ID | Slug | File | Severity | Fix |
|----|------|------|----------|-----|
| — | fabricated-metrics | landing.tsx MARQUEE_ITEMS | P0 | "10,000+ merchants", "★ 4.8 average rating", "$500M+ processed", "1.8s avg. checkout" → capability statements |
| — | fabricated-ratings | landing.tsx SHOP_LISTINGS | P0 | Removed 4.9/4.8/4.7 star ratings from mockup |
| — | unshipped-feature-claim | landing.tsx:76 | P1 | "Verified reviews from real customers" → receipt history |
| N5 | broken-link | landing.tsx nav/footer/topbar | P1 | 24 dead href="#" → 0; nav trimmed to 3 real anchors, footer to real destinations |
| N5 | dead-control | landing.tsx Offering | P1 | "Learn more" button had no handler → register link |
| B1 | color-token-drift | landing.tsx ×5 | P2 | #faf8f6 → var(--landing-shell) |
| — | generic-pastel-tile-grid | landing.tsx SELL_METHODS | P2 | 4 competing pastel accents → one accent, hairline-separated |
| — | decorative-numbered-markers | landing.tsx FeatureScroll | P2 | 01/02/03 on a non-sequence → removed |
| — | centered-everything-rhythm | landing.tsx | P2 | Section headers left-aligned; centering kept only where purposeful |

### Verified after fix
- Dead links: 0 · broken anchors: 0
- Fabricated volume/rating/testimonial strings: 0
- Scroll: 101 frames, 0 over 34ms, worst 9ms

### Open
| ID | Slug | Severity | Note |
|----|------|----------|------|
| — | aspirational-section | P2 | LumeShop markets an unbuilt shopper app; mockup data is sample, no false metrics, but the premise is forward-looking |

## 2026-08-19 — Fix Session 3 (tighter Stripe register)

### Changes
| Area | Before | After |
|------|--------|-------|
| Heading weight | 15× font-black, 16× font-bold | all headings 600 |
| Display scale | h1 5.5rem, category stack 8xl | h1 4rem, stack 6xl; tracking -0.02/-0.03em |
| Control radius | 29× rounded-full pills | single 10px radius; rounded-full only on true circles |
| Landing neutrals | warm (hue 0–60) | cool slate (hue 265) |
| Closing CTA | full-bleed saturated magenta field | dark neutral ground, accent on the button only |
| Eyebrows | uppercase tracking-widest ×3 | 1 remains; rest removed or sentence case |

### Bugs fixed
| ID | Slug | Severity | Fix |
|----|------|----------|-----|
| C1 | wcag-contrast-fail | P1 | Offering category buttons were --landing-border on --landing-shell (~1.2:1) → --landing-subtle (3.71:1, passes AA large-text 3:1) |
| L6 | element-bleed | P2 | Channel grid cells had no horizontal padding below lg; text ran into the hairline |
| — | fabricated-metric | P0 | "sub-2-second load times" → capability statement |
| S2 | hero-dead-space | P2 | Right column sat empty ~500px before the mockup; items-end + larger mockup |

### Verified
- Dead links 0 · broken anchors 0 · fabricated strings 0
- Heading weights: {600: 17} · control radii: {0px, 10px}
- Scroll: 116 frames, 0 over 34ms, worst 17ms

## 2026-08-20 — Motion system

### Defects found (fixed)
| ID | Slug | File | Severity | Fix |
|----|------|------|----------|-----|
| A2 | dead-keyframes | globals.css | P2 | 8 of 10 keyframes had zero references; removed |
| I3 | press-overcompression | globals.css | P2 | .btn-spring 6% / .icon-spring 14% → 1.5% (0.94 icon-only) |
| A4 | reduced-motion-blunt | globals.css | P2 | Press feedback now survives (transform in place); disclosure lands open |
| — | css-syntax-corruption | globals.css | P0 | Self-inflicted: keyframe-delete regex used [^}]* and truncated 5 blocks. Caught by subagent, repaired. typecheck does NOT catch this — only a build or CSS parse does. |

### Defects found (logged, not fixed — out of scope)
| ID | Slug | File | Severity | Note |
|----|------|------|----------|------|
| A2 | layout-animated-sidebar | components/ui/sidebar.tsx | P2 | Animates width/left rather than transform. Timing retuned; structural fix is a rewrite. |
| — | fragile-site-existence | web-presence-page-view.tsx:112 | P1 | `hasSite = !!presence?.layout`. `layout` is a nullable site-builder column, not an existence signal — a presence row without it shows "Create website" despite a live site. Pre-dates this work (committed 2026-08-19). Needs a product call on what "site exists" means. |
| — | lint-errors-landing | landing.tsx | P2 | 4 errors + 2 warnings (unescaped entities, unnecessary assertions, unused cn/MagnifyingGlass). All pre-date this session's work; verified against commit 0b2ee99. |

### Verified
- Tokens resolve in browser; all 5 semantic classes compile to real transitions
- 0 elements animating width/height/top/left on the public page
- Reduced-motion block compiles with all 3 intended rules
- Residual one-off timing: only the looping OTP caret (duration-1000)
- All 10 sidebar nav destinations resolve
- No fabricated data introduced; Example table aria-hidden + labelling intact

### Not verified
- /m/* is Kinde-gated. Sidebar active transition, business selector, Channels
  disclosure, Customers empty→populated, dashboard states, dialogs, and responsive
  behaviour were NOT visually confirmed. Static + compiled-CSS verification only.
