# Factory Run Report — Wheels2Go

Started 2026-11-02T01:17:38Z · Wall time **3m 46s** · Recorded cost **$0.59** of $4.00 budget · Deadline 2026-11-02T02:17:38.000Z

Run outcome: **fail**.

Budget accounting: **$0.59** charged/reserved ($0.59 confirmed spend + $0.00 unreconciled reservations). Missing provider costs are never counted as zero.

Product roles: owner, renter. Acceptance mode: provided.

Primary journey: Renter books a car and the owner approves the request.

## Acceptance checks (0/4 passing)

A case passes only when all its recorded project executions actually pass. Skipped, flaky, expected-failure, and unexecuted tests do not count.


## Brief-provided acceptance cases (0/4 passing)

| ID | Test case | Result | Source reference | Detail |
|---|---|---|---|---|
| TR-1 | TR-1: Car Listing Creation | ⚠️ missing | TR-1: Car Listing Creation \| Owners can list a new vehicle with all required specs and pickup location. \| Create a listing: "Tesla Model Y 2023", $85/day, Location: "Airport Hub". \| Listing appears instantly in the catalog feed with correct details and location badge. | Every project must execute and pass; skipped/flaky checks do not count. |
| TR-2 | TR-2: Search & Filter Validation | ⚠️ missing | TR-2: Search & Filter Validation \| Renters can filter inventory by make and maximum daily rate. \| Filter catalog by Make = "Tesla" or set Max Daily Rate = $90. \| Non-matching cars disappear from the active feed in real time. | Every project must execute and pass; skipped/flaky checks do not count. |
| TR-3 | TR-3: Dynamic Pricing Math | ⚠️ missing | TR-3: Dynamic Pricing Math \| Checkout flow calculates total cost accurately based on duration and fees. \| Select a 3-day rental for an $85/day car with a $25 cleaning fee. \| Checkout summary displays exactly $280.00 ($255 rental + $25 fee). | Every project must execute and pass; skipped/flaky checks do not count. |
| TR-4 | TR-4: Owner Booking Approval | ⚠️ missing | TR-4: Owner Booking Approval \| Owners can manage rental request states from their portal. \| Log into Owner view, locate a pending booking request, and click "Approve". \| Booking status updates to Confirmed across both owner and renter portals. | Every project must execute and pass; skipped/flaky checks do not count. |

## Derived acceptance cases (none recorded)

No derived acceptance cases were recorded.



## Additional behavior and capture checks

| Group | Passing/recorded | Result |
|---|---|---|
| Journey | 0/0 | ⚠️ missing |
| Edge cases | 0/0 | ⚠️ missing |
| Route smoke | 0/0 | ⚠️ missing |
| Visual capture | 0/0 | ⚠️ missing |

## Quality gates (verification round not run)

| Type-check + build | Unit tests | E2E tests | Requirements review | Visual review |
|---|---|---|---|---|
| — not run | — not run | — not run | ⚠️ missing | ⚠️ missing |

Requirements review: not produced.

| Contract check | Result |
|---|---|
| acceptance_preserved | ⚠️ missing |
| capability_coverage | ⚠️ missing |
| domain_consistent | ⚠️ missing |
| journey_complete | ⚠️ missing |
| scope_consistent | ⚠️ missing |

## Rendered evidence

Visual plan: not available. Visual review: not produced. Screenshots captured: 0/not available; reviewed without open findings and matching final evidence: 0/not available.

| Screenshot | PNG present | Recorded review | Matches final stamp |
|---|---|---|---|
| No valid targets recorded | ⚠️ missing | ⚠️ missing | ⚠️ missing |

## Remaining limitations

- Requirements review has not passed.
- Visual review is missing, incomplete, unresolved, or no longer matches the captured evidence.
- Visual evidence plan is unavailable: ENOENT: no such file or directory, open '/Users/test/Documents/hackatonZT/out/run-20261102-091738/design/visual-plan.json'
- No readable Playwright result was produced.

## Agent stages

| Stage | Model | Turns | Time | Confirmed cost | Budget charge/reservation | Outcome |
|---|---|---|---|---|---|---|
| requirements | claude-sonnet-5-5 | 11 | 1m 49s | $0.31 | $0.31 | success |
| requirements-2 | claude-sonnet-5-5 | 10 | 1m 54s | $0.28 | $0.28 | success |
| **Total** | | 21 | | **$0.59** | **$0.59** | |

## Artifacts

- Requirements: [requirements/requirements.md](requirements/requirements.md), [requirements/product.json](requirements/product.json), [requirements/acceptance.json](requirements/acceptance.json)
- Design: [design/ui-spec.md](design/ui-spec.md), [design/visual-plan.json](design/visual-plan.json), [design/tokens.json](design/tokens.json), [design/tokens.css](design/tokens.css)
- Application: [app/](app/) — run with `cd app && npm ci && npm run build && npm start` from this folder, then open http://localhost:3000
- Tests: [app/e2e/](app/e2e/), unit tests in `app/shared/*.test.ts`, [HTML report](app/playwright-report/index.html)
- Agent transcripts: [logs/](logs/)
