# App skeleton

Stack: React 19 + react-router-dom 6 + Vite 8 (client), Express 4 run by tsx (server), TypeScript strict, Vitest, Playwright.
All dependencies are installed. Do not add packages.

## Layout

| Path | Purpose |
|---|---|
| `src/` | Client. Entry `main.tsx` already imports `styles/tokens.css` (design tokens). |
| `server/index.ts` | Boots Express: `GET /api/health`, `POST /api/reset`, `registerRoutes(app)`, unknown `/api/*` → 404 JSON, static `dist/` + SPA fallback. Rarely needs edits. |
| `server/routes.ts` | Put every API endpoint here inside `registerRoutes(app)`. |
| `server/db.ts` | JSON-file store: `readDb<T>()` returns the whole dataset (mutate it, then `writeDb(db)`), `resetDb()` restores the seed. |
| `server/data/seed.json` | Resolved domain seed copied from `../requirements/seed.json`. The original optional input stays unchanged. `server/data/db.json` is the live copy. |
| `shared/` | Domain types and pure business/validation logic with meaningful `*.test.ts` tests when the brief needs them. No fixed entity names or pricing module is required. |
| `e2e/` | Playwright specs. |
| `visual-evidence/` | Desktop/mobile PNGs for each target in `../design/visual-plan.json`, outside `test-results/`. |

Imports between files are extensionless (`import { x } from './db'`).

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
