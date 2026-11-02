# Wheels2Go — Requirements

## 1. Product and scope
Wheels2Go is a peer-to-peer car rental marketplace. **Owners** list cars, manage availability, review booking requests and track earnings. **Renters** browse and filter cars, price a rental, submit a booking request and track bookings.

Exclusions: real authentication, payments, messaging, reviews, maps, image upload (image is a URL only), email notifications. Currency is USD (`$1,234.00`, two decimals). Dates are ISO `YYYY-MM-DD` calendar dates, displayed in a readable form.

Integration/auth: none required. The brief asks only for a demo account switcher; this is a labeled local demo boundary (no passwords, no sessions security). Persistence is server-side (API + file/DB store) so owner and renter views share data.

## 2. Roles and capabilities
Demo personas (from seed): Owner Sarah Jenkins (`usr_101`), Renter Alex Rivera (`usr_102`). A persistent header switcher (labeled control "Switch account") changes the active user; the active user persists across refresh (localStorage). Default on first load: Renter.

| Capability | Owner | Renter |
|---|---|---|
| Browse marketplace, filter, view car details | yes | yes |
| Book a car | no (cannot book own cars) | yes |
| Create/edit/toggle/delete own listings | yes | no |
| View/approve/reject booking requests on own cars | yes | no |
| Earnings dashboard | yes | no |
| My Bookings, cancel own bookings | no | yes |

Owner navigation: Marketplace, My Listings, Booking Requests, Earnings. Renter navigation: Marketplace, My Bookings. API enforces role/ownership (403 otherwise) using header `X-User-Id`.

## 3. Functional requirements

### Account switching
- **FR-001** Given the app loads, When no user was chosen, Then Renter Alex Rivera is active and the header shows name and role. When I choose the Owner in "Switch account", Then navigation and data change to owner scope instantly and persist after refresh.

### Listing management (Owner)
- **FR-010** Given Owner on My Listings, When I choose "Add listing", fill all required fields validly and save, Then the car is created with status `available`, a success message shows, and it appears in My Listings and (as available) in the marketplace immediately.
- **FR-011** Given invalid/missing required input, When I save, Then field-level error messages appear next to fields (labeled, `role="alert"`) and nothing is saved. Rules in section 4.
- **FR-012** Given an own listing, When I choose Edit and save changes, Then the changes show in My Listings, marketplace and car details. Existing bookings keep their snapshotted prices.
- **FR-013** Given an own listing, When I toggle availability, Then status flips between `available` and `unavailable`; unavailable cars remain visible in the marketplace with an "Unavailable" badge and cannot be booked.
- **FR-014** Given an own listing, When I choose Delete and confirm, Then it is removed from everywhere. If the car has pending or confirmed bookings, deletion is refused with a clear error (409) — assumption to prevent inconsistent bookings. Cancelled/completed bookings keep a snapshot (see section 4) so history stays readable.
- **FR-015** Listing form includes pickup location (city, state, pickup address) and pickup instructions; these are shown to renters on car details and in the booking panel.

### Marketplace and filtering (Renter/Owner)
- **FR-020** Given cars exist, When I open the marketplace, Then a responsive grid of cards shows: image (with fallback placeholder if URL fails), Make Model Year, daily rate (`$85/day`), fuel type, transmission, seats, location badge (pickup address and city), and availability badge (Available/Unavailable).
- **FR-021** Given the filters Make/Brand, Model, Location keyword, Max daily price, Transmission (Any/Automatic/Manual), Fuel type (Any/Gasoline/Hybrid/Electric), When I change any of them, Then results update immediately without a page reload, all filters combined with AND. A "Clear filters" control resets them and a result count is shown.
- **FR-022** Given filters match nothing, Then an empty state "No cars match your filters" with Clear filters action is shown.
- **FR-023** Given data is loading, Then a loading state is shown; given API failure, an error state with Retry.
- **FR-024** Given a card, When I select it, Then a car details view shows the full info, pickup address and instructions, and (for renters) the booking panel.

### Booking and pricing (Renter)
- **FR-030** Given a car details view as Renter, When I choose start and end dates, Then a live price breakdown shows: days, daily rate, rental subtotal, cleaning fee, total.
- **FR-031** Given valid dates and an available car, When I submit "Request booking", Then a booking with status `pending` is created with snapshotted daily rate, cleaning fee, days, total and pickup location; a success message shows with link to My Bookings.
- **FR-032** Given invalid dates, When I submit (or when dates change), Then clear errors show: end not after start ("End date must be after start date"), past start ("Start date cannot be in the past"), missing dates. Date inputs also set `min` to today.
- **FR-033** Given an overlapping confirmed booking for the car, When I submit, Then it is blocked with "These dates conflict with an existing confirmed booking for this car" (409) and nothing is created.
- **FR-034** Given an unavailable car, Then the booking panel is disabled with the message "This car is currently unavailable" and the API returns 409.
- **FR-035** Given an Owner is active, Then the booking panel is replaced by a note that owners cannot book (API 403 for owner bookings). An owner also cannot book their own car.

### Booking management (Owner)
- **FR-040** Given Owner on Booking Requests, Then all bookings for own cars are listed (newest first) with car, renter name/email, dates, days, total, pickup location, and status badge; filter tabs: All, Pending, Confirmed, Cancelled, Completed. Pending requests are highlighted first.
- **FR-041** Given a pending booking, When I click "Approve", Then it becomes `confirmed` if no overlap with another confirmed booking exists; otherwise approval fails with the conflict error and the booking stays pending. The change shows immediately in owner view and in renter My Bookings.
- **FR-042** Given a pending booking, When I click "Reject", Then it becomes `cancelled` (shown to renter as Cancelled).
- **FR-043** Only owners of the car may approve/reject, and only from `pending` (API 403/409 otherwise). The UI shows no approve/reject buttons on non-pending bookings.

### Renter bookings
- **FR-050** Given Renter on My Bookings, Then own bookings are grouped into Upcoming (pending/confirmed, start in future), Active (confirmed, today within [start, end)), Completed, and Cancelled, each with status badge, car, dates, price breakdown total and pickup location/instructions (instructions visible for confirmed bookings).
- **FR-051** Given a pending or confirmed booking that has not started, When Renter clicks "Cancel booking" and confirms, Then status becomes `cancelled`, reflected in owner view, and the dates are freed.
- **FR-052** Given a confirmed booking whose end date is before today, Then the effective status is `completed` (derived, see section 5) in both dashboards.

### Earnings (Owner)
- **FR-060** Given Owner on Earnings, Then it shows: total completed rentals, total revenue earned (sum of total_price of completed bookings), number of pending requests, and a revenue summary: revenue from completed, expected revenue from confirmed upcoming/active, and a per-car table (car, completed count, revenue). Values are `0` / `$0.00` when none, with an empty-state note.

### Persistence and reset
- **FR-070** Given any create/update/delete, When I refresh, Then data persists (server store). Initial state equals the resolved seed.
- **FR-071** `POST /api/reset` restores the seed exactly (active-user selection in localStorage is not part of data).

## 4. Domain model
**User**: `id`, `name`, `email`, `role` (`owner`|`renter`), `avatar_url`.
**Car**: `id` (`car_NN`), `owner_id`, `title` (optional input; default `"{brand} {model} {year}"`), `brand` (req, 1–40), `model` (req, 1–40), `year` (int 1980 – current year+1), `daily_rate` (number >0, ≤10000, max 2 decimals), `cleaning_fee` (number ≥0, ≤1000), `location {city (req), state (optional), pickup_address (req)}`, `pickup_instructions` (req, 1–500), `specs {seats (int 1–12), fuel_type (Gasoline|Hybrid|Electric), transmission (Automatic|Manual)}`, `image_url` (req, http/https URL), `status` (`available`|`unavailable`).
**Booking**: `id` (`book_NNN`), `renter_id`, `car_id`, `start_date`, `end_date`, `days`, `daily_rate`, `cleaning_fee`, `total_price` (snapshots), `pickup_location` (snapshot of pickup address), `status` (`pending`|`confirmed`|`cancelled`|`completed`), `created_at` (ISO UTC). API booking responses additionally embed `car` snapshot summary (title, image_url, owner_id) and `renter` (name, email); if the car was deleted, a stored `car_title` snapshot keeps history readable.
Relations: Owner 1–N Car; Car 1–N Booking; Renter 1–N Booking.

## 5. Business rules
- **Days** = whole calendar days between start and end (end − start; exclusive of end date). 2026-12-01→2026-12-04 = 3 days. Minimum 1 day. No timezone conversion: dates are plain calendar dates; "today" is the browser/server local date at action time (UTC on the server).
- **Total** = days × daily_rate + cleaning_fee. Money rounded to 2 decimals (half up). Example: 3 × 85 + 25 = **$280.00**; 1 × 110 + 35 = $145.00; 2 × 19.99 + 5 = $44.98.
- **Date validation**: start ≥ today (today allowed); end > start; both valid `YYYY-MM-DD`. Past start → error. Max rental length 30 days (assumption; error "Rentals are limited to 30 days").
- **Overlap**: ranges are half-open `[start, end)`. A and B overlap iff `A.start < B.end && B.start < A.end`. Same-day turnover (A.end = B.start) is NOT a conflict. Only `confirmed` (and effectively-completed confirmed) bookings of the same car block; pending bookings do not block each other, but approval re-checks conflicts. Example: confirmed 11-10→11-13; request 11-11→11-14 conflicts; 11-13→11-15 does not; 11-07→11-10 does not.
- **Effective status**: stored `confirmed` with `end_date < today` is presented as `completed` (computed on read, applied identically in all views, earnings, and conflict logic). Stored pending bookings whose start has passed are still pending (owner may reject).
- **Transitions**: pending→confirmed (owner), pending→cancelled (owner reject or renter cancel), confirmed→cancelled (renter, before start only), confirmed→completed (derived). cancelled and completed are terminal.
- **Filters**: Make and Model: case-insensitive substring on `brand`/`model`; Location keyword: case-insensitive substring on city, state, or pickup_address; Max price: `daily_rate <= max` (blank = none; invalid/negative treated as an input error); Transmission/Fuel exact match, "Any" = no filter. Example: Make "tesla" + Max 90 → Tesla Model Y ($85) only.
- **Earnings**: completed count = effective-completed bookings on own cars; revenue = sum of their `total_price`; pending count = pending bookings on own cars.
- **Unit-testable pure logic**: days/total calculation, date validation, overlap detection, effective status, filter function, earnings aggregation, listing validation.

## 6. API and persistence contract
JSON; errors `{ "error": { "code": string, "message": string, "fields"?: {field: message} } }` with 400 (validation), 403, 404, 409. Active user passed via `X-User-Id`. Shared TypeScript types for User/Car/Booking/etc. are used by server and client.

- `GET /api/health` → `{ "ok": true }`.
- `POST /api/reset` → restores seed exactly; `{ "ok": true }`.
- `GET /api/users` → `User[]` (for the switcher).
- `GET /api/cars` → `Car[]` (all, including unavailable). Filtering is client-side or optional query params.
- `GET /api/cars/:id` → `Car` (404 if missing).
- `POST /api/cars` (owner) body: Car fields without `id`, `owner_id`, `status` → 201 `Car`; 400 with `fields`.
- `PUT /api/cars/:id` (owner of car) body: same fields plus optional `status` → `Car`.
- `PATCH /api/cars/:id/availability` (owner of car) body `{ "status": "available"|"unavailable" }` → `Car`.
- `DELETE /api/cars/:id` (owner of car) → 204; 409 if pending/confirmed bookings.
- `GET /api/bookings` → bookings scoped to the active user (renter: own; owner: on own cars), with effective status, embedded `car` and `renter`.
- `POST /api/bookings` (renter) body `{ car_id, start_date, end_date }` → 201 `Booking` (pending); 400 dates, 404 car, 409 unavailable/conflict, 403 owner.
- `PATCH /api/bookings/:id/status` body `{ "status": "confirmed"|"cancelled" }` → `Booking`. Owner of car: confirm/reject pending; renter owner of booking: cancel pending/confirmed pre-start; other → 403/409.
- `GET /api/earnings` (owner) → `{ completed_rentals, total_revenue, pending_requests, confirmed_revenue, by_car: [{car_id,title,completed_rentals,revenue}] }`.

Persistence: server-side store initialized from the resolved seed on first start; survives restarts/refresh; reset rewrites it.

## 7. Primary journey
See `product.json`. Renter filters Tesla, opens Model Y, selects 2026-12-01→12-04, sees $280.00, submits → Pending in My Bookings. Owner switches account, approves in Booking Requests → Confirmed. Renter switches back, sees Confirmed. Refresh retains everything. Both dashboards read the same API data, so no manual sync is required; switching account refetches.

## 8. UI and non-functional
- Responsive from 360px (no horizontal scroll; grid 1 column on mobile, 2–3 on larger); modern, premium look with consistent typography, spacing, and colors.
- All inputs have visible labels; all controls keyboard-operable with visible focus; buttons have text/aria-labels; status badges use text plus color (Pending amber, Confirmed green, Cancelled red/gray, Completed blue).
- Loading, empty, error, and success states (toast/inline `role="status"`) for lists and mutations. Destructive actions (delete, cancel, reject) ask for confirmation.
- Stable test hooks: `data-testid` on car cards (`car-card`), filters (`filter-make`, `filter-model`, `filter-location`, `filter-max-price`, `filter-transmission`, `filter-fuel`), `account-switcher`, price breakdown (`price-days`, `price-daily-rate`, `price-subtotal`, `price-cleaning-fee`, `price-total`), `booking-card`, `status-badge`, approve/reject buttons.
- A README with run instructions and demo accounts is required deliverable.

## 9. Resolved seed and traceability
`requirements/seed.json` = `input/seed.json` (2 users, 3 cars, 1 confirmed booking `book_301` Miami Tesla 2026-11-10→11-13, $280) with all original records and values preserved. The only addition is `pickup_instructions` on each of the 3 cars, because the brief requires this field on every listing. The seed is compatible with the brief (no mismatch). No completed booking is added, so Earnings initially shows 0 completed rentals/$0.00 revenue and $280.00 expected from confirmed (this is intentional to preserve the original dataset).

Traceability (all acceptance cases are supplied, mode `provided`):
| Source | FR |
|---|---|
| TR-1 listing creation | FR-010, 011, 015, 020 |
| TR-2 search/filter | FR-021, 022 |
| TR-3 pricing | FR-030 |
| TR-4 approval | FR-031, 040, 041, 050 |
| TR-5 conflicts | FR-033, 041 |
| TR-6 persistence | FR-070, 010, 031 |
| Roles + switcher | FR-001, FR-035 |
| Edit/toggle/delete | FR-012, 013, 014 |
| Reject/status lifecycle | FR-042, 043, 051, 052 |
| Earnings | FR-060 |
| Validation/error states | FR-011, 023, 032, 034 |
| Seed/reset | FR-070, 071 |
Derived checks (not supplied): 30-day limit, same-day turnover allowed, owner cannot book, delete blocked with active bookings, renter cancellation, empty state.

## 10. Assumptions and limitations
- Demo switcher is not authentication; `X-User-Id` is trusted.
- Brief's commented-out first section mentions "Airport Hub" as location; in the form this is entered as the pickup address (city also required).
- Cancel by renter, 30-day max, delete-blocking and effective-completed derivation are minimal assumptions needed for a consistent lifecycle.
- Owners cannot manually mark completion; completion happens by date.
- Image URLs are remote (Unsplash); a fallback placeholder is shown offline/broken.
- Unit tests are required (pricing, dates, overlap, filters, validation, earnings).
