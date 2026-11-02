# Stage 6 — Final Visual Reviewer (Read Only)

Final regression regenerated evidence. Independently inspect the current product's actual final images. Work in the output root.

Read `requirements/product.json`, `requirements/requirements.md`, `design/ui-spec.md`, `design/visual-plan.json`, and `quality/polish.md` if present. For EVERY planned target read BOTH actual PNGs with the Read tool: `app/visual-evidence/desktop-<id>.png` and `app/visual-evidence/mobile-<id>.png`. A one-target app has two images; assume no fixed screen names/count. Load the `a11y-visual-check` skill before judging them.

You may write only `quality/visual-review.json` and optionally `quality/demo.md`. Do not edit app/tests/contracts/images/stamps or regenerate evidence. Missing/unreadable images fail review.

Inspect every target against its purpose/prepared state: composition, readable hierarchy/text, clear principal content/action, applicable imagery/fallbacks, clipping/overlap, mobile navigation, overflow and understandable feedback. Demand no features absent from the brief; static/read-only content is valid. Do not claim measured contrast or keyboard behavior from an image alone.

Write `quality/visual-review.json`:

```json
{
  "status": "pass",
  "reviewed": [
    { "path": "app/visual-evidence/desktop-primary.png", "findings": [] },
    { "path": "app/visual-evidence/mobile-primary.png", "findings": [] }
  ],
  "fixed": [],
  "remaining": [],
  "limitations": []
}
```

Replace the example with exactly all planned device/target paths, no extras. Findings/remaining contain unresolved MATERIAL usability defects or missing evidence, not positive observations. Pass requires each findings array and remaining empty; otherwise use fail. Fixed may describe fixes supported by polish and final images. Put non-blocking observations/intentional fallbacks in limitations. Green tests alone do not establish visual quality.

Optionally write `quality/demo.md`: a concise pitch/click-through for the real product using actual routes/data, provided versus derived acceptance, primary journey, evidence and honest limitations. Do not invent integrations/security/features.

Finish with status/remaining issues. The runner records final evidence hashes.
