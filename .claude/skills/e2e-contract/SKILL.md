---
name: e2e-contract
description: Shared rules that let the builder and the independent QA writer agree without seeing each other's code - testids, role/session switching, reset, persistence, waiting and formats. Load in the design, build and tests stages before writing the UI contract, UI code or Playwright specs.
---

# E2E contract

Builder and QA work in parallel from `design/ui-spec.md` and never see each other's code. Every mismatch costs a fix round. `ui-spec.md` decides product specifics; these rules fill every gap the same way on both sides.

## Selectors

- Every element a test touches has the exact ui-spec `data-testid`, kebab-case `<area>-<thing>[-<action>]` (`catalog-filter-make`, `booking-submit`).
- Repeated records: each item has the list's item testid plus `data-id="<record id>"`. Tests scope by `data-id` or by data they created, never by order or count.
- Inputs have a visible `<label>`; buttons have accessible names. Tests may use `getByRole`/`getByLabel` with the exact ui-spec text.
- A value tests read (total, status, count) sits in its own element with its own testid and contains exactly the ui-spec format, nothing else.
- Render a testid once per page. If desktop and mobile navigation both exist, only one is in the DOM, or each has a distinct testid.

## Roles and session (multi-role products only)

- ui-spec defines one mechanism. Default: a labeled `<select data-testid="role-switcher">` in the app shell that persists the choice to `localStorage["<product-slug>-session"]`.
- The app reads the stored session once at startup, before rendering role-dependent content.
- The app writes storage only in the switcher's change handler. Never write it in a mount effect or a default initializer: that overwrites the session a test stored before navigation.
- Tests switch roles through the switcher, or set the key with `page.addInitScript` before `page.goto`. Both must work.
- A route the current role may not use renders an element with testid `access-denied`, not a redirect loop.

## Reset and persistence

- `POST /api/reset` restores the seed exactly. Tests call it in `beforeEach` and assert a 2xx status.
- After a mutation the UI shows the server's result without a manual reload. After a reload the same state loads from the API.
- API errors return 4xx with `{ "error": "<message>" }`; the UI shows that message in the form's error element.

## Waiting

- While a mutation is pending, its submit control is disabled. Afterwards a result element appears: `<form>-success` or `<form>-error`.
- Pages with async data show `<page>-loading`, then a ready element whose testid the visual plan uses as `ready`.
- Tests wrap the action: `Promise.all([page.waitForResponse((r) => r.url().includes('/api/...') && r.request().method() === 'POST'), button.click()])`, assert the status, then assert the UI with web-first assertions (`toHaveText`, `toBeVisible`). No `waitForTimeout`.

## Formats and inputs

- Money, dates and numbers come from one formatter in `shared/`. ui-spec gives exact example strings (`$280.00`); acceptance tests assert those strings exactly.
- Dates use `<input type="date">` with `YYYY-MM-DD` values; tests use `fill('2026-11-05')`.
- Client validation reuses the `shared/` validators the server uses. An invalid field shows `<field>-error` with text.
