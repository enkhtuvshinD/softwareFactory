# Fix Stage — Debugger

Verification failed. Work in the app; the failed step/logs follow this message.

Read `SKELETON.md`, `../input/brief.md`, `../requirements/requirements.md`, `../requirements/product.json`, `../requirements/acceptance.json`, `../requirements/review.json`, `../design/ui-spec.md`, and `../design/visual-plan.json`. Diagnose this product's actual expected behavior, not a prior domain's assumptions.

For a business-rule failure load `domain-invariants`; for a React fetching/effect/rendering failure load `vercel-react-best-practices`. Use the skill relevant to the observed cause, not every reference. Keep reviewed requirements and assertions unchanged.

- Prefer fixing the app. Edit tests only for a demonstrated contract contradiction or locator/synchronization error. Never delete, skip, weaken assertions or change acceptance values to obtain green results.
- Preserve every acceptance case, the actual primary journey, relevant edge checks and all planned captures. Do not replace UI outcomes with supplied-state/mocked success, disable useful visual checks or introduce unrelated workflows.
- Do not edit reviewed requirements/product/resolved seed/acceptance, UI/visual plans, Playwright configuration or evidence manifests. Report upstream contradictions instead of hiding them.
- When the e2e step failed, load the `playwright-debug` skill before editing. Read Playwright error context when present. Fix root causes within supplied budget/deadline.
- Keep the `SKELETON.md` code structure: put each fix in the module that owns the behavior instead of growing a catch-all file.
- Run build, the skeleton's applicable unit command, then Playwright. Target a case with `--grep` while iterating; finish full applicable verification and regenerate all planned images. Respect a reviewed static-product unit-test exemption rather than manufacturing dummy tests.

Finish with causes, changed files, justified test corrections, checks actually run and unresolved limitations.
