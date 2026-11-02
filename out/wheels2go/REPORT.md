# Factory Run Report — Wheels2Go

Started 2026-11-01T13:42:48Z · Wall time **8m 12s** · Recorded cost **$1.73** of $14.00 budget · Deadline 2026-11-01T14:42:48.000Z

Run outcome: **pass**.

Budget accounting: **$1.73** charged/reserved ($1.73 confirmed spend + $0.00 unreconciled reservations). Missing provider costs are never counted as zero.

Product roles: owner, renter. Acceptance mode: provided.

Primary journey: Renter books a car and the owner approves it, consistently across both dashboards.

## Acceptance checks (6/6 passing)

A case passes only when all its recorded project executions actually pass. Skipped, flaky, expected-failure, and unexecuted tests do not count.


## Brief-provided acceptance cases (6/6 passing)

| ID | Test case | Result | Source reference | Detail |
|---|---|---|---|---|
| TR-1 | Car Listing Creation | ✅ pass | TR-1: Car Listing Creation |  |
| TR-2 | Search and Filtering | ✅ pass | TR-2: Search and Filtering |  |
| TR-3 | Dynamic Pricing | ✅ pass | TR-3: Dynamic Pricing |  |
| TR-4 | Owner Booking Approval | ✅ pass | TR-4: Owner Booking Approval |  |
| TR-5 | Booking Conflict Prevention | ✅ pass | TR-5: Booking Conflict Prevention |  |
| TR-6 | Data Persistence | ✅ pass | TR-6: Data Persistence |  |

## Derived acceptance cases (none recorded)

No derived acceptance cases were recorded.



## Additional behavior and capture checks

| Group | Passing/recorded | Result |
|---|---|---|
| Journey | 1/1 | ✅ pass |
| Edge cases | 3/3 | ✅ pass |
| Route smoke | 2/2 | ✅ pass |
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
| [desktop-catalog.png](app/visual-evidence/desktop-catalog.png) | ✅ pass | ✅ pass | ✅ pass |
| [desktop-booking.png](app/visual-evidence/desktop-booking.png) | ✅ pass | ✅ pass | ✅ pass |
| [desktop-requests.png](app/visual-evidence/desktop-requests.png) | ✅ pass | ✅ pass | ✅ pass |
| [mobile-catalog.png](app/visual-evidence/mobile-catalog.png) | ✅ pass | ✅ pass | ✅ pass |
| [mobile-booking.png](app/visual-evidence/mobile-booking.png) | ✅ pass | ✅ pass | ✅ pass |
| [mobile-requests.png](app/visual-evidence/mobile-requests.png) | ✅ pass | ✅ pass | ✅ pass |

## Remaining limitations

- The BMW M3 card shows the intentional 'Image unavailable' fallback. The fallback text sits at the top edge of the image area instead of being centered. It is readable and does not overlap the Available badge, so this is cosmetic.
- The requests target shows one booking, Confirmed, so the Approve/Decline controls for a Pending request are not visible in this evidence.
- Contrast, keyboard behavior and focus order were not measured. Only the images were inspected.
- The desktop and mobile images show a focus ring on the logo or date field, which comes from the prepared state.

## Agent stages

| Stage | Model | Turns | Time | Confirmed cost | Budget charge/reservation | Outcome |
|---|---|---|---|---|---|---|
| requirements | claude-sonnet-5-5 | 7 | 1m 18s | $0.23 | $0.23 | success |
| review | claude-sonnet-5-5 | 8 | 0m 15s | $0.09 | $0.09 | success |
| design | claude-sonnet-5-5 | 11 | 1m 20s | $0.21 | $0.21 | success |
| tests | claude-sonnet-5-5 | 27 | 1m 38s | $0.33 | $0.33 | success |
| build | claude-sonnet-5-5 | 29 | 3m 45s | $0.70 | $0.70 | success |
| polish | claude-sonnet-5-5 | 17 | 0m 28s | $0.11 | $0.11 | success |
| visual | claude-sonnet-5-5 | 12 | 0m 16s | $0.07 | $0.07 | success |
| **Total** | | 111 | | **$1.73** | **$1.73** | |

## Artifacts

- Requirements: [requirements/requirements.md](requirements/requirements.md), [requirements/product.json](requirements/product.json), [requirements/acceptance.json](requirements/acceptance.json)
- Design: [design/ui-spec.md](design/ui-spec.md), [design/visual-plan.json](design/visual-plan.json), [design/tokens.json](design/tokens.json), [design/tokens.css](design/tokens.css)
- Application: [app/](app/) — run with `cd out/app && npm start`, then open http://localhost:3000
- Tests: [app/e2e/](app/e2e/), unit tests in `app/shared/*.test.ts`, [HTML report](app/playwright-report/index.html)
- Agent transcripts: [logs/](logs/)
