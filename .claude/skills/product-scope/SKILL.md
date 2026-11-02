---
name: product-scope
description: Frame the current product's users, problem, explicit non-goals and deferred ideas inside the existing requirements document. Use in requirements writing and review to keep a short unattended build focused; never ask the user or wait for approval.
---

# Product scope

The output is the existing Product and scope section and Assumptions of `requirements/requirements.md`. It is not a separate spec file, a feature list or a reason to expand the domain. Work from the brief alone; nobody answers questions or approves drafts during the run.

## Product and scope

- **Users:** each actual role from the brief and what it needs to accomplish. Use `visitor` for anonymous use; add no personas the brief does not imply.
- **Problem:** one short paragraph on what is hard or missing for those users today, inferred from the brief's wording. Do not invent pain points, market data or statistics.
- **Outcome:** the user-visible result the primary journey delivers, in one sentence that matches `product.json`.
- **Not in this build:** at least three concrete exclusions a reader could reasonably assume are included, such as payments, real notifications, external integrations, admin tooling or extra roles. Nothing the brief explicitly requests belongs here.

## Assumptions and limitations

- **Deferred:** ideas the brief marks as optional, later or nice-to-have, plus natural next steps excluded above. Name each briefly; specify and build none of them. Integrity rules the principal journey depends on are never deferred: one resource held twice at the same time, holds starting in the past, server-side permission checks.

## Check before writing

- Every capability the brief requests maps to an FR; every FR traces to the brief or a stated minimal assumption.
- Problem, outcome, FRs, primary journey and acceptance describe the same product.
- No exclusion contradicts an explicit requirement, and no deferred idea appears in FRs, API, seed or acceptance.
- No empty subsection or placeholder text.

The reviewer checks these points under `scope_consistent` and corrects them in place.
