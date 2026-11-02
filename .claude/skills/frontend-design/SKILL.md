---
name: frontend-design
description: Create a distinctive visual direction for the current product, then refine its rendered UI. Use in the factory design and polish stages; preserve reviewed behavior and UI contracts.
license: Complete terms in LICENSE.txt
---

# Frontend design for the Factory

Adapted from Anthropic's frontend-design skill for the installed React/Vite stack and unattended runs. The original instructions are preserved in [references/upstream-SKILL.md](references/upstream-SKILL.md); source and original hashes are in [references/source.json](references/source.json).

## Design stage

Ground decisions in the actual brief, audience, task and content. Keep explicit brand directions; when unspecified, choose a coherent direction and record the assumption without waiting for a client response.

Put the plan in the existing UI spec and design tokens:
- A short visual concept tied to this product, plus a restrained palette with semantic roles.
- A clear type scale using available system fonts with the required language coverage. No remote fonts, new packages or asset-generation tools are needed.
- A desktop/mobile composition that makes the principal content or task easy to find. A dashboard, calculator and portfolio need different structures; a hero is optional.
- One memorable treatment where it serves the brief, with quieter supporting elements. Borders, numbered markers, cards and motion should communicate structure or change.

Compare the plan with the brief before implementation. Replace choices that are merely defaults for unrelated products. Do not invent ratings, clients, verification, insurance or other unsupported facts to fill the layout. Prefer deliberate CSS, content and spacing over new dependencies or remote assets.

## Polish stage

Read the actual planned PNGs. Fix visible hierarchy, typography, spacing, image treatment and action clarity within the stage's permitted files. Maintain existing token names, routes, testids, accessible names and exact contract-bound text. Change only copy that is not frozen by the reviewed UI/acceptance contracts.

Use CSS selectors with predictable specificity, preserve visible keyboard focus and honor reduced motion. Animation is optional; a static product is valid. Capture refreshed evidence through the existing Playwright workflow, and distinguish inspected images from intended CSS behavior.

## Reference use

The upstream text is optional background, not a second required pass. Its interactive confirmation, broad font choices and example aesthetics do not override the factory's unattended operation, system-font policy, budget or reviewed contracts. No skill grants extra tools or write access.
