# Stage 1 — Requirements Writer

Turn the current product brief into a precise specification for a builder and independent QA. Work in the output root.

Read `input/brief.md` and `input/seed.json`. When the product needs a domain API, load the `express-api` skill before writing the API contract. The seed may be `{}` when none was supplied, or an incompatible leftover from a prior example. Derive the domain from this brief; do not reuse prior roles, entities, workflows or examples.

Load the `product-scope` skill before writing product scope and the `demo-data-quality` skill before resolving demo data; keep their decisions within the existing requirements document and `requirements/seed.json`.

## `requirements/requirements.md`

Keep the document focused, under about 350 lines, with:
1. **Product and scope:** intended users, requested outcome, explicit exclusions, and real integration/authentication needs or missing prerequisites. Support static/read-only or anonymous apps without inventing a backend domain or persona switcher.
2. **Roles and capabilities:** actual roles/permissions; use `visitor` for anonymous use. Describe role switching only if multiple demo personas are needed. Preserve explicitly requested real authentication requirements.
3. **Functional requirements:** stable `FR-001` IDs, grouped by capability, with Given/When/Then outcomes. Cover every requested capability.
4. **Domain model:** actual entities, fields, types, relationships and validation. Preserve relevant supplied seed names/values. An app with no stored entities may have an empty model; do not invent records.
5. **Applicable business rules:** specify only rules this product needs, with worked examples and boundaries. For calculations define formulas/rounding; for dates define timezone/boundaries; for workflows define actors/transitions; for search define matching; for metrics define sources. Omit inapplicable categories. Identify meaningful pure logic to unit-test; do not invent logic solely to create tests.
6. **API and persistence contract:** endpoints the actual UI needs, request/response shapes and errors. Keep skeleton `GET /api/health` and `POST /api/reset`; reset restores the resolved seed exactly. Use shared domain types. If no domain API is needed, retain infrastructure endpoints only.
7. **Primary journey:** a complete path from entry through the user's main desired outcome, with applicable role handoffs and observable state. For mutations specify persistence after refresh. For read-only/static products verify the real reading/navigation/interaction task instead of inventing writes. Clarify freshness only where relevant.
8. **UI/non-functional behavior:** responsive down to 360px, labeled keyboard-accessible controls, visible focus, useful applicable loading/empty/error/success states. Derive formats, locale, units and currency from the brief. Do not force filters, images or dashboards into products that do not need them.
9. **Resolved seed and traceability:** describe the exact `requirements/seed.json` state and why supplied records were relevant or incompatible. Map every requested capability and acceptance case to FR IDs, distinguishing supplied cases from derived checks.
10. **Assumptions and limitations:** minimal decisions, unavailable prerequisites, explicit demo boundaries and any unit-test applicability justification.

## `requirements/product.json`

Write valid JSON with this base structure and brief-derived values:

```json
{
  "name": "Product name from the brief",
  "roles": ["visitor"],
  "entities": [],
  "primary_journey": {
    "title": "The main user outcome",
    "steps": ["A concrete user action"],
    "expected": ["Its observable outcome"],
    "mutates_state": false
  },
  "acceptance_mode": "derived",
  "unit_tests_required": true
}
```

`roles` is nonempty; `entities` may be empty. Journey steps/expected are nonempty string arrays. `acceptance_mode` is `provided` when the brief explicitly supplies test/acceptance cases, otherwise `derived`.

`unit_tests_required` defaults to true. Set it false only if there is no meaningful pure logic to test, such as static/read-only presentation already covered by E2E; then also include a nonempty `unit_test_reason`. A calculator or validation-heavy tool requires unit tests. Do not add dummy tests to avoid making this decision.

## `requirements/seed.json`

Write the COMPLETE resolved app/reset seed as valid JSON, even if it is `{}`. Derive its shape from the actual domain. Preserve every relevant supplied record, ID and field value; append only minimal demo state needed for acceptance/journey/representative screens. Use the persisted run date only where relevant. If input seed data is incompatible with the current brief, explain the decision in Assumptions, keep `input/seed.json` unchanged and synthesize only relevant demo data. Do not carry unrelated entities into this app. The reviewer approves this seed; the builder consumes it without inventing extra fixtures later.

## `requirements/acceptance.json`

Write a nonempty JSON array of objects:

```json
{
  "id": "AC-001",
  "title": "Observable behavior",
  "role": "visitor",
  "source": "derived",
  "source_ref": "Relevant brief phrase or heading",
  "preconditions": [],
  "steps": ["A concrete UI action"],
  "expected": ["Its observable outcome"]
}
```

- IDs match `^[A-Za-z][A-Za-z0-9_-]{0,63}$` and are unique even when compared without case, so filenames remain portable. Preserve safe non-colliding supplied IDs exactly, including case; no prefix is mandatory. For an unsafe/unlabelled/case-colliding supplied case use `CASE-001`, retaining its original label/text in `source_ref`.
- In `provided` mode include every supplied case exactly once with `source: "brief"`, preserving original data, steps and expected values. `source_ref` is an exact excerpt or heading from the original brief. Supplemental derived QA stays outside this list.
- Without explicit cases derive a small sufficient `AC-001`, `AC-002`, ... set from requested behavior, all with `source: "derived"`. These are implementation checks, not purported organizer tests.
- `role` is an actual role or `any`/`both` when applicable. Preconditions/steps/expected are string arrays; steps and expected are nonempty.

Write no application code.
