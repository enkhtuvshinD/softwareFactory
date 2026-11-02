# Wheels2Go — Requirements

Run date: 2026-11-02 (UTC). "Today" everywhere means the server's current UTC calendar date.

## 1. Product and scope

**Users:** *Car Owner* (lists cars, manages pickup details, decides booking requests, sees earnings) and *Renter* (finds a car, sees transparent pricing, requests a booking, tracks bookings).

**Problem:** Owners need one place to publish cars with pickup details and handle requests; renters need to find a car and see the exact total before asking to book.

**Outcome:** A renter books a car with a clear price breakdown, the owner approves the request, and both see Confirmed.

**Brief interpretation.** The active brief is the "Wheels2Go (P2P Mobility Marketplace — Car Only)" section including its TR-1..TR-4 matrix. The later content in `input/brief.md` (the "//2" Wheels2Go variant and "#3 QueueFlow") sits inside an HTML comment and is treated as inactive; it is NOT specified (see Assumptions). Some of its ideas that are compatible with the active brief and needed by the matrix are included as minimal assumptions (booking conflicts, Completed tag, past dates).

**Not in this build:** payments or deposits; real authentication/registration (demo persona switcher only); email/SMS notifications; chat/reviews/ratings; deleting listings; renter-initiated cancellation; image upload (URL only); maps/geocoding; multi-currency; insurance.

**Integrations/auth:** none required. Demo boundary: the persona switcher chooses between the two seeded users; API trusts `X-User-Id`. This is not real authentication.

## 2. Roles and capabilities

| Role | Can |
|---|---|
| owner | Create, edit, and toggle availability of own cars; set pickup instructions/drop-off rules/address; view booking requests for own cars; approve, decline, cancel; view earnings. Cannot book cars. |
| renter | Browse/filter available cars; view details; request bookings; view own bookings. Cannot manage listings or decide bookings. |

Anyone (including before choosing a persona) can read the catalog. A persona switcher in the header lists the two seeded users (Sarah Jenkins — Owner, Alex Rivera — Renter) and persists the choice in localStorage. Default persona on first load: renter Alex Rivera. Owner pages and renter booking actions require the matching persona; wrong-role navigation shows an inline "Switch to the owner/renter account" message.

## 3. Functional requirements

### Listings (owner)
- **FR-001** Create listing. Given owner session, when the owner submits Make, Model, Year, Fuel type, Transmission, Daily rate, Cleaning fee, Seats, Image URL and Pickup location (address) validly, then a car is created with status `available`, the owner sees it in "My listings", and it appears in the renter catalog immediately (no reload) with title, daily rate and location badge.
- **FR-002** Listing title. Given Title is left blank, then the server sets `title = "{brand} {model} {year}"` (e.g. "Tesla Model Y 2023").
- **FR-003** Listing validation. Given a required field is missing/invalid, when submitting, then the form shows a per-field message, nothing is saved, the API returns 400 `VALIDATION_ERROR` with `fields`.
- **FR-004** Edit listing. Given an own listing, when the owner edits any listing field and saves, then changes persist and show in the catalog and in existing bookings' car references. Editing a listing does not change stored booking prices.
- **FR-005** Toggle availability. Given an own listing, when the owner toggles availability, then status switches `available` ⇄ `unavailable`; unavailable cars disappear from the renter catalog and cannot be booked; existing bookings are unaffected.
- **FR-006** Location setup. Each listing stores Pickup/Drop-off location: pickup address (required), city and state (optional), pickup instructions and drop-off rules (optional, ≤500 chars). The renter sees them on the car details/checkout page and the location badge on cards.
- **FR-007** Ownership. Given an owner who does not own the car, when attempting to edit/toggle it, then 403 `FORBIDDEN`.

### Discovery (renter)
- **FR-010** Catalog. Given any visitor/renter, when opening the catalog, then available cars (status `available`) are shown as a responsive grid of cards showing image, title, daily rate ($/day), fuel type, transmission, seats and a location badge (pickup address, with city/state as secondary text when present).
- **FR-011** Filters. Filters: free-text search (brand, model, title), Make (select of brands present in available cars), Location keyword, Max daily rate, Transmission (Any/Automatic/Manual). Filters combine with AND and update the results as the user types/selects, without a page reload or submit button.
- **FR-012** Empty state. Given no cars match, then a "No cars match your filters" message with a "Clear filters" control is shown.
- **FR-013** Loading/error. The catalog shows a loading state while fetching and an error message with Retry on failure.

### Booking (renter)
- **FR-020** Date selection and price. Given a car details/checkout page, when start and end dates are chosen, then a breakdown shows Days, Daily rate, Rental subtotal, Cleaning fee, Total, computed per §5.
- **FR-021** Submit request. Given valid dates, no conflicts and a renter session, when the renter submits, then a booking with status `pending` is created (server-computed price snapshot, pickup location snapshot), a success message with a link to My Bookings is shown.
- **FR-022** Booking validation. Given end ≤ start, start before today, missing dates, or an unavailable car, then submission is blocked with a clear message (client inline; server 400 `VALIDATION_ERROR`, or 409 `CAR_UNAVAILABLE`).
- **FR-023** Conflict prevention. Given a confirmed booking overlaps the requested range on the same car, then request is rejected: UI shows "These dates are already booked for this car", server 409 `BOOKING_CONFLICT`. Pending bookings do not block.
- **FR-024** Role gate. Given owner session, when POST booking, then 403 `FORBIDDEN`; UI shows the switch-to-renter message instead of the submit button.

### Booking management (owner)
- **FR-030** Request queue. Given owner session, then "Booking Requests" lists bookings for own cars (newest first) with car title, renter name/email, dates, days, total and status tag; pending ones show Approve and Decline.
- **FR-031** Approve. Given a pending booking on an own car, when Approve is clicked, then status becomes `confirmed` in owner and renter views (after refresh/next load). If it overlaps another confirmed booking on the same car, then 409 `BOOKING_CONFLICT` and it stays pending.
- **FR-032** Decline. Pending → `cancelled`.
- **FR-033** Cancel confirmed. Owner can cancel a confirmed booking whose end date is after today → `cancelled`. Completed or cancelled bookings cannot change (409 `INVALID_TRANSITION`).
- **FR-034** Ownership. Acting on a booking for a car the user doesn't own → 403 `FORBIDDEN`.
- **FR-035** Status filter. Owner list has a status filter (All, Pending, Confirmed, Completed, Cancelled) defaulting to All.

### My Bookings (renter)
- **FR-040** Grouping. Given renter session, "My Bookings" lists own bookings in groups Upcoming (pending, or confirmed starting after today), Active, Completed, Cancelled. Each shows car, dates, pickup location, total and a status tag (Pending, Confirmed, Active, Completed, Cancelled).
- **FR-041** Cross-portal consistency. A status change by the owner is visible in the renter's list on next load; both portals read the same persisted record.
- **FR-042** Empty state per group when none ("No upcoming bookings").

### Earnings (owner)
- **FR-050** Earnings dashboard. Shows Completed rentals (count), Total revenue (sum of `total_price`, $) of completed rentals, and Pending requests (count), for the owner's cars.

### Platform
- **FR-060** Persistence. All listings, bookings and statuses persist server-side and survive page refresh.
- **FR-061** Reset. `POST /api/reset` restores `requirements/seed.json` exactly.

## 4. Domain model

Field names are snake_case exactly as in the supplied seed; API and client share these types.

**User**: `id` (`usr_N`), `name`, `email`, `role` (`owner`|`renter`), `avatar_url` (string).

**Car**: `id` (`car_NN`), `owner_id` → User, `title` (string ≤ 100), `brand` (1–40), `model` (1–40), `year` (int 1980–2027), `daily_rate` (int USD 1–10000), `cleaning_fee` (int USD 0–1000), `location` {`city`? (≤60), `state`? (≤30), `pickup_address` (req, 1–120), `pickup_instructions`? (≤500), `dropoff_rules`? (≤500)}, `specs` {`seats` (int 1–9, default 5), `fuel_type` (`Gasoline`|`Hybrid`|`Electric`), `transmission` (`Automatic`|`Manual`)}, `image_url` (http/https URL, req), `status` (`available`|`unavailable`).

**Booking**: `id` (`book_NNN`), `renter_id`, `car_id`, `start_date`, `end_date` (`YYYY-MM-DD`), `days`, `daily_rate`, `cleaning_fee`, `total_price` (int USD, snapshots computed at creation), `pickup_location` (snapshot of car `pickup_address`), `status` (`pending`|`confirmed`|`cancelled`), `created_at` (ISO UTC).

**Derived `display_status`** (never stored, computed at read time against today): `cancelled` → Cancelled; `pending` → Pending (even when dates passed); `confirmed` with `end_date <= today` → Completed; `confirmed` with `start_date <= today < end_date` → Active; otherwise Confirmed.

Money: whole US dollars as integers (seed convention; deviation from cents default is deliberate to preserve seed). Format `$280.00` (en-US, two decimals).

## 5. Business rules

- **Days** = (UTC midnight of end − UTC midnight of start) / 86 400 000; must be an integer ≥ 1. End date is the return day, not billed. Example: 2026-11-10→2026-11-13 = 3 days.
- **Total** = days × daily_rate + cleaning_fee (cleaning fee charged once). 3 × 85 + 25 = 280 → "$280.00"; 1 × 110 + 35 = 145; 3 × 140 + 40 = 460.
- **Past dates:** start_date ≥ today (today allowed); end_date > start_date. Date inputs set `min` accordingly.
- **Overlap** (half-open intervals): ranges [s1,e1) and [s2,e2) overlap iff `s1 < e2 && s2 < e1`. Back-to-back (e1 == s2) does not overlap. Example: confirmed 11-10→11-13 blocks 11-12→11-15 and 11-08→11-11; allows 11-13→11-15.
- **Conflict scope:** only `confirmed` bookings on the same car block a request or an approval.
- **Transitions:** `pending → confirmed` (approve), `pending → cancelled` (decline), `confirmed → cancelled` (cancel, only if end_date > today); `cancelled` terminal. Only the owner of the car may perform them.
- **Filtering:** search text = case-insensitive substring over title, brand, model; Make = case-insensitive equality on brand; Location keyword = case-insensitive substring over city, state, pickup_address; Max rate = `daily_rate <= max` (inclusive; empty = no limit; non-numeric/negative ignored in UI); Transmission equality. Empty filters are inactive.
- **Earnings:** completed = bookings on owner's cars with `display_status` Completed; revenue = Σ `total_price` of those; pending = count of `pending` bookings on the owner's cars.
- **Bookable car:** `status == available`.

Pure logic to unit-test in `shared/`: `countDays`, `calculateTotal`, `rangesOverlap`/conflict check, `validateBookingDates`, `getDisplayStatus`, status transition table, `filterCars`, `validateCarInput`, `computeEarnings`.

## 6. API and persistence contract

JSON, `Cache-Control: no-store`. Session: header `X-User-Id` (demo persona). Errors: `{ "error": { "code", "message", "fields"? } }`; 400 `VALIDATION_ERROR`, 401 `UNAUTHENTICATED`, 403 `FORBIDDEN`, 404 `NOT_FOUND`, 409 `BOOKING_CONFLICT` | `CAR_UNAVAILABLE` | `INVALID_TRANSITION`. Ids are prefix + next number (`car_04`, `book_305`) from existing ids. Server ignores client-sent derived fields.

| Method & path | Auth | Request → Response |
|---|---|---|
| `GET /api/health` | none | `200 { "status": "ok", "today": "YYYY-MM-DD" }` |
| `POST /api/reset` | none | restore seed → `200 { "status": "ok" }` |
| `GET /api/users` | none | `200 User[]` (persona switcher) |
| `GET /api/cars` | none | query `q`, `make`, `location`, `max_rate`, `transmission`, `fuel_type` → `200 Car[]` with `status=available` only; filters per §5 |
| `GET /api/cars/:id` | none | `200 CarDetail` = Car + `owner_name` + `confirmed_ranges: [{start_date,end_date}]`; unavailable cars returned (for deep links) with status shown; 404 if missing |
| `GET /api/owner/cars` | owner | `200 Car[]` own cars, all statuses |
| `POST /api/cars` | owner | body: `title?, brand, model, year, daily_rate, cleaning_fee, location{...}, specs{...}, image_url` → `201 Car` (status `available`) |
| `PATCH /api/cars/:id` | owner (own) | partial of the same fields plus `status` → `200 Car` |
| `POST /api/bookings` | renter | `{ car_id, start_date, end_date }` → `201 BookingView` |
| `GET /api/bookings` | any session | renter: own bookings; owner: bookings on own cars → `200 BookingView[]` newest `created_at` first |
| `POST /api/bookings/:id/approve` | owner (own car) | `200 BookingView` |
| `POST /api/bookings/:id/decline` | owner (own car) | `200 BookingView` |
| `POST /api/bookings/:id/cancel` | owner (own car) | `200 BookingView` |
| `GET /api/earnings` | owner | `200 { completed_rentals, total_revenue, pending_requests }` |

`BookingView` = Booking + `display_status` + `car: { id, title, image_url, brand, model, year }` + `renter: { id, name, email }`.

Persistence: JSON-file store; `db` document `{ users, cars, bookings }` identical in shape to `requirements/seed.json`. Reset copies seed exactly.

## 7. Primary journey

1. Renter Alex opens the catalog, sets Make = Tesla; only Tesla cars show.
2. Opens the Tesla Model Y, picks e.g. 2026-11-20 → 2026-11-23; breakdown shows 3 days, $85.00, $255.00, $25.00, **$280.00**.
3. Submits; success message; My Bookings shows the booking as Pending.
4. Switches to owner Sarah, opens Booking Requests, sees the request with Alex's name, clicks Approve; tag becomes Confirmed.
5. Switches to Alex; My Bookings shows Confirmed; after refresh it still does. Earnings, listings and statuses persist.

## 8. UI and non-functional behavior

- Responsive from 360px with no horizontal scroll; grid collapses to one column; header persona switcher usable on mobile.
- Pages: Catalog (`/`), Car details & checkout (`/cars/:id`), My Bookings (renter), My listings + add/edit form, Booking Requests, Earnings (owner). Navigation shows role-relevant links.
- All controls labeled, keyboard accessible, visible focus; status tags use text, not color alone.
- Loading, empty, error and success states for lists and mutations; buttons disabled while submitting; image `onError` fallback block with car title.
- Formats: USD `$85`/`$280.00`; dates shown like `Nov 10, 2026`; language English.

## 9. Resolved seed and traceability

**Seed (`requirements/seed.json`)**: supplied `input/seed.json` is compatible (Wheels2Go) and preserved unchanged for all supplied records and values (users usr_101/usr_102; cars car_01..car_03; booking book_301). Additions: `pickup_instructions` and `dropoff_rules` inside each car's `location` (supports FR-006), and bookings:
- `book_302` pending, car_02 (Ford Bronco), 2026-11-20→11-23, $365 — for TR-4 / approval.
- `book_303` confirmed, car_03, 2026-10-05→10-08, $460 — displays Completed; earnings = 1 completed, $460.
- `book_304` confirmed, car_02, 2026-11-01→11-04, $365 — displays Active.
Existing `book_301` (confirmed, Nov 10–13, Tesla) is Confirmed/upcoming and demonstrates the conflict rule. Earnings for owner at seed: completed 1, revenue $460, pending 1.

**Traceability**

| Requested capability / case | FR |
|---|---|
| Create listing with specs, image, location | FR-001–003, 006 |
| Edit, toggle availability, location setup | FR-004–007 |
| Grid catalog, cards, badges | FR-010 |
| Search & filters (make, location, max rate, transmission) | FR-011–012 |
| Date selection, price calculation | FR-020–022 |
| Owner queue, approve/decline, statuses | FR-030–035 |
| My Bookings with status tags | FR-040–042 |
| Earnings tracker | FR-050 |
| Persistence/reset | FR-060–061 |
| TR-1 (supplied) | FR-001, FR-010 |
| TR-2 (supplied) | FR-011 |
| TR-3 (supplied) | FR-020 |
| TR-4 (supplied) | FR-030, 031, 041 |

Derived checks (not in `acceptance.json`, for tests beyond the matrix): DC-1 overlapping request on car_01 for 2026-11-12→11-15 is rejected with the conflict message (FR-023); DC-2 back-to-back 11-13→11-15 is accepted (FR-021); DC-3 end ≤ start and past start are blocked (FR-022); DC-4 toggling a car unavailable hides it from the catalog (FR-005); DC-5 created listing and booking survive refresh (FR-060); DC-6 earnings show 1 / $460 / 1 at seed (FR-050); DC-7 empty-filter state (FR-012); DC-8 `POST /api/reset` restores seed (FR-061).

`acceptance_mode` is `provided`: `acceptance.json` holds TR-1..TR-4 verbatim from the brief matrix.

## 10. Assumptions and limitations

- Inactive brief sections (commented out: "//2" variant and QueueFlow) are not built; no QueueFlow entities (branches, tickets, staff) exist. Deferred: deleting listings, renter cancellation, seats/model filters beyond the API's optional `fuel_type`, a "Completed" stored status.
- The brief shows "$"; USD, whole-dollar rates.
- Completed is derived from confirmed + end date ≤ today, since no one is specified to mark completion.
- "Location" in TR-1 ("Airport Hub") maps to `pickup_address`; city/state are optional.
- Only confirmed bookings block dates; owners approving one of two overlapping pendings causes the other's approval to 409.
- Demo-persona switching is not real authentication.
- Unit tests are required (pricing, overlap, validation, transitions, filtering, earnings).
