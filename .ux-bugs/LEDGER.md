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
