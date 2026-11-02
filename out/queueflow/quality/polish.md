# Visual polish pass

## Images inspected
All six: desktop-/mobile- primary, staff-desk, admin-dashboard (in `app/visual-evidence/`).

## Findings
1. Mobile staff desk: the "Next customer" stat wrapped the ticket number ("CEN-" / "GC-003"), which hurt scanning.
2. Customer ticket card: Position and Est. wait, the key information, had the same weight as the secondary service/branch line.
3. Layout, nav, status badges, charts (with text labels and data tables) and action buttons otherwise read clearly. No overflow was seen in any image.

## Fixes
- `src/styles/components.css`: `.stat-value` now uses a fluid font size (`clamp`) and `nowrap`, so ticket numbers stay on one line.
- `src/styles/pages.css`: `.ticket-metric` is now larger and bold (`--font-size-lg`, bold) so position and wait stand out.
- Tokens were not changed.

## Checks run
- `npm run build` (tsc + vite): passed.
- Not run: unit tests and Playwright, because only the build was run in this pass.

## Limitations
- The refreshed images were not read: no new evidence was generated in this pass, so the changes are not visually verified.
- The 5vw clamp is untested on very narrow viewports (below 360px).
- No final visual approval is claimed.
