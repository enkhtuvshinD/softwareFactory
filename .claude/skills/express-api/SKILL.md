---
name: express-api
description: Backend rules for this factory's Express 4 + JSON-file store - API contract defaults, routes/services/shared layering, input validation, error shape, demo-session authorization, state transitions, money and date math, reset and freshness. Load in the requirements stage before writing the API contract and in the build stage before writing server code. Skip for products with no domain API.
---

# Express API

The stack is fixed: Express 4, the `server/db.ts` JSON store, strict TypeScript, no extra packages (no zod, no ORM). The reviewed API contract in `requirements.md` wins; these defaults fill whatever it leaves open.

## Contract defaults

- REST under `/api` with plural kebab-case resources: `GET /api/bookings`, `GET /api/bookings/:id`, `POST /api/bookings`, `PATCH /api/bookings/:id`, `DELETE /api/bookings/:id`.
- A state change with business meaning gets an action route (`POST /api/bookings/:id/approve`), not a free-form `status` PATCH.
- camelCase JSON fields, string ids, dates `YYYY-MM-DD`, timestamps ISO 8601 UTC. Money as integers in the smallest unit used (cents for USD, whole ₮ for MNT); the client formats it.
- Success: `200` with the resource or array, `201` with the created resource, `204` after delete.
- Errors: `{ "error": { "code": "VALIDATION_ERROR", "message": "Readable sentence", "fields": { "email": "Enter a valid email" } } }`. Include `fields` only for validation errors.

| Status | When | `code` |
|---|---|---|
| 400 | malformed or invalid input | `VALIDATION_ERROR` |
| 401 | missing or unknown demo user | `UNAUTHENTICATED` |
| 403 | role or ownership forbids the action | `FORBIDDEN` |
| 404 | record or route missing | `NOT_FOUND` |
| 409 | conflicts with current state (duplicate, invalid transition) | domain code, e.g. `INVALID_TRANSITION` |

## Layering

- `server/routes/<resource>.ts`: parse the request, call one service function, send status and body. No business rules, no `readDb`.
- `server/services/<resource>.ts`: load the db, check existence, permission and invariants, mutate, `writeDb`, return a view object.
- `shared/`: pure validators, calculations, transition tables and formatters, unit tested and imported by client and server.
- `server/http.ts`: `HttpError`, `fail()`, session middleware, `requireRole()` and the central error handler, registered last under `/api`. The 404 handler in `server/index.ts` uses the same error shape.

## Handlers

- Keep handlers synchronous. Express 4 does not catch rejected promises: a throwing `async` handler leaves the request hanging until the test times out. If async is unavoidable, wrap it: `(req, res, next) => handler(req, res).catch(next)`.
- Register literal paths before parameter paths (`/mine` before `/:id`, `/staff/dashboard` before `/staff`).
- Treat `req.body`, `req.query` and `req.params` as `unknown`. Validate with a `shared/` parser returning `{ ok: true, value } | { ok: false, fields }`; never cast request data with `as`.
- A malformed JSON body becomes 400 `VALIDATION_ERROR` in the error handler (`err.type === 'entity.parse.failed'`).

## Writes

- Every mutation follows this order: validate input, load records, existence (404), permission (403), invariants (409), mutate, `writeDb(db)` once. `readDb()` returns a shared cached object, so mutating before a check that throws leaves memory and disk out of sync.
- The server computes derived values (totals, statuses, counters, timestamps) and ignores client-sent versions of them.
- New ids are a prefix plus the next number (`bk-4`) computed from existing ids, never `Math.random()`, so tests and demo data stay predictable.
- Status changes go through a transition table in `shared/` (`{ pending: ['confirmed', 'cancelled'] }`), with unit tests for allowed and rejected transitions.
- Invariants other records can break, such as overlapping holds on one resource or capacity, are re-checked inside every mutation that creates or confirms a hold and return 409 with a domain code (`BOOKING_CONFLICT`). A transition table alone does not make an approval valid.

## Authorization (demo personas)

- Middleware resolves the demo user from `X-User-Id` (or the contract's mechanism) into `res.locals.user`.
- `requireRole()` guards the route; ownership checks (own records, own branch) live in the service. Hiding a button in the UI is never the only check.
- Implement real authentication only when the brief requires it, and then never fake success.

## State, time and reset

- All mutable state lives in the db document so `POST /api/reset` restores everything. No module-level arrays, counters or caches outside `db.ts`.
- No `setInterval` jobs and no writes during GET requests. Derive time-based states (expired, overdue, started) at read time from stored timestamps and the current time.
- Money math in integers, rounding once at the defined step: 3 days × 8500 + 2500 = 28000 cents → `$280.00`.
- Day counts between date-only strings: parse each as UTC midnight with `Date.UTC` and divide by 86 400 000; never use local time.
- "Today" and "now" for user-entered dates and times come from the local clock where the demo runs (local `Date` getters, never `toISOString().slice(0, 10)`): people enter local wall-clock values. Compare an entered date plus time against local now.
- Send `Cache-Control: no-store` on `/api` so refreshed pages show current data.

## Verify

- Unit tests cover every `shared/` validator, calculation and transition table, including boundaries and the brief's worked examples.
- `npm run build` passes with zero type errors.
