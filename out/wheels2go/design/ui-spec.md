# Wheels2Go — UI Spec

Tokens: `design/tokens.css` (imported directly by the app) / `design/tokens.json`. All values below refer to token names.

## 1. Visual direction
"Clean automotive marketplace": light neutral canvas (`--color-bg`), white cards with `--shadow-card` and `--radius-md`, a dark ink header (`--color-header-bg`) and one teal accent (`--color-primary`) used only for primary actions, active nav and links. Hierarchy: page title (`--font-size-xl`, bold) → card title (`--font-size-lg`, bold) → price (bold, `--font-size-lg`) → metadata (`--font-size-sm`, `--color-text-muted`). Car imagery is the main visual: card images are 16:10, `object-fit: cover`, top-rounded. Status is always text plus color via status tokens (pending amber, confirmed green, cancelled red, completed blue, unavailable gray). Spacing scale: 16px inside cards, 24px between sections, 16px grid gap. Money `$1,234.00` (two decimals) in breakdowns/totals; `$85/day` on cards (no decimals when whole, else two decimals). No invented trust claims, ratings or reviews.

## 2. App shell
- Header (all screens, dark): brand link "Wheels2Go" (`data-testid="brand-link"`, to `/`), primary nav (role-dependent), then user area at right: avatar, name and role text (`data-testid="current-user"`, e.g. "Alex Rivera · Renter"), and the "Switch account" `<select>` (`data-testid="account-switcher"`, `aria-label="Switch account"`) whose options are the users, option label `"{name} ({Owner|Renter})"`, option value = user id (`usr_101`, `usr_102`). Changing it immediately switches scope, persists in localStorage and navigates to `/` (marketplace).
- Nav links (`data-testid="nav-marketplace"`, `nav-my-bookings`, `nav-my-listings`, `nav-booking-requests`, `nav-earnings`). Renter: Marketplace, My Bookings. Owner: Marketplace, My Listings, Booking Requests, Earnings. Active link has `aria-current="page"` and an underline in primary-on-dark (white text, 3px bottom border).
- Mobile (<768px): header wraps into two rows: row 1 brand + switcher; row 2 horizontally scrollable-free nav that wraps (flex-wrap). No hamburger.
- Content: centered, max `--width-content`, side padding `--space-4` (mobile) / `--space-5` (desktop). Narrow pages use `--width-narrow`/`--width-form`.
- Feedback: toasts container (`data-testid="toast"`, `role="status"`, `aria-live="polite"`) fixed top-right below header (full-width minus 16px on mobile), success (green tokens) or error (red tokens), auto-dismiss not required; also a dismiss button "Dismiss". Inline success/error messages in forms use their own testids below.
- Demo label: small muted text in footer "Demo accounts — no real authentication." (`data-testid="demo-note"`).

## 3. Screens and states
Routes: `/` marketplace; `/cars/:id` details; `/my-bookings` (renter); `/owner/listings`; `/owner/listings/new`; `/owner/listings/:id/edit`; `/owner/requests`; `/owner/earnings`. Owner-only routes visited as renter (and vice versa) show `data-testid="access-denied"` text "This page is not available for your account." with a link to Marketplace.

### `/` Marketplace (both roles)
- Page title "Find a car" (h1). Filter panel (white card): six controls in a responsive grid (desktop 1440: 3 columns × 2 rows inside the 1200 content; mobile 390: 1 column). Below it a row: result count (`data-testid="result-count"`, "3 cars") and "Clear filters" button (`data-testid="clear-filters"`).
- Grid: `repeat(auto-fill, minmax(var(--width-card-min), 1fr))`, gap 16px → 3 columns at 1440, 1 column at 390/360.
- Card: image, title line "Make Model Year", availability badge overlaid top-left of image, price "$85/day", chips for fuel, transmission, "5 seats", and a location badge (pin text "Miami International Airport Hub - Zone B · Miami"). Whole card is a link ("View details") to `/cars/:id`.
- Loading: `data-testid="loading"` "Loading cars…". Error: `data-testid="error-state"` with message and "Retry" button (`data-testid="retry"`). Empty (no match): `data-testid="empty-state"` "No cars match your filters" + Clear filters button (`data-testid="empty-clear-filters"`).

### `/cars/:id` Car details
- Back link "Back to marketplace". Desktop: two columns — left (flex 1): large image (16:10), title h1, badges, spec list (year, fuel, transmission, seats, daily rate, cleaning fee), pickup location, address and instructions; right: sticky booking panel width `--width-booking-panel`. Mobile: single column, booking panel after details.
- Booking panel (renter): start date and end date inputs, live price breakdown, "Request booking" button (full width). Owner: note instead. Unavailable car: disabled panel with message.
- 404 car: `data-testid="not-found"` "Car not found".

### `/my-bookings` (renter)
Title "My Bookings". Sections in order, each with a heading and count: Upcoming, Active, Completed, Cancelled (`data-testid="group-upcoming"`, `group-active`, `group-completed`, `group-cancelled`); empty groups show muted "No bookings" text. Booking cards (single column list, max `--width-narrow` is NOT applied; full content width) show thumbnail, car title, dates, days, total, pickup location, status badge, instructions (confirmed only), and "Cancel booking" for pending/confirmed not started. Empty overall: `data-testid="empty-state"` "You have no bookings yet" with link "Browse cars".

### `/owner/listings`
Title "My Listings", "Add listing" button/link (`data-testid="add-listing"`) to `/owner/listings/new`. List of own cars as rows/cards (desktop: image left, details center, actions right; mobile: stacked) with availability badge and actions Edit, "Make unavailable"/"Make available", Delete. Empty: `empty-state` "You have no listings yet".

### `/owner/listings/new` and `/:id/edit`
Form card width `--width-form`. Title "Add listing"/"Edit listing". Buttons "Save listing" (submit) and "Cancel" (link back). On success navigate to `/owner/listings` and show toast "Listing created"/"Listing updated". Field errors display under each field.

### `/owner/requests`
Title "Booking Requests". Filter tabs (`role="tablist"`-free simple buttons with `aria-pressed`): All, Pending, Confirmed, Cancelled, Completed with counts not required. List of booking cards (pending first, then newest first). Each card: car title, renter name + email, dates, days, total, pickup location, status badge, and for pending only "Approve" and "Reject". Empty for tab: `empty-state` "No booking requests".

### `/owner/earnings`
Title "Earnings". Four stat tiles in a row (desktop 4 columns, mobile 1–2 columns): Completed rentals, Total revenue, Pending requests, Expected from confirmed. Below: "Revenue by car" table (car, completed rentals, revenue) — on mobile the table stays inside a wrapper with `overflow-x:auto`; page itself has no horizontal scroll. Empty note when no completed rentals: "No completed rentals yet."

## 4. Components
- **Button**: height `--control-height`, radius `--radius-sm`, bold. Primary (teal bg, white text), secondary (white, border), danger (`--color-danger` bg, white text). Disabled: 50% opacity, `cursor:not-allowed`, `disabled` attribute. Focus ring via global `:focus-visible`.
- **Field**: visible `<label>` above control, control height `--control-height`, border `--color-border`, radius `--radius-sm`; error text `--color-danger` below with `role="alert"` and control `aria-invalid="true"`, linked via `aria-describedby`.
- **StatusBadge** (`data-testid="status-badge"`, `data-status="pending|confirmed|cancelled|completed"`): pill, text capitalized ("Pending"). Availability badge (`data-testid="availability-badge"`, `data-status="available|unavailable"`): "Available" uses confirmed tokens, "Unavailable" uses unavailable tokens.
- **CarCard**, **BookingCard**, **PriceBreakdown**, **Toast**, **ConfirmDialog**: native `<dialog>`-style modal (`role="alertdialog"`, `aria-modal`, `aria-labelledby`), focus moves to Cancel button on open, Escape closes. Buttons: `data-testid="confirm-yes"` (label "Confirm") and `data-testid="confirm-no"` (label "Keep"/"Cancel" per context: use "Go back"). Used for Delete listing, Reject, Cancel booking.
- **StatTile**, **Tabs**, **Header/AccountSwitcher**.

## 5. Binding test contract
Language: English. Selectors by `data-testid` unless noted. Repeated entities carry `data-id` (car id like `car_01`, booking id like `book_301`) on the same element as their testid.

### Marketplace
- `car-card` (`data-id` = car id): contains `car-title` ("Tesla Model Y 2023"? — shows title text as stored: seed car_01 shows "Tesla Model Y Long Range 2023"; cars created without a title show "{Make} {Model} {Year}"), `car-price` ("$85/day"), `car-location` (text includes pickup address and city, e.g. "Airport Hub"), `car-fuel` ("Electric"), `car-transmission` ("Automatic"), `car-seats` ("5 seats"), `availability-badge`. Card link `car-link` (navigates to `/cars/:id`). Image `car-image` (`alt` = title); on error replaced by a placeholder with `data-testid="image-fallback"`.
- Filters (all inside `data-testid="filters"`, each with visible label): `filter-make` text "Make / Brand"; `filter-model` text "Model"; `filter-location` text "Location keyword"; `filter-max-price` `type="number"` `min="0"` `step="any"` label "Max daily price ($)"; `filter-transmission` `<select>` options values `""` ("Any"), `Automatic`, `Manual`; `filter-fuel` `<select>` options `""` ("Any"), `Gasoline`, `Hybrid`, `Electric`. Filtering applies on input (no submit button). Invalid max price (negative) shows `role="alert"` text "Max price must be a positive number" (`data-testid="filter-max-price-error"`) and the max filter is ignored.
- `result-count`: "{n} car" / "{n} cars" (e.g. "1 car"). `clear-filters` resets all six controls. Seed expectation: unfiltered 3 cars; Make "Tesla" → 1; Make "Tesla" + Max 90 → only Tesla Model Y.

### Car details
- `car-detail` root with `data-id`; `detail-title`, `detail-price`, `detail-cleaning-fee` ("$25.00"), `detail-location` (address + city, state), `detail-instructions`, `detail-seats`, `detail-fuel`, `detail-transmission`, `availability-badge`.
- `booking-panel` containing: `booking-start` (`type="date"`, label "Start date", `min` = today), `booking-end` (`type="date"`, label "End date", `min` = today), `price-breakdown` with `price-days` ("3 days"; "1 day" singular), `price-daily-rate` ("$85.00"), `price-subtotal` ("$255.00"), `price-cleaning-fee` ("$25.00"), `price-total` ("$280.00"). Before valid dates are chosen, the breakdown shows placeholder "—" in `price-days`, `price-subtotal`, `price-total`, and rate/fee still show car values. Submit `booking-submit` (text "Request booking").
- Date errors `booking-error` (`role="alert"`) with exact texts: "Select a start and end date", "End date must be after start date", "Start date cannot be in the past", "Rentals are limited to 30 days", conflict "These dates conflict with an existing confirmed booking for this car". Client-side date errors display as soon as both dates are set and invalid; submit is blocked (button remains enabled so submit also shows the error). Conflict error comes from the server on submit; no booking is created.
- Success: `booking-success` (`role="status"`) text "Booking request sent. Status: Pending." with link `go-my-bookings` "View My Bookings" to `/my-bookings`; dates remain.
- Unavailable car: `booking-unavailable` text "This car is currently unavailable"; `booking-submit` disabled. Owner active: `booking-owner-note` text "Owners cannot book cars. Switch to a renter account to book." and no inputs.
- TR-5 flow: renter opens `/cars/car_01`, sets 2026-11-11 → 2026-11-14, submits → conflict error in `booking-error`.

### My Bookings
- `booking-card` (`data-id`, `data-status` = effective status) with `booking-car` (title), `booking-dates` ("Dec 1, 2026 – Dec 4, 2026" — format `MMM D, YYYY – MMM D, YYYY`), `booking-days` ("3 days"), `booking-total` ("$280.00"), `booking-pickup`, `booking-instructions` (confirmed only), `status-badge` ("Pending"/"Confirmed"/"Cancelled"/"Completed"), `booking-cancel` (button "Cancel booking", pending/confirmed not started only). Cancel opens ConfirmDialog (`confirm-yes` "Confirm"); result badge Cancelled, toast "Booking cancelled".
- Seed: book_301 appears in group-upcoming as Confirmed ($280.00, Nov 10, 2026 – Nov 13, 2026).

### Owner Booking Requests
- Tabs: `tab-all`, `tab-pending`, `tab-confirmed`, `tab-cancelled`, `tab-completed` (buttons, `aria-pressed`). `booking-card` as above plus `booking-renter` ("Alex Rivera"), `booking-renter-email` ("alex.rivera@example.com"), `booking-approve` ("Approve"), `booking-reject` ("Reject"), only present on pending. Reject → ConfirmDialog → `confirm-yes` → Cancelled badge. Approve → badge Confirmed, toast "Booking confirmed" (`toast`). Approve conflict → error toast with the conflict message, status stays Pending.

### Owner Listings & form
- `listing-row` (`data-id`) with `listing-title`, `listing-price`, `availability-badge`, buttons `listing-edit` ("Edit"), `listing-toggle` (text "Make unavailable" when available / "Make available" when unavailable), `listing-delete` ("Delete", opens ConfirmDialog; success toast "Listing deleted"; 409 shows error toast with server message).
- Form `listing-form`; fields (labels exactly): `field-brand` "Make" (text), `field-model` "Model" (text), `field-year` "Year" (number), `field-fuel` "Fuel type" (select: Gasoline, Hybrid, Electric), `field-transmission` "Transmission" (select: Automatic, Manual), `field-seats` "Seats" (number), `field-daily-rate` "Daily rate ($)" (number, step 0.01), `field-cleaning-fee` "Cleaning fee ($)" (number, step 0.01), `field-image-url` "Image URL" (url), `field-city` "City" (text), `field-state` "State (optional)" (text), `field-pickup-address` "Pickup address" (text), `field-instructions` "Pickup instructions" (textarea), `field-title` "Listing title (optional)" (text). Each has error element `{testid}-error` (`role="alert"`), e.g. `field-brand-error`. Submit `listing-save` ("Save listing"). Defaults for new form: fuel Gasoline, transmission Automatic, seats 5, year/rates/fees empty, cleaning fee empty (required). Required-field error text: "{Label} is required"-style messages from the server/validation (tests match by presence of `*-error`, not by exact text, except brand: "Make is required").
- TR-1 values: brand Tesla, model Model Y, year 2023, daily rate 85, cleaning fee 25, seats 5, Electric, Automatic, image URL any https URL, city Miami, pickup address "Airport Hub", instructions any text. After save: toast "Listing created"; a `listing-row` shows "Tesla Model Y 2023"; the marketplace shows a `car-card` with `car-price` "$85/day" and `car-location` containing "Airport Hub".

### Earnings
- `stat-completed` (value only, e.g. "0"), `stat-revenue` ("$0.00"), `stat-pending` ("0"), `stat-confirmed-revenue` ("$280.00" in seed). Table `earnings-table` rows `earnings-row` (`data-id` car id) with cells for title, completed count, revenue. `earnings-empty` "No completed rentals yet." when completed is 0.
- Labels visible: "Completed rentals", "Total revenue", "Pending requests", "Expected from confirmed".

### Mutations and role transitions
- Switching account: no data mutation; refetches. Booking request creates `pending` booking (visible in both views). Approve/reject/cancel/toggle/create/edit/delete mutate server data; all views read the same API. Reset is API-only (`POST /api/reset`), no UI control.
- Primary journey testids: `filter-make` "Tesla" → `car-card` count 1 → `car-link` → `booking-start`/`booking-end` → `price-total` "$280.00" → `booking-submit` → `booking-success` → `nav-my-bookings` → `booking-card` badge "Pending" → `account-switcher` select `usr_101` → `nav-booking-requests` → `booking-approve` → badge "Confirmed" → switch `usr_102` → `nav-my-bookings` → badge "Confirmed" → reload → still Confirmed.

## 6. Visual evidence plan
Targets in `visual-plan.json`:
1. `catalog` — renter marketplace, ready when at least one `car-card` is visible with loaded seed (3 cars) and `result-count` shows "3 cars". Check: filters grid, 3-column (desktop) / 1-column (mobile) cards, readable price and badges, images or fallback placeholders, no horizontal overflow.
2. `booking` — `/cars/car_01` as renter with 2026-12-01 → 2026-12-04 entered; ready when `price-total` reads "$280.00". Check: breakdown legibility, sticky panel on desktop, panel stacked under details on mobile, primary button prominent.
3. `requests` — owner `/owner/requests` showing the seed confirmed booking; ready when `booking-card` `book_301` is visible with Confirmed badge. Check: badge contrast, renter info, card layout at 390px.
Quality criteria: no clipped/overlapping text, consistent spacing, status colors distinct and labeled, focus-independent legibility, header switcher usable at 390px.

## 7. Assumptions and limitations
- Contrast pairs are listed in `tokens.json` (`contrastPairs`); they use standard dark-on-light combinations expected to meet WCAG AA, but ratios were not measured in this stage.
- Seed car titles are used as-is on cards (e.g. "Tesla Model Y Long Range 2023"); tests match by substring "Tesla" / "Model Y".
- Remote images may fail offline; fallback placeholder shown. No imagery is bundled.
- Date format display `MMM D, YYYY`; inputs use native `type="date"` (values `YYYY-MM-DD`).
- No hamburger menu; header wraps on mobile. Account switch navigates to `/`.
- Price "$85/day" on cards omits decimals for whole values.
