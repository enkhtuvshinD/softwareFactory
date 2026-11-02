---
name: a11y-visual-check
description: Checklist for judging rendered screenshots and UI code for usability and accessibility - task clarity, hierarchy, legibility, clipping, mobile layout at 360/390px, states, focus and contrast. Use in the polish and final visual review stages when inspecting visual-evidence PNGs.
---

# Visual and accessibility check

Judge actual PNGs and distinguish visible evidence from behavior that requires code or browser checks. Report material defects separately from informational observations. Use the brief, UI contract and current visual plan; an anonymous or read-only product may have no primary action.

## Every image (desktop 1440×900, mobile 390×844)

1. **Task clarity:** principal content or the main task is obvious. When actions exist, the primary action has a clear hierarchy and secondary actions are quieter; a filled brand button is one option.
2. **Hierarchy:** one page title; headings step down in size; related items grouped by spacing.
3. **Legibility:** body text at least 16px on mobile; desktop lines no wider than about 75 characters; no pale gray body text on white.
4. **Clipping and overlap:** no cut-off text, overlapping badges or buttons, awkward two-line buttons, or stretched images (use `object-fit: cover`).
5. **Mobile:** no horizontal scroll; navigation collapses or wraps cleanly; tap targets about 44px tall; forms in one column; wide tables become cards or scroll inside their own container.
6. **States:** applicable empty, loading and error states guide the user; success feedback appears near the action. Do not demand states or controls the product does not need.
7. **Data:** resolved seed values and applicable currency/date formats are consistent; no accidental `undefined`, `NaN`, `[object Object]` or unfinished scaffold text. Preserve an explicit brief format rather than imposing a different display convention.
8. **Images:** loaded or a designed fallback (tinted surface with initials or a glyph, not a bare text box); consistent aspect ratio inside grids.

## Code checks (polish stage only, in `src/`)

- Every input has an associated `<label>`; icon-only buttons have `aria-label`.
- Actions use buttons; navigation uses links. Headings follow a meaningful hierarchy, images have appropriate alt text, and decorative icons are hidden from assistive technology.
- The `:focus-visible` outline uses a token and is never removed.
- Sticky UI does not cover focused controls or the main task. Focus is visible after opening/closing a dialog when the product has one.
- Status is never shown by color alone; badges carry text.
- Fix contrast by adjusting token values, not with one-off colors.
- Form controls use appropriate input types and useful autocomplete/input modes. Show errors beside their fields; dynamic feedback has an appropriate live region. Preserve exact UI-contract text.
- Long and empty content cannot break the layout. Media has deliberate dimensions/aspect ratios to avoid layout shifts; lazy loading is used only where appropriate.
- Honor `prefers-reduced-motion`; avoid `transition: all`. Add no animation dependency for this check.

## Evidence and scope

Code/browser checks belong to the polish or QA stage where those tools/paths are allowed. The final visual reviewer remains read-only and judges only the planned PNGs; it cannot certify keyboard behavior, accessible names or numeric contrast from screenshots. Report a measured contrast result only when it was actually calculated.

Review against applicable principles adapted from [Vercel Web Interface Guidelines](https://github.com/vercel-labs/web-interface-guidelines/blob/main/command.md). This local checklist works offline: no WebFetch, package installation, new test runner or extra screenshots are required. Product requirements and binding contracts take precedence over optional stylistic conventions.

## Common CSS fixes

- Overflow: `min-width: 0` on flex and grid children, `flex-wrap: wrap`, `overflow-wrap: anywhere` for long strings, `max-width: 100%` on media.
- Responsive grid: `grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr))`.
- Spacing and sizes come only from tokens.
