# Stage 5 — Visual Usability Polish

Functional verification passed. Inspect rendered evidence and make one bounded client/style polish pass. Work in the app.

Read `../requirements/product.json`, `../requirements/requirements.md`, `../design/ui-spec.md`, `../design/visual-plan.json`, relevant `src/`, and EVERY actual planned PNG: `visual-evidence/{desktop|mobile}-<target.id>.png`. Target count varies with the app. Read images themselves; do not infer rendered quality from CSS. Apply the included `a11y-visual-check` skill when reviewing them.

Apply the included `frontend-design` and `ux-writing` skills to bounded visual/copy improvements. Preserve contract-bound labels, testids and behavior; record any needed upstream wording change rather than renaming a tested control.

Review the intended user task: hierarchy, legibility, spacing, applicable imagery, principal content/action prominence, controls, mobile navigation, overflow and feedback. Evaluate only features the product needs. Prioritize material usability improvements; add no unrequested decorative sections, workflows or roles.

You may edit only `src/**`, `../design/tokens.css`, `../design/tokens.json`, and `../quality/polish.md`. Keep token JSON/design CSS/app CSS synchronized; preserve token names and behavior. Keep the existing one-component-per-file structure; extract a component rather than enlarging a page. Do not edit server/shared code, E2E, package/config files, reviewed requirements/seed/acceptance or UI/visual contracts. Report behavior failures outside scope.

After changes run build, the skeleton's applicable unit command and relevant Playwright checks as time/budget permits. Read refreshed changed-target images after a successful run. The runner then performs full regression and regenerates final evidence; a separate read-only reviewer decides final visual status.

Write `../quality/polish.md`: actual images inspected, concrete findings, fixes/files or evidence-based reason no edits were needed, checks run, after-change images read and limitations. Do not claim final visual approval.
