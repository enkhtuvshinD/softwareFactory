# Stage 2 — UI Designer

Design the current product and its binding UI test contract. Use its actual domain, primary journey and scope, including anonymous/single-screen/read-only products.

Read `input/brief.md`, `requirements/requirements.md`, `requirements/product.json`, `requirements/seed.json`, `requirements/acceptance.json`, and approved `requirements/review.json`. Apply the included `e2e-contract` skill to the binding test contract.

Apply the included `frontend-design` skill for a brief-specific visual direction and `ux-writing` before freezing labels/feedback in the UI contract. Record decisions in the existing UI spec/tokens; keep system fonts, existing packages and unattended operation.

## `design/tokens.json` and `design/tokens.css`

Define a coherent palette with semantic surface/text/feedback roles, system typography, spacing, radii, shadows, widths, control sizes and breakpoints. Add domain/status tokens only if used. Target WCAG AA text contrast and identify foreground/background pairs; do not claim unperformed measurements.

CSS has the same tokens as custom properties on `:root`, then minimal box sizing, body font/background/text, image max width and visible keyboard focus. The app imports it directly. No web fonts or new packages.

## `design/ui-spec.md`

1. **Visual direction:** a recognizable direction appropriate to this product, with explicit hierarchy, palette roles, spacing and main content/action treatment. Specify imagery only if useful; invent no factual trust/integration claims.
2. **App shell:** actual navigation, content width and necessary roles/authentication controls. Avoid redundant dashboards, login or persona switching in an anonymous single-screen product.
3. **Screens/states:** actual routes, purposes and principal tasks; concrete desktop 1440×900 and mobile 390×844 composition, usability down to 360px, applicable loading/empty/error/success states. Use token widths/spacing and avoid horizontal overflow.
4. **Components:** only used components, with tokens, interactions and accessible labels/focus.
5. **Binding test contract:** routes/screens/access role; every control/output used by acceptance, primary journey, edge and smoke checks; exact testids, labels, input types/options and visible formatting. Repeated entities use stable `data-id`. Explain observable errors/success, actual mutations and applicable role transitions. Do not carry previous-run domain values forward.
6. **Visual evidence plan:** explain the targets in `visual-plan.json`, exact ready states, task and visible quality criteria.
7. **Assumptions/limitations.**

## `design/visual-plan.json`

Choose 1–3 representative screen/state targets from the actual app. A single-screen app normally needs one target; a distinct important state on the same route can be another target.

```json
{
  "targets": [
    {
      "id": "primary",
      "route": "/",
      "role": "visitor",
      "purpose": "The principal user task",
      "ready": "Exact stable testid and visible state to wait for",
      "prepare": ["Actions that reach this representative state"]
    }
  ]
}
```

IDs are unique lowercase names matching `^[a-z][a-z0-9-]{0,31}$`. Routes are real local paths with usable IDs, not unresolved placeholders. Roles match `product.json` or `any` for shared screens. Prepare may be empty for static content; ready must identify meaningful visible content. Use current resolved fixtures/inputs and safe dynamic values where needed.

QA captures each target in both sizes as `app/visual-evidence/{desktop|mobile}-{id}.png`, then an independent agent reads the actual final images. Do not force unrequested screens, imagery or domain-specific metrics into this app.
