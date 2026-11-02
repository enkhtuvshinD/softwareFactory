# App skeleton

Stack: React 19 + react-router-dom 6 + Vite 8 (client), Express 4 run by tsx (server), TypeScript strict, Vitest, Playwright.
All dependencies are installed. Do not add packages.

## Layout

| Path | Purpose |
|---|---|
| `src/main.tsx` | Client entry. Already imports `styles/tokens.css` (design tokens). |
| `src/App.tsx` | App shell only: layout, navigation and the route table. No page bodies. |
| `src/pages/<Name>Page.tsx` | One file per route. Composes components and hooks; owns the page's loading/empty/error states. |
| `src/components/<Name>.tsx` | Reusable UI, one exported component per file. Data in through props, actions out through callbacks; no fetching. |
| `src/hooks/use<Name>.ts` | Data loading and stateful UI logic shared by pages. |
| `src/api/client.ts` | The only place that calls `fetch`: one typed function per endpoint, using `shared/` types. |
| `src/styles/` | `tokens.css` (copied design tokens) plus app styles built only from those tokens. |
| `shared/types.ts` | Domain entities and API request/response types shared by client and server. |
| `shared/<topic>.ts` | Pure business/validation logic (no I/O), with `<topic>.test.ts` beside it when the brief needs unit tests. No fixed entity names or pricing module is required. |
| `server/index.ts` | Boots Express: `GET /api/health`, `POST /api/reset`, `registerRoutes(app)`, unknown `/api/*` → 404 JSON, static `dist/` + SPA fallback. Rarely needs edits. |
| `server/routes/index.ts` | `registerRoutes(app)` mounts one router per resource. |
| `server/routes/<resource>.ts` | `express.Router()` for one resource. Thin handlers: parse the request, call the service, send status and body. |
| `server/services/<resource>.ts` | Store reads/writes and invariants for one resource, reusing `shared/` logic. |
| `server/db.ts` | JSON-file store: `readDb<T>()` returns the whole dataset (mutate it, then `writeDb(db)`), `resetDb()` restores the seed. |
| `server/data/seed.json` | Resolved domain seed copied from `../requirements/seed.json`. The original optional input stays unchanged. `server/data/db.json` is the live copy. |
| `e2e/` | Playwright specs. |
| `visual-evidence/` | Desktop/mobile PNGs for each target in `../design/visual-plan.json`, outside `test-results/`. |

Create only the folders this product needs: a single-screen tool may have one page and no server resources.
Imports between files are extensionless (`import { x } from './db'`).

## Code structure

- One responsibility per file. Split a file before it passes about 200 lines; never collect every page, component or endpoint in one catch-all file.
- Name files and symbols after the product's domain (`BookingCard.tsx`, `routes/bookings.ts`, `shared/pricing.ts`), not `utils`, `helpers` or `misc`.
- Keep each rule in one place: calculations and validation in `shared/`, store access in `server/services/`. Components and route handlers call them instead of re-implementing them.
- Strict types end to end: no `any`, `@ts-ignore` or non-null assertions to silence errors.
- Small functions with intention-revealing names and early returns; named constants instead of repeated literals for statuses and limits.
- No dead or commented-out code, unused exports or debug logging.

## Commands (run from this directory, one plain command at a time)

| Command | What it does |
|---|---|
| `npm run build` | Type-check (`tsc`) then `vite build` into `dist/` |
| `npx vitest run` | Unit tests (`{src,server,shared}/**/*.test.ts(x)`); missing tests fail |
| `npx playwright test` | Builds, starts the server on port 3100, runs `e2e/`; add `--grep "<case-id>"` to run one case |
| `npm start` | Production server on `PORT` (default 3000) serving API + `dist/` — long-running, do not run it yourself |

## Verification contract

Keep one Chromium project and one worker: every test resets the same JSON store.
Call `POST /api/reset` in `beforeEach`; do not run mutation tests in parallel.
Acceptance tests belong in `e2e/case-<id>.spec.ts` with exact IDs from
`../requirements/acceptance.json`. Cases can be supplied by the brief or derived
from requested behavior when the brief has no explicit tests. Additional tests belong in
`journey.spec.ts`, `edge-cases.spec.ts`, `smoke.spec.ts`, and `visual.spec.ts`.
Do not change official expected values or hide failures with retries or skips.

Read `../requirements/product.json` for the actual roles, entities and primary
journey; anonymous and single-screen products are supported. Never introduce
an unrelated marketplace, approval flow, money formula or persona switcher.
For static presentation with no meaningful pure logic, the reviewed product may
set `unit_tests_required: false` and explain `unit_test_reason`; the runner marks
unit verification not applicable only if no existing unit files need execution.

The desktop viewport is 1440×900. Visual tests also use 390×844 via
`page.setViewportSize`, preserving one project and sequential resets. The
designer chooses 1–3 representative screens or states in `../design/visual-plan.json`.
Capture every target in both sizes as `visual-evidence/{desktop|mobile}-{target.id}.png`.
Use `page.screenshot({ path, fullPage: true, animations: 'disabled' })`, attach
the PNG with `testInfo.attach`, and wait for actual content and loaded images
before capture. Assert no horizontal page overflow. Do not use fixed sleeps.

Screenshots support a separate visual review. After polish and final regression,
the visual reviewer reads every final planned PNG and records findings in
`../quality/visual-review.json`; the runner stamps the review and screenshot
and visual-plan hashes in `../quality/evidence.json` so stale evidence cannot pass.
