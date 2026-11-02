# Factory Run Report — QueueFlow

Started 2026-11-01T14:26:28Z · Wall time **19m 51s** · Recorded cost **$3.75** of $14.00 budget · Deadline 2026-11-01T15:26:28.000Z

Run outcome: **pass**.

Budget accounting: **$3.75** charged/reserved ($3.75 confirmed spend + $0.00 unreconciled reservations). Missing provider costs are never counted as zero.

Product roles: visitor, customer, staff, admin. Acceptance mode: provided.

Primary journey: A customer gets a queue ticket, is called by staff, is served, and the result shows in admin analytics.

## Acceptance checks (6/6 passing)

A case passes only when all its recorded project executions actually pass. Skipped, flaky, expected-failure, and unexecuted tests do not count.


## Brief-provided acceptance cases (6/6 passing)

| ID | Test case | Result | Source reference | Detail |
|---|---|---|---|---|
| TR-1 | Queue Ticket Generation | ✅ pass | TR-1: Queue Ticket Generation |  |
| TR-2 | FIFO Queue Processing | ✅ pass | TR-2: FIFO Queue Processing |  |
| TR-3 | Real-Time Status Synchronization | ✅ pass | TR-3: Real-Time Status Synchronization |  |
| TR-4 | Queue Position and Waiting Time | ✅ pass | TR-4: Queue Position and Waiting Time |  |
| TR-5 | Appointment Conflict Prevention | ✅ pass | TR-5: Appointment Conflict Prevention |  |
| TR-6 | Admin Analytics | ✅ pass | TR-6: Admin Analytics |  |

## Derived acceptance cases (none recorded)

No derived acceptance cases were recorded.



## Additional behavior and capture checks

| Group | Passing/recorded | Result |
|---|---|---|
| Journey | 1/1 | ✅ pass |
| Edge cases | 3/3 | ✅ pass |
| Route smoke | 13/13 | ✅ pass |
| Visual capture | 6/6 | ✅ pass |

## Quality gates (verification round final-0)

| Type-check + build | Unit tests | E2E tests | Requirements review | Visual review |
|---|---|---|---|---|
| ✅ pass | ✅ pass | ✅ pass | ✅ pass | ✅ pass |

Requirements review: [record](requirements/review.json).

| Contract check | Result |
|---|---|
| acceptance_preserved | ✅ pass |
| capability_coverage | ✅ pass |
| domain_consistent | ✅ pass |
| journey_complete | ✅ pass |
| scope_consistent | ✅ pass |

## Rendered evidence

Visual plan: [record](design/visual-plan.json). Visual review: [record](quality/visual-review.json). Screenshots captured: 6/6; reviewed without open findings and matching final evidence: 6/6.

| Screenshot | PNG present | Recorded review | Matches final stamp |
|---|---|---|---|
| [desktop-primary.png](app/visual-evidence/desktop-primary.png) | ✅ pass | ✅ pass | ✅ pass |
| [desktop-staff-desk.png](app/visual-evidence/desktop-staff-desk.png) | ✅ pass | ✅ pass | ✅ pass |
| [desktop-admin-dashboard.png](app/visual-evidence/desktop-admin-dashboard.png) | ✅ pass | ✅ pass | ✅ pass |
| [mobile-primary.png](app/visual-evidence/mobile-primary.png) | ✅ pass | ✅ pass | ✅ pass |
| [mobile-staff-desk.png](app/visual-evidence/mobile-staff-desk.png) | ✅ pass | ✅ pass | ✅ pass |
| [mobile-admin-dashboard.png](app/visual-evidence/mobile-admin-dashboard.png) | ✅ pass | ✅ pass | ✅ pass |

Visual fixes: Mobile staff desk: next-customer ticket number CEN-GC-003 now stays on one line.; Customer ticket card: Position and Est. wait are now larger and bold..

## Remaining limitations

- Judged from images only. Contrast ratios and keyboard behavior were not measured.
- Mobile navigation wraps into a multi-row header. It is readable with no overflow.
- Mobile admin dashboard: the last stat tile (Avg service duration) sits alone in a half-width row. This is cosmetic only.
- Call Next and the other disabled staff buttons look faded. This is intentional, and the helper text explains it.
- The 5vw clamp on very narrow viewports (below 360px) was not checked, because only the 390px mobile evidence was available.

## Agent stages

| Stage | Model | Turns | Time | Confirmed cost | Budget charge/reservation | Outcome |
|---|---|---|---|---|---|---|
| requirements | claude-sonnet-5-5 | 8 | 3m 23s | $0.46 | $0.46 | success |
| review | claude-sonnet-5-5 | 9 | 0m 23s | $0.12 | $0.12 | success |
| design | claude-sonnet-5-5 | 11 | 2m 04s | $0.32 | $0.32 | success |
| build | claude-sonnet-5-5 | 128 | 10m 36s | $1.97 | $1.97 | success |
| tests | claude-sonnet-5-5 | 27 | 2m 55s | $0.54 | $0.54 | success |
| fix | claude-sonnet-5-5 | 16 | 0m 53s | $0.15 | $0.15 | success |
| polish | claude-sonnet-5-5 | 19 | 0m 32s | $0.11 | $0.11 | success |
| visual | claude-sonnet-5-5 | 10 | 0m 15s | $0.07 | $0.07 | success |
| **Total** | | 228 | | **$3.75** | **$3.75** | |

## Artifacts

- Requirements: [requirements/requirements.md](requirements/requirements.md), [requirements/product.json](requirements/product.json), [requirements/acceptance.json](requirements/acceptance.json)
- Design: [design/ui-spec.md](design/ui-spec.md), [design/visual-plan.json](design/visual-plan.json), [design/tokens.json](design/tokens.json), [design/tokens.css](design/tokens.css)
- Application: [app/](app/) — run with `cd app && npm start` from this folder, then open http://localhost:3000
- Tests: [app/e2e/](app/e2e/), unit tests in `app/shared/*.test.ts`, [HTML report](app/playwright-report/index.html)
- Agent transcripts: [logs/](logs/)
