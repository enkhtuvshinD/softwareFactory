---
name: frontend-design
description: Create a distinctive visual direction for the current product, then refine its rendered UI. Use in the factory design and polish stages; preserve reviewed behavior and UI contracts.
license: Complete terms in LICENSE.txt
---

# Frontend design for the Factory

Adapted from Anthropic's frontend-design skill for the installed React/Vite stack and unattended runs. The original instructions are preserved in [references/upstream-SKILL.md](references/upstream-SKILL.md); source and original hashes are in [references/source.json](references/source.json).

## Design stage

Ground decisions in the actual brief, audience, task and content. Keep explicit brand directions; when unspecified, choose a coherent direction and record the assumption without waiting for a client response.

Open the UI spec's visual direction with a Design Read whose values actually drive layout, density and motion:

```yaml
Design Read:
  audience: <primary user and context>
  visual-language: <specific family, not "modern/clean">
  recipe: <one recipe id below, or custom>
  visual-variance: <1-10>
  motion-intensity: <1-10>
  information-density: <1-10>
```

Pick at most one style recipe whose best-for matches the product, read only that file in `references/style-recipes/`, and translate its palette, spacing ladder, radius, shadow, motion and achievable signature moves into tokens and the spec:

| Recipe | Best for | Mode |
|---|---|---|
| `apple-hig` | Premium consumer products with a hero object or product photos | light |
| `dieter-rams-braun` | Tools, calculators, spec-led or design-led B2B | light |
| `monocle-magazine` | Travel, hospitality, food and lifestyle content with real photos | light |
| `headspace-meditation` | Wellness, health, care and kids products | light |
| `notion-pre-ai` | Collaborative or productivity tools for non-engineers | light |
| `pentagram` | Portfolios, institutions, bold statement pages | light |
| `vignelli-swiss-helvetica` | Wayfinding, queues, schedules, strictly ordered information | either |
| `tufte-dataink` | Analytical reports and data-led views | either |
| `linear` | B2B SaaS, developer and AI tools | dark |
| `bloomberg-terminal` | Dense monitoring, finance and operations consoles | dark |

When none fits, write a custom direction with the same anatomy (palette roles, spacing ladder, radius grammar, shadow, motion, three signature moves, an avoid list) instead of defaults. Recipes are style references; factory rules win:
- Map recipe fonts to system stacks with the required language coverage (grotesk to the `system-ui` sans stack, serif to `Georgia, "Times New Roman", serif`, mono to `ui-monospace`) and keep the recipe's weights, tracking and size contrast.
- Keep 16px minimum body text on mobile, 44px targets and AA contrast even where a recipe is denser or paler.
- Skip AI prompt seeds, mascots, illustrations and photography the inputs do not supply; never fake them with CSS drawings. Skip continuous loops such as breathing shapes, drifting meshes or tickers; motion is state feedback.
- Never name the anchor brand in the UI, copy its logo or put emoji into contract-bound text.

Put the plan in the existing UI spec and design tokens:
- A short visual concept tied to this product, plus a restrained palette with semantic roles. Pair every surface role with its foreground (primary/on-primary, surface/on-surface, muted/muted-foreground, destructive/on-destructive) plus border and focus-ring roles, and target AA for each pair. Derive tints and shades from palette colors with `color-mix()` or `oklch()` instead of adding hues.
- A clear type scale using available system fonts with the required language coverage. Browsing and landing screens use bold contrast (display at least 2.5× body, `clamp()` for display sizes, `text-wrap: pretty` on headings); operational screens stay tighter. No remote fonts, new packages or asset-generation tools are needed.
- A desktop/mobile composition that makes the principal content or task easy to find. A dashboard, calculator and portfolio need different structures. A browsing or landing screen benefits from a compact intro band (product name, one headline and one supporting line drawn from the brief) above its content; tools and dashboards lead with the tool itself.
- A first impression that survives the 390×844 viewport: principal content (first cards, the tool, the key figure) starts on the first screen. Keep filters and long forms compact there (one full-width search, short fields two per row, wrapping chips) instead of stacking every field first. Never hide contract-bound controls behind a collapsed disclosure; tests must reach them.
- One memorable treatment where it serves the brief, with quieter supporting elements. Borders, numbered markers, cards and motion should communicate structure or change.
- A designed image fallback whenever records carry images, because demo image URLs often fail. Keep the loaded-image aspect ratio and use a token gradient or tinted surface with the item's initials or a simple inline SVG glyph; any contract fallback text becomes a small caption. A bare grey box with only text reads as broken.
- Demo controls (persona/role switcher, reset) stay functional and labeled but visually secondary: compact, styled to match the shell, never the largest element in the header.

Compare the plan with the brief before implementation. Replace choices that are merely defaults for unrelated products. Do not invent ratings, clients, verification, insurance or other unsupported facts to fill the layout. Prefer deliberate CSS, content and spacing over new dependencies or remote assets.

## Polish stage

Read the actual planned PNGs. Fix visible hierarchy, typography, spacing, image treatment and action clarity within the stage's permitted files. Then check the primary target's first impression: designed image fallbacks, principal content on the first mobile screen, compact demo controls and a visible product identity. Maintain existing token names, routes, testids, accessible names and exact contract-bound text. Change only copy that is not frozen by the reviewed UI/acceptance contracts.

Before editing, score the primary target 0–10 on philosophy alignment (every detail traces to the Design Read and recipe), visual hierarchy, craft (one spacing ladder, at most four colors and two font families), functionality (each element earns its place) and originality. Fix the three highest-impact quick wins within scope, and repair any of these failure patterns that appear:
- Cardification: every item boxed in its own rounded card where spacing, dividers or one shared surface would group it.
- Shape drift: radii without a grammar; assign radius by component role.
- Default centered hero, or marketing styling (giant headlines, sparse cards) on an operational screen.
- Generic display type: system font at default weight and size with no contrast.
- Micro-label noise or copy-shaped decoration: metadata and captions that help nobody.
- Motion for spectacle only, or without a reduced-motion path.
- Happy-path-only components with no loading, empty or error state.

Triage fixes in this order: accessibility, touch and interaction, layout and responsiveness, typography and color, motion, forms and feedback, navigation. Interaction craft that separates a product from a demo:
- One primary action per screen; secondary actions stay visibly quieter.
- Prices, totals, counts and dates in columns use `font-variant-numeric: tabular-nums`.
- Buttons show a pressed state (a slight scale or tonal layer) and stay disabled with progress while a request is pending; clickable cards and controls use `cursor: pointer`.
- Motion animates only `transform` and `opacity`; exits take about two thirds of the enter duration; a grid may stagger its entrance by 30–50ms per item, capped and skipped under reduced motion.
- One elevation scale and one z-index scale; no ad-hoc shadows or layers.
- Loading beyond about a second shows skeletons shaped like the content rather than a lone spinner.
- Short headings use `text-wrap: balance`.

Use CSS selectors with predictable specificity, preserve visible keyboard focus and honor reduced motion. Give interactive cards and buttons subtle hover/focus feedback (color, shadow or transform transitions of 120–200ms on named properties) inside `@media (prefers-reduced-motion: no-preference)`, with no animation dependency. Capture refreshed evidence through the existing Playwright workflow, and distinguish inspected images from intended CSS behavior.

## Reference use

The style recipes, Design Read, critique and failure patterns are adapted from ConardLi's MIT-licensed [web-design-engineer](https://github.com/ConardLi/garden-skills/tree/main/skills/web-design-engineer) skill; license and source hashes are in [references/style-recipes/](references/style-recipes/). Its interactive checkpoints, variants, web lookups, CDN libraries and remote fonts do not apply here. The paired color roles, fix triage order and interaction craft rules are adapted from the MIT-licensed [ui-ux-pro-max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) rule set; its search scripts, product palettes and Google Font pairings are not used.

The upstream text is optional background, not a second required pass. Its interactive confirmation, broad font choices and example aesthetics do not override the factory's unattended operation, system-font policy, budget or reviewed contracts. No skill grants extra tools or write access.
