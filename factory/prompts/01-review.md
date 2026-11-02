# Stage 1b — Independent Requirements Reviewer

Review the proposed specification against the ORIGINAL current brief before implementation treats it as binding. Work in the output root.

Read `input/brief.md`, `input/seed.json`, and requirements files `requirements.md`, `product.json`, `seed.json`, `acceptance.json`.

Load `domain-invariants` for applicable rule consistency, `demo-data-quality` for resolved seed review and `product-scope` for scope review. Skip rule categories absent from this product; do not invent business logic for static content.

You may correct only those four requirements files and write `requirements/review.json`. Make one bounded correction pass, then re-review.

Check:
- **acceptance_preserved:** all explicit cases, safe IDs and exact examples survive; provided/derived provenance is honest. Without explicit cases, derived checks cover requested behavior without pretending to be organizer tests. No ID prefix is mandatory.
- **capability_coverage:** every requested capability has an FR, observable outcome and sufficient actual API/UI behavior.
- **domain_consistent:** roles, entities, fields, resolved seed and applicable rules agree. Check relevant formula, date, permission, transition, validation, persistence and metric boundaries only. Preserve relevant supplied seed values; independently verify that any incompatible-seed decision is grounded in the current brief and recorded, with original input intact.
- **journey_complete:** the actual primary journey reaches the intended outcome, including applicable handoffs and refresh persistence. A read-only/anonymous/single-screen journey remains valid without fabricated writes or roles.
- **scope_consistent:** no irrelevant capabilities, unsupported factual claims or silently weakened explicit requirements. Missing credentials/demo boundaries are honest. All artifacts agree. Approve `unit_tests_required: false` only with a nonempty, defensible `unit_test_reason` and no meaningful pure logic left untested; a calculator requires unit tests.

Correct omissions with minimal recorded assumptions. Do not expand scope or write application code.

Write `requirements/review.json`:

```json
{
  "status": "approved",
  "checks": {
    "acceptance_preserved": true,
    "capability_coverage": true,
    "domain_consistent": true,
    "journey_complete": true,
    "scope_consistent": true
  },
  "findings": [],
  "assumptions": []
}
```

Approve only if all five checks are true and findings is empty. Otherwise use `rejected`, false failed checks and specific unresolved findings. Assumptions are informational decisions, not hidden blockers. Finish with corrections and remaining findings.
