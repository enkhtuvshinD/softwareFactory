# QueueFlow — UI Spec

Active brief: section `#3` QueueFlow (Wheels2Go sections are commented out and ignored). Tokens: `design/tokens.json` / `design/tokens.css` (imported directly by the app). All colours, spacing, radii below refer to token names.

## 1. Visual direction
"Calm operations console": minimal SaaS dashboard, light neutral canvas (`--color-bg`) with white cards (`--color-surface`, `--radius-md`, `--shadow-card`, 1px `--color-border`), a dark navy sidebar/topbar (`--color-nav-bg`) and a single teal accent (`--color-primary`) for primary buttons, active nav and links. System font only. Hierarchy: page title `--font-size-xl` bold; card titles `--font-size-lg`; body `--font-size-md`; meta `--font-size-sm` in `--color-text-muted`. Ticket numbers use `--font-mono`, bold. Spacing in `--space-*`; card padding `--space-5` (desktop) / `--space-4` (mobile); gap between cards `--space-4`. One primary action per card (filled teal), secondary = outlined, destructive = outlined/filled with `--color-danger`.

Status badges (pill, `--radius-pill`, `--font-size-sm`, medium weight) always show **icon + text**, never colour alone:
Waiting ◔ (`status-waiting`), Called ▲ (`status-called`), Serving ● (`status-serving`), Completed ✓ (`status-completed`), Cancelled ✕ (`status-cancelled`), No-Show ⊘ (`status-no-show`). Badge text is exactly: `Waiting`, `Called`, `Serving`, `Completed`, `Cancelled`, `No-Show`. Appointment badges: `Scheduled`, `Cancelled`, `Converted`.

No imagery. Do not invent trust claims or integrations.

## 2. App shell
- **Topbar** (all authenticated screens, sticky, height 56px, `--color-nav-bg`): brand "QueueFlow" (left), demo clock `UTC HH:MM` (`clock-now`), and the **persona switcher** (right): a labelled native `<select>` "Demo account" (`persona-switcher`) listing 7 users as `Name — Role` (e.g. `Emma Brown — Customer`), option value = user id (`usr_202`…). Changing it stores `queueflow.userId`, and navigates to the role landing page (`/customer`, `/staff`, `/admin`). Next to it `current-user` shows `Emma Brown · Customer`. A visible notice "Demo accounts – no passwords" is in the footer.
- **Navigation** per role: sidebar 232px (`--width-sidebar`) on ≥1024px; below 1024px a horizontally scrollable-free tab bar under the topbar that wraps (flex-wrap) into up to 2 rows; every item min 44px tall. Active item = `--color-nav-active-bg` + `aria-current="page"`.
  - Customer: `nav-book` "Book" → `/customer`; `nav-services` "Services" → `/customer/services`; `nav-tickets` "My Tickets" → `/customer/tickets`; `nav-history` "History" → `/customer/history`.
  - Staff: `nav-desk` "Queue Desk" → `/staff`; `nav-display` "Queue Display" → `/display?branchId=<own branch>`.
  - Admin: `nav-dashboard` "Dashboard" → `/admin`; `nav-monitor` "Monitor" → `/admin/monitor`; `nav-branches` "Branches" → `/admin/branches`; `nav-services-admin` "Services" → `/admin/services`; `nav-staff-admin` "Staff" → `/admin/staff`.
- **Content**: max width `--width-content` (1200px), centred, padding `--space-5` (≥768px) / `--space-4`. Forms max `--width-form`.
- **Footer**: `demo-reset` button "Reset demo data" (confirm dialog → `POST /api/reset`, then reload data) and the "Demo accounts" note.
- **Display screen `/display`** is public: no sidebar and no persona switcher; a minimal dark header with branch name.
- Unknown route → "Page not found" with link to role landing page. Opening a route of another role (e.g. customer at `/admin`) shows `forbidden-state` "You don't have access to this page" with a link to the role's landing page (no API data requested).
- Global feedback: `toast` (role="status", aria-live polite, bottom-centre, auto-dismiss 5s, success tone) and per-form `form-error` (role="alert", `--color-danger` on `--color-danger-bg`, with icon) placed at the top of the form/card where the action occurred; entered values are kept. Every data view has loading (`loading-state`, skeleton or "Loading…" with `aria-busy`), empty and error (`error-state` with `retry` button "Retry") states. Buttons disable and show "…" while a request is in flight.
- Dialogs (`confirm-dialog`, role="dialog" aria-modal, width `--width-dialog`, focus trapped, Esc = cancel): title, message, `confirm-yes` (label "Confirm"), `confirm-no` (label "Keep").
- Time formatting: `HH:MM` (24h UTC). Durations: `15 min`. Dates `YYYY-MM-DD`. Counter: `Counter 2`.

## 3. Screens and states

### 3.1 `/customer` — Book (customer)
Purpose: see branches, generate walk-in ticket or book appointment.
- **Desktop 1440×900**: sidebar + content (1200). Top row: page title "Book a visit". Below, a 2-column grid: left (flex 1) list of `branch-card`s (one per active branch: name, address, hours `09:00–17:00`, offered services as chips, `branch-waiting-count` "3 waiting"); right (width `--width-form`) the booking card. Selecting a branch card also sets the form's branch.
- **Mobile 390×844**: single column: booking card first, branch cards below.
- Booking card fields in order: Branch select, Service select (only active services offered by the branch; disabled until branch chosen), mode radio group "Visit type": "Walk-in Queue" / "Scheduled Appointment"; when appointment: Date input and slot grid (3 columns desktop, 2 columns ≤480px); primary button.
- Success (walk-in): the card swaps to `ticket-result` (large mono ticket number, status badge, position, wait, buttons "View My Tickets" → `/customer/tickets` and "Book another"). Success (appointment): toast "Appointment booked for YYYY-MM-DD at HH:MM" and `appointment-result` card with date, time, counter; slot list refreshes.
- Errors via `form-error` using the server message (e.g. closed, duplicate, slot unavailable, past date). Empty: "No branches available" / "No available slots".

### 3.2 `/customer/services`
Read-only list of active services as cards: `service-card` (name, description, `15 min`, category chip). Grid 3 cols desktop, 1 col mobile.

### 3.3 `/customer/tickets` — My Tickets
Auto-refreshes every ≤2 s (polling; no visible flicker; changes announced in an `aria-live="polite"` region `ticket-live`). Two sections: "Active tickets" (`ticket-card`s) and "Upcoming appointments" (`appointment-card`s, status Scheduled). Cards stack, desktop 2-column grid, mobile 1 column. Waiting card: position + estimate. Called card: highlighted left border `--color-status-called`, message "Proceed to counter N". Serving: "Being served at counter N". Empty: "No tickets yet" (`tickets-empty`) with link to Book; "No upcoming appointments".

### 3.4 `/customer/history`
List of `history-row`s newest first: ticket or appointment, number/label, status badge, branch, service, time `YYYY-MM-DD HH:MM`. Table ≥768px, cards <768px (same testids). Empty: "No history yet".

### 3.5 `/staff` — Queue Desk
- Header strip: `staff-branch` (branch name) and `staff-counter` ("Counter 2").
- **Desktop**: row of 4 stat cards (`staff-waiting-count`, `staff-next`, `staff-completed-today`, `staff-avg-duration`); below, 2 columns: left "Current customer" card (`staff-current`) with action buttons; right "Waiting queue" list.
- **Mobile**: stats in 2×2 grid, current-customer card, then waiting list; action buttons full width stacked, each ≥44px.
- Actions: `btn-call-next` "Call Next" (primary), `btn-start` "Start Service", `btn-complete` "Complete Service", `btn-no-show` "No-Show", `btn-cancel` "Cancel Ticket" (danger outline; opens confirm). Inapplicable buttons are `disabled` and one visible reason is shown in `action-reason` (e.g. "Finish the current customer before calling next", "No waiting customers", "Call a customer first", "Start service first"). Applicable matrix: Call Next ⇔ no Called/Serving ticket and waiting>0; Start ⇔ Called; Complete ⇔ Serving; No-Show ⇔ Called; Cancel ⇔ Called or Serving.
- Staff without a counter: `form-error`-style banner "No counter assigned — ask an admin." and Call Next disabled.
- Empty: `current-empty` "No customer at your counter"; `waiting-empty` "No waiting customers".

### 3.6 `/admin` — Dashboard
- Title "Operations today" + clock controls card: `clock-advance-15` "+15 min", `clock-advance-60` "+60 min", `clock-reset` "Reset clock", showing current app time.
- **Desktop**: stat cards grid 3×3 (`--space-4` gap): Total customers today, Waiting, Called, Serving ("Being served"), Completed, Cancelled, No-Show, Avg waiting time, Avg service duration. Below: two chart cards side by side: "Tickets by status" (horizontal bars, `chart-status`) and "Branch comparison" (grouped bars Completed/Waiting/Cancelled per branch + avg wait/avg service values, `chart-branches`). Each chart has a visible data table (`chart-status-table`, `branch-compare-table`) under it (collapsible `<details>` open by default on desktop, closed on mobile but present in DOM).
- **Mobile**: stat cards 2 columns; charts stacked, bars scale to width, no horizontal overflow.
- Bars use status colours plus text value labels at bar end; chart is SVG/HTML with `role="img"` and `aria-label` summarising values.
- Empty (no tickets today): zeros shown; avg shows `—`. Updates via 2 s polling.

### 3.7 `/admin/monitor`
`monitor-branch-filter` select ("All branches" + branches). List of today's tickets (`monitor-row`): number, branch, service, customer, status badge, counter, staff, created time. Table ≥768px, cards below. Counts line `monitor-count` "11 tickets". Empty "No tickets for this filter". Polls every 2 s.

### 3.8 `/admin/branches`
Table/cards of branches (`branch-row`: name, code, address, hours, counters, services chips, assigned staff names, active badge `Active`/`Inactive`) with `branch-edit` and `branch-add` ("Add branch"). Form shown in a side panel (desktop, width `--width-form`) / full-screen sheet (mobile) with title "Add branch"/"Edit branch".

### 3.9 `/admin/services`
List/cards (`service-row`: name, code, description, `15 min`, category, status badge), `service-add` "Add service", `service-edit`, `service-toggle` ("Deactivate"/"Activate"). Same form container pattern.

### 3.10 `/admin/staff`
List/cards (`staff-row`: name, email, branch, counter `Counter 1` or `Unassigned`), `staff-add` "Add staff", `staff-edit`. Counter assignment is a field in the form.

### 3.11 `/display?branchId=<id>` — Queue display (visitor)
Dark high-contrast screen (`--color-nav-bg` background, white text; text pairs follow the token `nav-text`/`nav-bg`). Header: `display-title` branch name + clock. Left 2/3 "Now calling": grid of `now-calling-item` tiles with ticket number in `--font-size-display` mono and "Counter N" large, Called tiles with ▲ Called and Serving with ● Serving labels. Right 1/3 "Up next": `up-next-item` list of ≥5 next numbers in `--font-size-2xl`. Mobile 360px: single column, display number clamps to 3rem. If `branchId` omitted: `display-branch-select` (label "Branch") shown first. Empty: "No one is being called" / "No waiting tickets". Polls every 2 s.

## 4. Components
- **Button** (`--control-height` 44px, `--radius-md`, medium weight): primary filled teal (hover `--color-primary-hover`), secondary outlined `--color-border-strong`, danger outlined `--color-danger`; disabled: 50% opacity + `not-allowed`; focus ring from tokens.css. Always a `<button>` with visible text label.
- **Field**: visible `<label>` above control, control height 44px, border `--color-border-strong`, radius `--radius-sm`; error text under field in `--color-danger` with `aria-describedby` and `aria-invalid`; testid `field-error-<field>`.
- **Status badge** (`status-badge`): see §1.
- **Card**: surface, border, `--radius-md`, `--shadow-card`.
- **Stat card**: label (muted, `--font-size-sm`) over value (`--font-size-2xl` bold).
- **Slot button** (`slot`): 44px, outlined; available = selectable (selected = filled teal, `aria-pressed`); unavailable = disabled with text `HH:MM · Unavailable`.
- **Table → card collapse** below 768px.
- **Toast, form-error, confirm-dialog, loading/empty/error states**: as in §2.
- **Charts**: HTML/SVG bars with text values and table alternative.
- **Side panel/form sheet** for admin entities: focus moves to the first field on open, returns to trigger on close; `Esc` closes.

## 5. Binding test contract
Role access: customer → `/customer*`; staff → `/staff`; admin → `/admin*`; `/display` public. Persona is selected via `persona-switcher` (select; use `selectOption({label})` or value user id) or by setting `localStorage["queueflow.userId"]` before load. Seed ids: customers `usr_201` Alex Rivera, `usr_202` Emma Brown, `usr_203` James Miller; staff `usr_301` Sarah Johnson (Central, counter 1), `usr_302` Michael Chen (Central, counter 2), `usr_303` David Wilson (Downtown, counter 1); admin `usr_401` Jordan Ellis. Branch ids `br_central`, `br_downtown`; service ids `svc_general`, `svc_docs`, `svc_support`. Select option values are entity ids; option text is entity name (service option text is the service name only, e.g. `General Consultation`).

Repeated entities carry `data-id` = entity id (ticket `tkt_…`, appointment `appt_…`, branch/service/user ids) and tickets/rows also `data-number` = ticket number. Locate a ticket by `[data-testid=ticket-card][data-number="CEN-GC-005"]`.

### Shell (all roles)
| testid | element | content |
|---|---|---|
| `persona-switcher` | select, label "Demo account" | options `Name — Role` |
| `current-user` | text | `Emma Brown · Customer` |
| `clock-now` | text | `UTC 10:05` (HH:MM) |
| `nav-*` | links | see §2, label text exact |
| `toast` | role=status | success message |
| `form-error` | role=alert | server/validation message verbatim |
| `field-error-<field>` | text | field validation message |
| `loading-state`, `error-state`, `retry` | | |
| `confirm-dialog`, `confirm-yes` ("Confirm"), `confirm-no` ("Keep") | | |
| `demo-reset` | button "Reset demo data" | opens confirm; confirm resets server state |
| `forbidden-state` | text | access message |

### Customer `/customer`
| testid | element | notes |
|---|---|---|
| `branch-card` (data-id) | card | contains `branch-name`, `branch-waiting-count` (text `3 waiting`) |
| `book-branch` | select, label "Branch" | placeholder option value "" "Select a branch" |
| `book-service` | select, label "Service" | placeholder "Select a service" |
| `book-mode-walkin` | radio, label "Walk-in Queue" | default checked |
| `book-mode-appointment` | radio, label "Scheduled Appointment" | reveals date + slots |
| `book-date` | `<input type="date">`, label "Date", `min`=today, `max`=today+14 | default today (app clock) |
| `slot` (data-id=`HH:MM`, `data-available="true|false"`) | button | text `09:00` or `09:30 · Unavailable` (disabled) |
| `slots-empty` | text | "No available slots" |
| `book-submit` | button | label "Generate Ticket" (walk-in) / "Book Appointment" (appointment; disabled until a slot is selected) |
| `ticket-result` | card after walk-in success | contains `ticket-number` (e.g. `CEN-GC-005`), `ticket-status` ("Waiting"), `ticket-position` (`Position 3`), `ticket-wait` (`Est. wait 25 min`) |
| `appointment-result` | card after booking | contains `appointment-date`, `appointment-time`, `appointment-counter` |

Walk-in submit mutates: creates one Waiting ticket (double-click yields one). Appointment submit: creates Scheduled appointment; conflicts show `form-error` with message from API and no appointment is created.

### Customer `/customer/tickets`
`ticket-card` (data-id, data-number) contains: `ticket-number`, `ticket-status` (badge text), `ticket-branch`, `ticket-service`, `ticket-position` (`Position 2`; only Waiting), `ticket-wait` (`Est. wait 15 min`; `Est. wait 0 min` allowed; only Waiting), `ticket-message` (Called: `Proceed to counter 2`; Serving: `Being served at counter 2`), `ticket-cancel` ("Cancel Ticket"; only Waiting/Called → `confirm-dialog` → `confirm-yes` sets Cancelled; card leaves active list, toast "Ticket cancelled"). `tickets-empty`, `ticket-live`. `appointment-card` (data-id) contains `appointment-status` (`Scheduled`), `appointment-datetime` (`2026-11-02 11:00`), `appointment-branch`, `appointment-service`, `appointment-cancel` ("Cancel Appointment" → confirm → toast "Appointment cancelled", card removed, slot available again).

### Customer `/customer/history`
`history-row` (data-id, data-number for tickets) contains `history-label` (ticket number or `Appointment`), `history-status` (`Completed|Cancelled|No-Show|Converted`), `history-branch`, `history-service`, `history-time`. Newest first. `history-empty`.

### Customer `/customer/services`
`service-card` (data-id) with `service-name`, `service-duration` (`15 min`), `service-category`, `service-description`.

### Staff `/staff`
`staff-branch` (`Central Branch`), `staff-counter` (`Counter 2`), `staff-waiting-count` (value only, e.g. `2`), `staff-next` (next ticket number or `—`), `staff-completed-today` (integer), `staff-avg-duration` (`13.0 min` or `—`), `staff-current` (card; children `current-ticket-number`, `current-customer`, `current-service`, `current-status` badge), `current-empty`, buttons `btn-call-next`, `btn-start`, `btn-complete`, `btn-no-show`, `btn-cancel` (labels as §3.5), `action-reason`, `waiting-row` (data-id, data-number; children `waiting-number`, `waiting-service`, `waiting-customer`, `waiting-cancel` "Cancel" → confirm), `waiting-empty`. Call Next sets the oldest Waiting ticket at the branch to Called and fills `staff-current`; `form-error` shows API message on conflicts (`STAFF_BUSY`, `QUEUE_EMPTY`, `NO_COUNTER` messages). Seeds: Sarah Johnson (counter 1) serving CEN-GC-002; Michael Chen serving CEN-CS-001 — both must Complete before Call Next is enabled.

### Admin `/admin`
Stat values (testid on the value element, text exact): `stat-total`, `stat-waiting`, `stat-called`, `stat-serving`, `stat-completed`, `stat-cancelled`, `stat-no-show` (integers) and `stat-avg-wait`, `stat-avg-service` (`13.8 min` / `11.3 min`; `—` if none). Seed values: 11, 3, 0, 3, 3, 1, 1, 13.8 min, 11.3 min. `chart-status` (role=img) + `chart-status-table` (rows `status-row` data-id=status key with `status-row-count`); `chart-branches` + `branch-compare-table` (`branch-compare-row` data-id=branch id with `compare-completed`, `compare-waiting`, `compare-cancelled`, `compare-avg-wait`, `compare-avg-service`). Clock controls `clock-advance-15`, `clock-advance-60`, `clock-reset`; after advance, `clock-now` changes and a `toast` "Clock advanced 60 min" appears.

### Admin `/admin/monitor`
`monitor-branch-filter` (value "" = All branches), `monitor-count`, `monitor-row` (data-id, data-number) with `monitor-number`, `monitor-status`, `monitor-counter` (`Counter 1` or `—`), `monitor-staff` (name or `—`), `monitor-branch`, `monitor-service`.

### Admin `/admin/branches`
`branch-row` (data-id) with `branch-row-name`, `branch-row-code`, `branch-row-address`, `branch-row-hours` (`09:00–17:00`), `branch-row-counters` (integer), `branch-row-services`, `branch-row-staff`, `branch-row-status`; `branch-add`, `branch-edit`. Form `branch-form`: `branch-name` (text, "Name"), `branch-code` (text, "Code", auto-uppercase), `branch-address` (text, "Address"), `branch-open` (`type=time`, "Opens"), `branch-close` (`type=time`, "Closes"), `branch-counters` (`type=number` min 1 max 20, "Counters"), `branch-service-<serviceId>` (checkbox, label = service name), `branch-active` (checkbox "Active"), `branch-save` ("Save branch"), `branch-cancel` ("Cancel"). Errors: `field-error-name|code|address|openTime|counterCount|serviceIds`, and `form-error` for API conflicts (e.g. `COUNTER_IN_USE`). Success: panel closes, toast "Branch saved", row updated/added.

### Admin `/admin/services`
`service-row` (data-id) with `service-row-name`, `service-row-code`, `service-row-duration` (`15 min`), `service-row-category`, `service-row-status` (`Active`/`Inactive`); `service-add`, `service-edit`, `service-toggle`. Form `service-form`: `service-name`, `service-code`, `service-description` (textarea), `service-duration-input` (`type=number` min 1 max 240, label "Duration (minutes)"), `service-category`, `service-active` (checkbox), `service-save` ("Save service"), `service-cancel`. Toast "Service saved". (Note `service-name`/`service-duration` on the customer services page are output elements; form inputs use the names above.)

### Admin `/admin/staff`
`staff-row` (data-id) with `staff-row-name`, `staff-row-email`, `staff-row-branch`, `staff-row-counter` (`Counter 1` / `Unassigned`); `staff-add`, `staff-edit`. Form `staff-form`: `staff-form-name`, `staff-form-email` (`type=email`), `staff-form-branch` (select, option value = branch id), `staff-form-counter` (select; options "" = "Unassigned" and `1`…`N` for selected branch, labels `Counter 1`…), `staff-form-save` ("Save staff"), `staff-form-cancel`. API conflicts (`COUNTER_TAKEN`) appear in `form-error`; toast "Staff saved".

### Display `/display?branchId=br_central`
`display-branch-select` (only without branchId), `display-title`, `now-calling-item` (data-id) with `display-ticket-number`, `display-counter` (`Counter 2`), `display-status`; `up-next-item` with `display-next-number`; `display-empty-calling`, `display-empty-next`.

### Derived edge/smoke contracts
- Duplicate ticket: second walk-in for same branch+service shows `form-error` and ticket list unchanged.
- Closed branch / inactive service: `form-error` with API message; inactive services are absent from `book-service` options.
- Past date: `book-date` has `min`=today; if bypassed the API error shows in `form-error`.
- Smoke: every route in §2 renders without console errors, without horizontal overflow at 360px and 390px, with persona `usr_*` of the proper role.

## 6. Visual evidence plan
`visual-plan.json` has three targets, captured at 1440×900 and 390×844:
1. **primary** — `/customer/tickets` as Emma Brown after generating a Central/General Consultation walk-in ticket. Ready when a `ticket-card` with `CEN-GC-NNN`, `Waiting`, position and wait is visible. Criteria: badge icon+text, clear ticket number hierarchy, position/wait readable, nav usable, no overflow.
2. **staff-desk** — `/staff` as Michael Chen at seed: current customer card with enabled Complete, disabled buttons with reason, waiting list, stat cards. Criteria: action buttons ≥44px, disabled reason visible, stat cards aligned.
3. **admin-dashboard** — `/admin` as Jordan Ellis: stat cards and both charts. Criteria: values legible, bars with text labels and table alternative, 2-column mobile cards without clipping.

## 7. Assumptions and limitations
- Persona switcher without passwords is the explicit demo authentication boundary; no real login.
- Real-time uses 2 s polling; the UI never needs manual refresh.
- Contrast pairs are selected to target WCAG AA but not measured here.
- Charts are simple HTML/SVG (no chart package may be installed).
- Admin entities cannot be deleted (per requirements); deactivate via `service-toggle` / `branch-active`.
- Branch-level queue is FIFO across services; no priority lanes.
- Ticket `data-number` may repeat across business days; tests use today's tickets only.
