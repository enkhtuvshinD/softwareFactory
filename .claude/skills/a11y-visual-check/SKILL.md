---
name: a11y-visual-check
description: Checklist for judging rendered screenshots and UI code for usability and accessibility - task clarity, hierarchy, legibility, clipping, mobile layout at 360/390px, states, focus and contrast. Use in the polish and final visual review stages when inspecting visual-evidence PNGs.
---

# Visual and accessibility check

Judge the actual PNGs, not the CSS. Report only material defects: problems that block or confuse the principal task.

## Every image (desktop 1440×900, mobile 390×844)

1. **Task clarity:** the principal task is obvious at a glance. One primary action stands out (filled, brand color); secondary actions are quieter.
2. **Hierarchy:** one page title; headings step down in size; related items grouped by spacing.
3. **Legibility:** body text at least 16px on mobile; desktop lines no wider than about 75 characters; no pale gray body text on white.
4. **Clipping and overlap:** no cut-off text, overlapping badges or buttons, awkward two-line buttons, or stretched images (use `object-fit: cover`).
5. **Mobile:** no horizontal scroll; navigation collapses or wraps cleanly; tap targets about 44px tall; forms in one column; wide tables become cards or scroll inside their own container.
6. **States:** empty, loading and error states are visible and phrased for users; success feedback appears near the action.
7. **Data:** real seed values, consistent currency and date formats; no `undefined`, `NaN`, `[object Object]`, raw ISO timestamps or placeholder text.
8. **Images:** loaded or a deliberate fallback; consistent aspect ratio inside grids.

## Code checks (polish stage only, in `src/`)

- Every input has an associated `<label>`; icon-only buttons have `aria-label`.
- The `:focus-visible` outline uses a token and is never removed.
- Status is never shown by color alone; badges carry text.
- Fix contrast by adjusting token values, not with one-off colors.

## Common CSS fixes

- Overflow: `min-width: 0` on flex and grid children, `flex-wrap: wrap`, `overflow-wrap: anywhere` for long strings, `max-width: 100%` on media.
- Responsive grid: `grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr))`.
- Spacing and sizes come only from tokens.
