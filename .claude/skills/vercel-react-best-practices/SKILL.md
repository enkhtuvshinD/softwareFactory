---
name: vercel-react-best-practices
description: Apply relevant Vercel React performance rules to the factory's React/Vite client. Use during build and React-related fixes for fetching, effects, rendering and imports; skip Next.js-only guidance.
license: MIT
metadata:
  author: vercel
  version: "1.0.0"
---

# React best practices for the Factory

Adapted from Vercel's React/Next.js guidelines for this React/Vite application. Original instructions are in [references/upstream-SKILL.md](references/upstream-SKILL.md), with source hashes in [references/source.json](references/source.json). Retained rule files are optional, focused references.

Keep the installed framework, dependency list, reviewed API/UI contracts and skeleton's module structure. Read only the rules relevant to the current change; do not load the full compiled AGENTS.md by default. Prefer correctness and the main journey over speculative optimization.

## Data and effects

- Start independent requests together; sequence actual dependencies. See [rules/async-parallel.md](rules/async-parallel.md).
- Keep fetch calls in the existing API client and stateful loading in hooks. An old request must not overwrite results for newer filters, parameters or a changed persona: abort or ignore stale responses during effect cleanup.
- Refetch or update canonical data after a successful mutation according to the contract. Do not introduce SWR, another cache package or an unrequested live-update system.
- Derive values from existing state during render instead of synchronizing duplicate state with effects. See [rules/rerender-derived-state-no-effect.md](rules/rerender-derived-state-no-effect.md).
- Keep effect dependencies complete and stable. See [rules/rerender-dependencies.md](rules/rerender-dependencies.md).

## Components and rendering

- Use functional state updates when the next value depends on the previous value. See [rules/rerender-functional-setstate.md](rules/rerender-functional-setstate.md).
- Keep component definitions outside other components to preserve identity, focus and state. See [rules/rerender-no-inline-components.md](rules/rerender-no-inline-components.md).
- Put work caused by a user's action in that event handler. See [rules/rerender-move-effect-to-event.md](rules/rerender-move-effect-to-event.md).
- Avoid memoization for trivial expressions. Optimize expensive rendering only when relevant to the product or an observed problem. See [rules/rerender-simple-expression-in-memo.md](rules/rerender-simple-expression-in-memo.md).
- Use intentional conditional rendering so zero counts do not accidentally become stray UI text. See [rules/rendering-conditional-render.md](rules/rendering-conditional-render.md).

## Imports and scope

Import only needed symbols from existing dependencies. Keep optional heavyweight UI out of the initial path when justified; use platform/React facilities already present.

Next.js routing, RSC, server actions, next/dynamic, hydration workarounds and packages mentioned in upstream examples are not instructions to migrate this Vite app. Apply a rule only when its assumptions match. A fix preserves assertions and uses the existing build/unit/E2E verification; never claim a measured performance gain without evidence.
