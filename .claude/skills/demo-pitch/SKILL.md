---
name: demo-pitch
description: Turn a finished factory run into a timed 10-minute hackathon pitch with live demo click-through, run numbers, judge Q&A prep and a pre-demo checklist. Run manually after a factory run with /demo-pitch [project folder in out/].
disable-model-invocation: true
---

# Demo pitch

Project: `out/$ARGUMENTS/` (use `out/latest/` when no argument is given).

Judges score the factory's autonomy, its cost and whether the acceptance tests pass live. The pitch shows the factory first and the generated product as its proof.

## Read

- `README.md`: factory pipeline, gates, budget design.
- Project: `REPORT.md`, `logs/run.json`, `logs/*.result.json`, `logs/verify.json`, `requirements/product.json`, `requirements/acceptance.json`, `design/ui-spec.md`, `design/visual-plan.json`, `quality/visual-review.json`, `quality/demo.md` if present.
- Look at `app/visual-evidence/*.png` to choose the strongest screens.

Use only numbers and facts found in these files. Write "not recorded" for anything missing; never estimate.

## Write `quality/pitch.md` in the project folder

Write in the user's language. Keep code, routes, testids and commands verbatim.

1. **0:00–1:00 Hook:** the problem and the factory in one sentence each.
2. **1:00–3:00 Factory:** the stage pipeline, deterministic gates, blind parallel QA, budget reservations and deadline. One simple diagram from README.
3. **3:00–4:00 This run:** wall time, total cost against budget, cost per stage, fix rounds, final gate results.
4. **4:00–8:00 Live demo:** for each acceptance case, in order: route, role, exact clicks and inputs, the visible result to point at. Then the primary journey. Mark which cases are supplied and which are derived.
5. **8:00–9:00 Evidence:** test counts by group, screenshots and visual review status.
6. **9:00–10:00 Honest limits and next steps** from the report's limitations.

Then add:

- **Judge Q&A:** 6–8 likely questions with short factual answers (cost control, a changed brief, test independence, failure handling, why this stack, what is not autonomous).
- **Pre-demo checklist:** `cd out/<project>/app && npm start`, reset with `curl -X POST http://localhost:3000/api/reset`, open the first route, browser zoom and window size, a fallback screenshot per demo step.

Finish by telling the user the file path and the 3 strongest moments to emphasize.
