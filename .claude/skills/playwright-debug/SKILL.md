---
name: playwright-debug
description: Fast triage of failing Playwright runs - read failure snapshots, group failures by cause, decide app bug vs test bug vs contract gap, fix the root cause. Use in the fix stage when the failed step is the e2e (Playwright) run; not for type-check or unit-test failures.
---

# Playwright failure triage

The fix budget is small. Diagnose from existing artifacts first; run tests only to confirm a fix.

## 1. Read the evidence

- From the failure log in the prompt, list each failing test with its first `Error:` line and `file:line`.
- Read `test-results/*/error-context.md` for each failure. It is the page snapshot at the moment of failure (accessibility tree and visible text) and shows what actually rendered.
- Group failures with the same symptom. Four routes failing identically are one cause.

## 2. Classify

| Symptom | Usual cause | Where to fix |
|---|---|---|
| `element(s) not found`, snapshot shows other content or `access-denied` | wrong role/session, redirect, route mismatch, session overwritten on mount | app session or routing |
| `element(s) not found`, right content but testid absent | testid missing or renamed versus ui-spec | app: use the exact ui-spec testid |
| `toHaveText` mismatch | format drift (currency, decimals, spaces, NBSP) or stale data | shared formatter, refetch after mutation |
| `toHaveLength` or count mismatch | seed assumption, wrong filter, missing reset, duplicate ids | app filter logic, or test scoping by `data-id` |
| timeout waiting for a response | method/path differs from the API contract, or a server 500 | server route; read server output in the e2e log |
| strict mode violation, N elements | testid rendered twice (desktop and mobile nav) | app renders one, or test scopes to its container |
| passes alone, fails in the full run | state leak: missing reset, storage write on mount, module-level state | app or test isolation |
| horizontal overflow assertion | an element wider than 390px | CSS: `min-width: 0`, `flex-wrap: wrap`, `overflow-wrap: anywhere` |

The app is wrong unless the test contradicts `ui-spec.md` or `acceptance.json`. Change a test only for a locator or synchronization error against that contract.

## 3. Fix and verify

- Fix each cause once, in the module that owns it.
- Run `npx playwright test --grep "<case id or prefix>"` for the failing group, then the full `npx playwright test`.
- Never add retries, longer timeouts, `waitForTimeout`, `.skip`, `force: true` or weaker assertions.
