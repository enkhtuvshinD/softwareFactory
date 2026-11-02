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
- **Dates:** calendar dates versus instants, timezone and inclusive/exclusive boundaries. Use the same boundaries for calculation, grouping and conflicts.
- **Workflow:** allowed transition, actor, preconditions and side effects. Describe how the transition affects counts, metrics or availability when those concepts exist.
- **Identity and permissions:** relationships reference real records, and applicable actor/ownership checks happen at the server boundary. A demo persona does not provide production authentication.
- **Persistence:** identify the authoritative stored state and any values intentionally snapshotted at creation. Editing source data must not silently rewrite historical snapshots when the product requires them.

Cross-check examples with the resolved seed and primary journey. If a brief leaves a rule open, choose the smallest consistent assumption and record it; do not invent a new feature or state. Put unresolved contradictions in the review findings instead of approving incompatible rules.

## Implementation

Keep applicable pure rules in shared modules; call them from client/server where appropriate. Enforce trusted calculations and transition permissions on the server for actual persisted mutations. Define ordinary repeated-submission behavior where the journey needs it without adding a new concurrency framework.

Test the supplied example plus a meaningful boundary or rejected case. Expected results come from the reviewed rule, not from calling the same implementation to compute its own expected value. Existing unit-test applicability decisions remain binding; no dummy rules or tests for a static page.

After review, the builder reports a contract contradiction rather than silently changing requirements or weakening tests. Use only the stage's existing artifacts, tools and writable paths.
