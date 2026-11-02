# Agentic AI Factory

One command turns a product brief into a specified, designed, built and verified responsive web app — autonomously, within a fixed dollar budget. The factory derives the domain, roles, entities, business rules, main user journey, acceptance checks and visual targets from the current brief. It supports anonymous tools, static sites, dashboards and applications with multiple roles on the included React/Express stack.

```
input/brief.md ─┐
optional seed ──┴─► Requirements ─► Independent review ─► Design
                                                        │
                                              Builder + blind QA
                                                        │
                                                Verify / fix loop
                                                        │
                                              Rendered UI polish
                                                        │
                                              Final verify / fix
                                                        │
                                            Read-only image review
                                                        │
                                             Evidence + REPORT.md
```

| Stage | Agent | Produces | Gate |
|---|---|---|---|
| 1 | Requirements Writer | `requirements.md`, `product.json` (roles, entities, journey), `acceptance.json` (provided or derived checks), resolved `seed.json` | valid domain plan, acceptance provenance and seed |
| 1b | Independent Reviewer | Corrected requirements and `requirements/review.json` | original brief covered; domain and journey consistent; no open findings |
| 2 | UI Designer | Tokens, `design/ui-spec.md` with binding routes/testids/labels, `design/visual-plan.json` with 1–3 representative screens/states | valid tokens, contract and visual plan |
| 3a | Full-stack Builder | `app/` — React + Express + TypeScript with domain logic/tests appropriate to the brief | — |
| 3b | QA Test Writer | Acceptance cases, actual primary journey, domain-specific edge cases, route smoke and planned screenshot captures; written **from the spec only**, in parallel with 3a | every acceptance case plus required supplemental files |
| 4 | Verify → Fix loop | type-check + build, actual Vitest tests, Playwright; debugger gets failing logs (max 3 rounds per phase) | every required test executed and passed; no skips or expected failures |
| 5 | UI Polish | Inspect planned rendered images; bounded client/style changes; `quality/polish.md` | full verification runs again after changes |
| 6 | Final Visual Reviewer | Read final desktop/mobile images; `quality/visual-review.json`, optional `quality/demo.md` | every planned PNG reviewed; no material defects; runner stamps SHA256 evidence |
| 7 | Report | `out/REPORT.md` — provided/derived acceptance and supplemental results, reviews, evidence, confirmed/reserved costs and time | incomplete checks remain explicit |

## Design choices

- **Contract-first.** Builder and QA work independently from reviewed API/UI contracts. A separate reviewer checks those requirements against the original brief before implementation. Passing tests establish the behavior they exercise; the report separates official, journey, edge, smoke and visual checks.
- **Brief-driven domain.** No car, commerce, approval, money, date or authentication flow is mandatory. The requirements agent models what the current brief requests. For supplied acceptance cases it preserves the original values/IDs; when cases are absent it derives clearly labeled checks from the requested behavior. `TR-*` IDs are not required.
- **Optional seed.** A nonempty `input/brief.md` is sufficient. If `input/seed.json` is absent, the run snapshots `{}` and the requirements agent produces relevant demo data in `requirements/seed.json`. Relevant supplied records are preserved. An unrelated sample seed is documented and replaced in the resolved application seed, while the original input remains intact.
- **Deterministic gates between stages.** Agents decide, scripts verify. Failed gates retry once or feed the fix loop.
- **Shared budget reservations.** Agents reserve their CLI budget atomically before launch, including concurrent builder/QA runs. Actual provider costs release unused allocations; missing cost results retain their full reservation. Resume keeps the original budget ledger.
- **One run, one deadline.** Commands and their child process groups are bounded by the original 60-minute deadline. Resume preserves that deadline and declared run date; it does not restart the clock. Interrupt cleanup terminates active command groups before releasing the run lock.
- **Rendered evidence.** The designer selects 1–3 meaningful screens or states for this product. Each is captured at 1440×900 and 390×844, producing 2–6 PNGs. A one-screen calculator needs no artificial checkout or dashboard. A separate agent inspects final images after regression; plan, review and image hashes detect later changes.
- **Relevant unit tests.** Products with meaningful pure logic require unit tests. Static presentation may declare `unit_tests_required: false` with a reviewed `unit_test_reason`; the report then marks unit verification not applicable. Existing unit tests always execute, even with that flag. UI acceptance and the primary read/interaction journey still run.
- **Scoped tools.** Document agents get file tools; app agents may additionally run build, Vitest, Playwright and tsc. Stage prompts restrict writable paths. No package installs or arbitrary shell commands are allowed; remote seed image URLs can still be loaded by the browser.
- **Isolated runs.** `--setting-sources project` keeps personal Claude settings, hooks and memory out of the factory.
- **Fast start.** The app skeleton (boilerplate only, no domain code) has dependencies preinstalled and is cloned per run in under a second.

## Setup (once)

```bash
cp .env.example .env           # put the team's ANTHROPIC_API_KEY in .env (gitignored)
./factory/setup.sh
```

`run.sh` and `setup.sh` load `.env` automatically; any configuration variable below can be set there too. Without a key, the logged-in Claude account is billed.

Requires `claude` (Claude Code CLI), `node` ≥ 22, `jq`, `rsync`.

## Run

```bash
# put your product prompt in input/brief.md; seed.json is optional:
./factory/run.sh
```

Live progress streams to the terminal. Every run gets its own project folder: it starts as `out/run-<timestamp>/` and is renamed after the requirements stage to the product name, e.g. `out/wheels2go/` (`out/wheels2go-2/` when that name is taken). Earlier projects are never replaced. `out/latest` points to the most recent project.

Examples with different domains are included. These commands run real model stages and use the configured budget:

```bash
INPUT=examples/calculator ./factory/run.sh
INPUT=examples/crm ./factory/run.sh
INPUT=examples/restaurant ./factory/run.sh
INPUT=examples/portfolio ./factory/run.sh
```

Calculator, CRM and portfolio examples provide only a brief. The restaurant example supplies menu data and acceptance IDs such as `ORDER-01` and `TOTAL1`. The existing `input/` remains the Wheels2Go challenge example; it is input data, not a built-in product assumption.

The output platform remains the included web-app stack and installed dependencies. Requirements for external services, credentials or capabilities beyond that environment must be recorded honestly; changing the brief does not supply those services automatically.

Resume within the original deadline: `./factory/run.sh --from 2` (1 fresh run; 2 requirements review + design; 3 build + tests; 4 verify/fix). Resume continues `out/latest`; pick another project with `PROJECT=wheels2go ./factory/run.sh --from 3`. Stages 3 and 4 require an approved requirements review. Every resume performs polish, final regression and final image review. Start a fresh run for artifacts from the older pipeline or after the deadline expires.

Try the generated app: `cd out/latest/app && npm start` → http://localhost:3000

## Configuration (environment variables)

| Variable | Default | |
|---|---|---|
| `PROJECT` | `latest` | Project folder in `out/` that `--from` resumes |
| `OUT` | auto-named | Fixed output folder instead of `out/<product>/` (an existing one is moved to `.runs/`) |
| `TOTAL_BUDGET` | `14` | USD cap for the whole run |
| `MAX_WALL_SECONDS` | `3600` | Original run deadline, preserved on resume |
| `RUN_DATE` | current UTC date | Declared demo-data date, preserved on resume |
| `MAX_FIX_ROUNDS` | `3` | Debugger iterations |
| `EFFORT` | `medium` | Reasoning effort for every agent |
| `REQ_MODEL` / `REQ_BUDGET` | `sonnet` / `1` | Requirements Writer |
| `REVIEW_MODEL` / `REVIEW_BUDGET` | `sonnet` / `0.75` | Independent Requirements Reviewer |
| `DESIGN_MODEL` / `DESIGN_BUDGET` | `sonnet` / `1` | UI Designer |
| `BUILD_MODEL` / `BUILD_BUDGET` | `sonnet` / `5.5` | Builder |
| `TESTS_MODEL` / `TESTS_BUDGET` | `sonnet` / `1.5` | QA Test Writer |
| `FIX_MODEL` / `FIX_BUDGET` | `sonnet` / `1.5` | Debugger (per round) |
| `POLISH_MODEL` / `POLISH_BUDGET` | `sonnet` / `1` | Bounded rendered UI polish |
| `VISUAL_MODEL` / `VISUAL_BUDGET` | `sonnet` / `0.75` | Final read-only image review |

The normal stage allocations total $11.50, leaving $2.50 of the default $14 for fixes/retries when all stages use their full allocation. Lower actual costs release more headroom. Stage allocations are ceilings, not a requirement to spend the budget. Fixes and retries share the same total; no review is silently skipped when funds run out.

## Check the factory without model charges

```bash
node --test factory/lib/*.test.mjs factory/run.test.mjs
bash -n factory/run.sh
```

Tests use temporary directories and mocked provider/build commands. They check different product domains, brief-only input, arbitrary provided case IDs, derived cases, anonymous/single-screen products, resolved seed handling, dynamic evidence, budget concurrency, interrupted costs, deadlines/process cleanup and full stage orchestration. They do not regenerate or alter the existing `out/` application. These checks establish factory behavior; a real model run is still needed to assess a generated product's quality.

## Layout

```
factory/
  run.sh            orchestrator: stages, gates, budget, verify/fix loop
  setup.sh          one-time dependency install
  prompts/          one prompt per agent + shared system prompt
  lib/stream.mjs    live progress + per-stage cost capture
  lib/report.mjs    REPORT.md generator
  lib/control.mjs   atomic budget reservations
  lib/limit.mjs     command deadline and process-group cleanup
  lib/gates.mjs     requirements, test results and final evidence checks
  template/         app skeleton (Vite + React, Express, Vitest, Playwright)
input/              current example brief + optional seed data
examples/           brief-only calculator, CRM, portfolio; restaurant with seed
out/<product>/      one folder per run: requirements/, design/, app/, quality/, logs/, REPORT.md
out/latest          symlink to the most recent project
```
