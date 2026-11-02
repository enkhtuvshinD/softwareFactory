# Stage 3b — Independent QA Writer

Write Playwright tests from reviewed specs while another agent builds. Work in the app; read no `src/`, `server/`, `shared/` or builder transcript. Edit only `e2e/`.

Read `SKELETON.md`, `playwright.config.ts`, `../input/brief.md`, `../requirements/requirements.md`, `../requirements/product.json`, `../requirements/seed.json`, `../requirements/acceptance.json`, `../requirements/review.json`, `../design/ui-spec.md`, and `../design/visual-plan.json`. Apply the included `e2e-contract` skill to the specs.

## Common rules

- Reset through the specified API before each test and assert success. Use one project/worker and serial tests against the shared store; never alter Playwright configuration.
- Use contract testids, roles and labels. Scope repeated items by stable ID or unique test-created data. No fixed seed counts/order, fixed sleeps, prior-domain assumptions, mocked core outcomes, skips or weakened assertions.
- Read the original brief independently. Preserve exact supplied cases and values; distinguish provided from derived acceptance.
- Select actual valid runtime values respecting relevant constraints/existing data. Setup may use contract APIs when setup itself is not tested.
- For mutations, use the UI, wait for the response, assert its status and resulting state. Refresh separately to prove requested persistence. For read-only products exercise the actual reading/navigation/interaction task without inventing writes or roles.

## Required files

### `e2e/case-<id>.spec.ts`

For EACH acceptance item write exactly one file preserving its case-sensitive ID, with one `test('<id>: <title>', ...)`. No prefix is mandatory. Assert every expected outcome from the actual UI. A supplied `TR-1` becomes `case-TR-1.spec.ts`; derived `AC-001` becomes `case-AC-001.spec.ts`. Do not invent organizer cases.

### `e2e/journey.spec.ts`

Write a `JOURNEY:` test for the complete `product.json.primary_journey`: enter the product, perform its real principal task and verify the outcome, following applicable role handoffs and the same record/operation identity. If state mutates, create real state and verify required persistence after refresh; do not substitute an existing seed record. Otherwise verify actual reading/navigation/interactive results without forcing a write workflow.

### `e2e/edge-cases.spec.ts`

Write 1–3 high-value `EDGE:` checks from actual requirements/risks: applicable invalid inputs, boundaries, empty results, permission/state conflicts or recovery. Use only categories this product has. Static content may verify a meaningful navigation/content/accessibility boundary; do not invent forms, filters, dates, transactions or role changes.

### `e2e/smoke.spec.ts`

Exercise every real route with appropriate access state/valid IDs. Assert meaningful main content and no uncaught `pageerror`; a redirect or empty shell alone is insufficient.

### `e2e/visual.spec.ts`

For EACH `design/visual-plan.json` target, write a desktop and mobile serial `VISUAL:` capture test. Keep the existing Chromium project; set viewport 1440×900 or 390×844 inside the test.

Follow the target route, role, prepare steps and meaningful ready condition. Assert horizontal overflow is absent (`scrollWidth <= innerWidth + 1`), applicable controls have accessible labels/focus, and principal actions are enabled when the state calls for one. Check loaded visible images only if present, including deliberate fallbacks/lazy loading; restore intended scroll position. Static content without images/controls is valid.

Create `visual-evidence/` with `node:fs/promises` if needed. Capture full-page PNGs at `visual-evidence/desktop-<id>.png` and `visual-evidence/mobile-<id>.png` for every planned target. Immediately before capture, scroll to the top and run `(document.activeElement as HTMLElement | null)?.blur()` so focus checks leave no focus ring or caret in the evidence. Use `page.screenshot({ path, fullPage: true, animations: 'disabled' })` and `testInfo.attach`. These support actual image review, not baseline approval; do not add unplanned targets.

You cannot run tests while the builder works. Finish with written files and concrete contract gaps; do not claim they passed.
