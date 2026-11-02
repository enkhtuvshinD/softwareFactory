---
name: domain-invariants
description: Turn a product brief's applicable business rules into consistent examples and invariants. Use during requirements review and implementation of calculations, permissions, workflows or persistent state.
---

# Domain invariants

Use the current brief and reviewed domain model. Do not import a previous product's roles, status names, currency or transaction flow. Static presentation may have no business invariants.

## Requirements review

For the few rules most likely to break the principal journey, record in the existing requirements document:

| Rule | When it applies | Boundary/example | Observable result |
|---|---|---|---|

Use only relevant categories:
- **Calculation:** input units, formula, precision and rounding point. Preserve supplied worked examples exactly; distinguish displayed rounding from stored values.
- **Dates:** calendar dates versus instants, timezone and inclusive/exclusive boundaries. Use the same boundaries for calculation, grouping and conflicts. People enter local wall-clock dates and times, so "today" and "now" come from the local clock of the machine running the demo, never UTC. When a start time is entered, reject past starts at time-of-day precision, not only past dates.
- **Exclusive resources:** when one item can be held by only one party at a time (a vehicle, room, table, seat, staff slot), overlapping holds are a core integrity rule even if the brief never names it. Define the overlap test on half-open intervals `[start, end)` with the same boundaries as pricing, which statuses hold the resource (at least confirmed ones), and enforce it when a hold is requested and again when it is confirmed. Keep seed records and acceptance examples conflict-free so the approval the acceptance cases expect stays valid.
- **Numeric bounds:** money, quantities and filter limits are non-negative unless the brief says otherwise; validation rejects out-of-range values.
- **Workflow:** allowed transition, actor, preconditions and side effects. Describe how the transition affects counts, metrics or availability when those concepts exist.
- **Identity and permissions:** relationships reference real records, and applicable actor/ownership checks happen at the server boundary. A demo persona does not provide production authentication.
- **Persistence:** identify the authoritative stored state and any values intentionally snapshotted at creation. Editing source data must not silently rewrite historical snapshots when the product requires them.

Cross-check examples with the resolved seed and primary journey. If a brief leaves a rule open, choose the smallest consistent assumption and record it; do not invent a new feature or state. Put unresolved contradictions in the review findings instead of approving incompatible rules.

## Implementation

Keep applicable pure rules in shared modules; call them from client/server where appropriate. Enforce trusted calculations and transition permissions on the server for actual persisted mutations. Overlap and past-start checks run on the server in every mutation that creates or confirms a hold. Date and number controls carry matching `min` attributes (local today, 0) so pickers prevent invalid choices before validation runs. Define ordinary repeated-submission behavior where the journey needs it without adding a new concurrency framework.

Test the supplied example plus a meaningful boundary or rejected case. Expected results come from the reviewed rule, not from calling the same implementation to compute its own expected value. Existing unit-test applicability decisions remain binding; no dummy rules or tests for a static page.

After review, the builder reports a contract contradiction rather than silently changing requirements or weakening tests. Use only the stage's existing artifacts, tools and writable paths.
