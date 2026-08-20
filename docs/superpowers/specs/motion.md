# Spec — Motion system

Status: **authoritative** · Tokens live in `src/styles/globals.css`

Read this before adding any transition. If a transition you need is not here,
extend this file — do not invent a one-off duration in a component.

## The rule

Motion communicates one of five things. If a proposed animation does none of
them, it is decoration and does not ship.

1. **Cause and effect** — the UI visibly responds to an action.
2. **Spatial relationship** — where something came from, where it went.
3. **State change** — selected, expanded, added, removed, confirmed, failed.
4. **Hierarchy** — primary actions feel firmer than secondary ones.
5. **Continuity** — navigation and disclosure are not unrelated hard cuts.

The best motion becomes invisible after repeated use. Lume should feel fast and
controlled, not performed.

## Tokens

| Duration | Value | Use |
|----------|-------|-----|
| `--duration-instant` | 100ms | pointer feedback, hover, colour change |
| `--duration-fast` | 160ms | popovers, menus, every exit |
| `--duration-standard` | 220ms | surfaces entering, disclosure |
| `--duration-deliberate` | 340ms | high-confidence confirmation only |

| Easing | Curve | Use |
|--------|-------|-----|
| `--ease-snap` | `0.2, 0, 0, 1` | decisive settle — the default |
| `--ease-enter` | `0.34, -0.02, 0.2, 1` | slight anticipation, smooth arrival |
| `--ease-exit` | `0.4, 0, 1, 1` | accelerate away |
| `--ease-move` | `0.4, 0, 0.2, 1` | position/size continuity |
| `--ease-spring` | `0.34, 1.4, 0.64, 1` | direct manipulation only |

### How to reference these in Tailwind v4

Verified by compiling Tailwind against this project's `@theme`:

- `--ease-*` **is** a theme namespace → use the named utilities directly:
  `ease-snap`, `ease-enter`, `ease-exit`, `ease-move`, `ease-spring`.
- `--duration-*` is **not** a theme namespace — there is no `duration-fast`
  utility. Use the custom-property form: `duration-(--duration-fast)`.

`tw-animate-css` reads `--tw-duration` / `--tw-ease`, so both forms correctly
retime `animate-in` / `animate-out` / `animate-accordion-*`.

Standard popover string:

```
duration-(--duration-fast) ease-enter
data-closed:duration-(--duration-instant) data-closed:ease-exit
```

**Exits are always faster than entrances.** A thing leaving should not cost the
user time.

## Semantic classes

| Class | What it is for |
|-------|----------------|
| `.motion-control` | anything pressable — 1.5% compression in, snap back |
| `.motion-control-icon` | add alongside `.motion-control` on icon-only controls (smaller target needs more optical compression) |
| `.motion-popover` | menus, dropdowns, tooltips — enters from trigger, exits faster |
| `.motion-disclosure` | accordions and expanding sections — `grid-template-rows` so height animates with no layout jump and no measuring |
| `.motion-page` | page **content** enter. Never the shell. |
| `.motion-move` | position/size changes that must stay traceable |

## Grammar by primitive

- **Buttons** — 1.5% compression on pointer down, snap back on release. Loading
  preserves button dimensions and transitions content; it never resizes.
  Success is a restrained state change, not a celebration.
- **Sidebar** — active background and icon/text colour transition together.
  Navigation is never gated on animation. The shell does not remount or jump.
- **Menus / popovers** — 4–8px directional movement from the trigger, opacity
  and scale ~0.98 → 1, quick exit.
- **Disclosure** — content expands via `grid-template-rows`; chevron rotates
  with state.
- **Tables** — row hover is extremely subtle. Insertion enters from context,
  not a generic fade. Deletion collapses after the exit.
- **Empty → populated** — preserve the section shell. Transition the body from
  the teaching empty state to the table; never hard-cut the whole surface.
- **Forms** — focus snaps. Validation appears adjacent to its cause. Fields
  never shake.
- **Toasts** — enter from the nearest edge, exit faster, stack repositions
  smoothly.
- **Modals** — scale + opacity. **Drawers** — translate from their own edge.
  The backdrop fades independently of the panel.

## Agent surfaces

Motion for agent transaction states carries meaning through state, typography,
and icon — never a looping "thinking" effect.

| State | Treatment |
|-------|-----------|
| requested | append, `--duration-fast`, quiet |
| evaluating policy | quiet; no spinner loop unless genuinely pending |
| awaiting approval | held state, visually distinct, no motion until resolved |
| approved | `--duration-deliberate` — a human decided, it should feel weighty |
| executing | quiet |
| completed | restrained confirmation |
| denied / failed | state change only, no shake |

**Human approval must feel materially different from autonomous execution.**
Approval is deliberate and high-confidence; autonomous updates are quieter and
faster. A timeline appends new events with a subtle directional transition that
preserves chronological continuity.

Do not build fake agent functionality to demonstrate motion.

## Prohibited

Excessive spring or bounce · floating cards · parallax · gratuitous page fades ·
cursor-follow · constant ambient animation · staggered text reveals · animation
longer than the task itself · "AI sparkle".

## Reduced motion

Handled globally in `globals.css`. Do not add per-component media queries.

Press feedback survives reduced motion deliberately — it is a transform in
place, not travel, and it is the confirmation that a control received the
press. Disclosure transitions are disabled so content lands open rather than
mid-collapse.

**JS-driven inline styles are not covered by the global CSS rule.** Anything
animating via `element.style` must check
`matchMedia("(prefers-reduced-motion: reduce)")` itself. This has already been
a real defect in this repo (`landing.tsx` scroll animation).

## Performance

Prefer `transform` and `opacity`. Never animate `width`/`height`/`top`/`left`
where a transform works — the disclosure class exists precisely so height
changes avoid layout.

Scroll-linked animation must coalesce reads and writes into one
`requestAnimationFrame` per frame. Reading layout after writing styles forces a
synchronous reflow on every event; this has already caused jank here.
