# QueueFlow — Requirements

## 1. Product and scope
**Source brief.** `input/brief.md` holds three sections; the first two (Wheels2Go car rental) are wrapped in HTML comments (`<!-- ... -->`) and are inactive. The active brief is section `#3` **QueueFlow — Smart Queue & Appointment Management Platform**. Only QueueFlow is specified here.

**Users:** customers of service businesses, branch staff at service counters, and administrators. Anonymous visitors may open a large-screen queue display.

**Outcome:** a digital queue and appointment platform: customers pick a branch and service, get a walk-in ticket or book an appointment, and track position and estimated wait; staff call and serve in FIFO order; admins manage branches/services/staff and monitor queues and statistics.

**Excluded:** real authentication, SMS/e-mail notifications, payments, multi-tenant businesses, ticket priority lanes, deleting branches/services/staff (deactivate/edit only), customer self-registration.

**Integrations / prerequisites:** none external. The brief asks for "demo accounts and an easy role-switching mechanism", so a persona switcher is the *explicit* authentication boundary: no passwords. Real-time updates use short polling (the brief allows an "equivalent real-time mechanism"); WebSocket is not required.

## 2. Roles and capabilities
| Role | Capabilities |
|---|---|
| visitor | Open public queue display `/display` for a branch (read-only). |
| customer | View active branches and active services; generate walk-in ticket; book/cancel appointments; track ticket position/wait; cancel own Waiting/Called ticket; view own history. |
| staff | See own branch/counter, queue, current customer; Call Next, Start, Complete, No-Show, Cancel Ticket for tickets at own branch. |
| admin | Manage branches, services, staff, counter assignment; monitor all queues; view statistics. |

Demo personas (header persona switcher, always visible, keyboard-operable select or menu; selection stored in `localStorage` key `queueflow.userId` and survives refresh; default on first load: Alex Rivera): Alex Rivera, Emma Brown, James Miller (customers); Sarah Johnson, Michael Chen, David Wilson (staff); Jordan Ellis (admin). The client sends `X-User-Id` on every API call; the server enforces role permissions (403 `FORBIDDEN`) and rejects unknown IDs (401 `UNKNOWN_USER`). Each role has its own navigation and landing page: customer `/customer`, staff `/staff`, admin `/admin`, display `/display?branchId=...`.

## 3. Functional requirements

### Branches and services (admin)
- **FR-001** Given admin, when opening Branches, then all branches list name, code, address, hours, counters, offered services, assigned staff, active flag.
- **FR-002** Given admin, when creating/editing a branch with name, code (2–4 uppercase letters, unique), address, openTime < closeTime (HH:MM), counterCount 1–20, ≥1 service, then it persists and appears to customers if active. Invalid input shows field errors; the server returns 400 `VALIDATION_ERROR`. Reducing counterCount below an assigned staff member's counter returns 409 `COUNTER_IN_USE`.
- **FR-003** Given admin, when creating/editing a service with name, code (2–3 uppercase letters, unique), description, durationMinutes (integer 1–240), category, then it persists. Toggling Active off hides it from customer booking and new tickets; existing tickets are unaffected.
- **FR-004** Given admin, when creating/editing staff (name, e-mail unique, branch, optional counter) and assigning a staff member to a counter, then the counter must exist at that branch and not be held by another staff member (409 `COUNTER_TAKEN`); a staff member without a counter cannot Call Next (409 `NO_COUNTER`).

### Customer booking and tickets
- **FR-005** Given customer, when opening Branches, then active branches show name, address, hours, services and current waiting count.
- **FR-006** Given customer, when browsing Services, then active services show name, description, duration, category.
- **FR-007** Given customer, when choosing branch → service (only services the branch offers and that are active) → "Walk-in Queue" and confirming, then a ticket with status Waiting and unique number `{branchCode}-{serviceCode}-{seq:3}` is created and shown (TR-1).
- **FR-008** Given a branch, when tickets are created on the same business day, then `seq` is the next integer per (branch, service, business date), starting at 1, with no gaps from rapid or duplicated submissions (server-atomic).
- **FR-009** Given a customer with an active (Waiting/Called/Serving) ticket for the same branch+service, when generating another, then 409 `DUPLICATE_TICKET` with a clear message and no new ticket. Double-clicking Generate yields one ticket.
- **FR-010** Given branch outside operating hours at app time, or inactive branch/service, or service not offered, when generating a ticket, then 409 `BRANCH_CLOSED` / `BRANCH_INACTIVE` / `SERVICE_UNAVAILABLE` and a message.
- **FR-011** Given customer, when opening My Tickets, then each active ticket shows number, branch, service, status badge, position and estimated wait (Waiting), "Proceed to counter N" (Called), "Being served at counter N" (Serving). Data refreshes every ≤2 s automatically (TR-3).
- **FR-012** Given customer with Waiting/Called ticket, when clicking Cancel Ticket (with confirm), then status Cancelled and queue positions recompute.
- **FR-013** Given customer, when opening History, then own completed/cancelled/no-show tickets and cancelled/converted appointments are listed newest first with status, branch, service and time.

### Queue management
- **FR-014** Queue scope is the branch: Waiting tickets of one branch are ordered by (`createdAt`, then ticket `id`) ascending; this is the FIFO order across all services of that branch.
- **FR-015** Given staff with a counter and no Called/Serving ticket, when clicking Call Next, then the first Waiting ticket at the staff's branch becomes Called with staffId, counterNumber, calledAt (TR-2). If none, 409 `QUEUE_EMPTY`.
- **FR-016** Given a staff member with a Called or Serving ticket, when calling next, then 409 `STAFF_BUSY` (one customer at a time). A ticket can only be called from Waiting; concurrent Call Next requests never call the same ticket twice (second call gets the next ticket or `QUEUE_EMPTY`).
- **FR-017** Given a Called ticket assigned to this staff, when Start Service, then Serving + startedAt. Given Serving, when Complete Service, then Completed + endedAt. Given Called, when No-Show, then No-Show + endedAt. Cancel Ticket is allowed on Waiting (same branch), Called or Serving tickets and sets Cancelled + endedAt. Other transitions return 409 `INVALID_TRANSITION`. Staff of another branch get 403.
- **FR-018** Given any ticket leaves Waiting (called, cancelled, completed), then positions/estimates of all remaining Waiting tickets are recomputed from live data on each read (TR-4).
- **FR-019** Position and estimate (see §5): position = 1 + Waiting tickets ahead; estimatedWaitMinutes = sum of `durationMinutes` of the services of the tickets ahead.

### Staff dashboard
- **FR-020** Given staff, when opening dashboard, then it shows assigned branch and counter, current customer (Called/Serving ticket with number, customer, service), waiting count at branch, next customer (first Waiting), completed services today by this staff, average service duration today by this staff (1 decimal minutes, "—" if none), and the waiting list grouped/labelled by service.
- **FR-021** Buttons Call Next, Start Service, Complete Service, No-Show, Cancel Ticket are shown, disabled with a visible reason when not applicable, and each updates shared state immediately and the screen within ≤2 s polling.

### Appointments
- **FR-022** Given customer, when choosing branch, service and a date (today to today+14 days) then slots are listed: every 30 min from openTime where start + durationMinutes ≤ closeTime. A slot is Available if at least one counter with an assigned staff member has no overlapping Scheduled appointment; otherwise shown Unavailable (disabled). Past slots (start < app now) are not shown as bookable.
- **FR-023** Given a slot, when booking, then an Appointment (Scheduled) is created and assigned to the lowest-numbered free counter and its staff. Past date/time → 400 `PAST_DATE`; a slot with no free counter (same counter/staff overlap) → 409 `SLOT_UNAVAILABLE`; the same customer already holding an overlapping Scheduled appointment → 409 `DUPLICATE_APPOINTMENT` (TR-5).
- **FR-024** Given customer, when clicking Cancel on an upcoming Scheduled appointment, then status Cancelled and its slot is available again. Converted/cancelled appointments cannot be cancelled (409 `INVALID_TRANSITION`).
- **FR-025** Given app time reaches a Scheduled appointment's start (date+startTime), then the server (on each request and at least every 5 s) converts it exactly once into a Waiting `appointment`-type ticket with `createdAt` = appointment start, next sequence number, linked `appointmentId`, and sets appointment status Converted with `ticketId`. Conversion ignores FR-009 and FR-010 (not blocked by duplicates or closing).

### Real-time, display, admin
- **FR-026** Given customer, staff, admin and display views open, when queue state changes, then each view reflects it within ≤2 s without reload (polling `Cache-Control: no-store`).
- **FR-027** Given visitor, when opening `/display?branchId=X` (branch selector if omitted), then a large-type screen shows "Now calling" (Called/Serving: ticket number + counter) and the next ≥5 Waiting ticket numbers, readable at 1080p and usable at 360px.
- **FR-028** Given admin, when opening Dashboard, then cards show (business date "today" = app clock UTC date): Total customers today (tickets created today), Waiting, Being served (status Serving), Called, Completed, Cancelled, No-Show, Avg waiting time, Avg service duration; plus charts: tickets by status and branch comparison (per branch Completed/Waiting/Cancelled bars, avg wait, avg service). Charts have text/table alternatives.
- **FR-029** Given admin, when opening Monitor, then all tickets of the day for all branches are listed with branch filter, status badge, counter, staff; counts update per FR-026.
- **FR-030** Given admin, when clicking "Advance demo clock" (15/60 min), then app time moves forward, due appointments convert (FR-025), and every view uses the new time. Reset restores offset 0.

### Persistence and validation
- **FR-031** All entities persist server-side and survive browser refresh and server restart; `POST /api/reset` restores seed exactly.
- **FR-032** Every mutation validates input and returns the error shape in §6; the UI shows the message in an alert region and keeps entered form values.

## 4. Domain model
All timestamps ISO-8601 UTC strings; dates `YYYY-MM-DD`; times `HH:MM`. Branch-local time = UTC (assumption).
- **User**: id, name, email (unique), role `customer|staff|admin`, branchId (staff only, else null), counterNumber (staff only, int|null).
- **Branch**: id, name (unique, required), code, address, openTime, closeTime, counterCount (1–20), serviceIds[], isActive.
- **Service**: id, name (unique), code, description, durationMinutes (1–240), category, isActive.
- **Ticket**: id, ticketNumber, branchId, serviceId, customerId|null (null = walk-in guest created by kiosk, seed only), customerName, type `walk_in|appointment`, businessDate, sequence, status `waiting|called|serving|completed|cancelled|no_show`, createdAt, calledAt|null, startedAt|null, endedAt|null, counterNumber|null, staffId|null, appointmentId|null.
- **Appointment**: id, customerId, branchId, serviceId, date, startTime, endTime (= start + service duration), counterNumber, staffId|null, status `scheduled|cancelled|converted`, ticketId|null, createdAt.
- **Clock** (seed): `anchorIso`; app now = anchor + real elapsed time since server start/reset + advanced minutes.
- Relationships: Branch↔Service many-to-many via serviceIds; User(staff)→Branch; Ticket→Branch/Service/User; Appointment→Ticket (0..1).
- Status labels in UI: Waiting, Called, Serving, Completed, Cancelled, No-Show (each with distinct colour **and** text/icon).

## 5. Business rules
**Ticket status transitions (actor):** waiting→called (staff Call Next); called→serving (assigned staff); serving→completed (assigned staff); called→no_show (assigned staff); waiting|called→cancelled (customer owner or staff of branch); serving→cancelled (staff); waiting→cancelled (staff of branch). Terminal: completed, cancelled, no_show. Admin has read-only access to tickets. "Assigned staff" = ticket.staffId.

**Ticket numbering:** `ticketNumber = branch.code + "-" + service.code + "-" + zero-pad(seq,3)`. seq = 1 + max seq among tickets with same branch, service, businessDate (including cancelled). Example: seed has CEN-GC-001..004 → next CEN-GC-005; first CEN-DV ticket of 2026-11-02 is CEN-DV-001.

**Business date** = UTC date of app now. Operating hours: open if openTime ≤ time-of-day < closeTime.

**Position and wait:** for Waiting ticket T at branch B, ahead = Waiting tickets at B ordered before T in FIFO order. position = |ahead|+1; estimatedWaitMinutes = Σ service.durationMinutes over ahead. Called/Serving/terminal tickets have position null, wait 0/null. Counters count is not used in the estimate (simplification). Worked example (seed): Central waiting = CEN-GC-003 (Tom, 09:40) and CEN-DV-002 (Omar, 09:50). Tom: position 1, wait 0. Omar: position 2, wait 15 (GC duration). After Tom is called → Omar position 1, wait 0. If a new CEN-CS ticket is created: position 3, wait 15+10 = 25. Downtown: DWN-GC-003 (Alex) position 1, wait 0.

**Average figures** (rounded half-up to 1 decimal, minutes = ms/60000): avg waiting = mean(startedAt − createdAt) over tickets with startedAt today; avg service = mean(endedAt − startedAt) over Completed tickets today. Seed day: avg waiting = (6+8+20+17+2+30)/6 = 13.8; avg service = (13+9+12)/3 = 11.3. Central: wait 12.8, service 11.0; Downtown: wait 16.0, service 12.0. Staff (seed): Sarah 1 completed avg 13.0; Michael 1 avg 9.0; David 1 avg 12.0. Total customers today = tickets with businessDate today = 11; waiting 3, serving 3, called 0, completed 3, cancelled 1, no-show 1.

**Slot overlap:** intervals [start, end) conflict iff s1 < e2 and s2 < e1; touching is allowed. Example Downtown (1 counter): Support (20 min) booked 15:00–15:20 (seed appt_002) blocks a General Consultation (15 min) booking at 15:00 but not at 15:30; at Central (2 counters) Document Verification 2026-11-02 11:00 already uses counter 1, so one more 11:00 booking succeeds on counter 2 and a third fails.

**Date rules:** bookable dates today..today+14 (app clock). A slot is past if its start < app now.

**Unit-testable pure logic:** ticket numbering, FIFO ordering, position/wait calculation, transition validity, slot generation, overlap detection, counter assignment, statistics/average rounding. Put these in a pure module with Vitest/Node tests.

## 6. API and persistence contract
JSON; error shape `{ "error": { "code": "STRING", "message": "Human readable" } }`; statuses 400 validation, 401, 403, 404 `NOT_FOUND`, 409 conflicts. Mutations are serialized server-side. Persistent store: server-side file/DB; boot loads `requirements/seed.json` shape (resolved seed) if no store exists. Shared TypeScript types for entities in §4 are used by client and server. Computed Ticket view adds `position`, `estimatedWaitMinutes`, `branchName`, `serviceName`, `staffName`.

Infrastructure: `GET /api/health` → `{ "ok": true }`. `POST /api/reset` → restores seed exactly (incl. clock anchor re-based to now, offset 0) → `{ "ok": true }`.

| Endpoint | Role | Notes |
|---|---|---|
| `GET /api/users` | any | demo accounts for switcher |
| `GET /api/branches` | any | includes `staff[]`, `waitingCount`; customers receive only active |
| `POST /api/branches`, `PUT /api/branches/:id` | admin | FR-002 |
| `GET /api/services`, `POST /api/services`, `PUT /api/services/:id` | read any / write admin | FR-003 |
| `GET /api/staff`, `POST /api/staff`, `PUT /api/staff/:id` | admin | FR-004 |
| `GET /api/clock` → `{ now, businessDate }`; `POST /api/clock/advance` `{minutes:1..480}` | read any / advance admin | FR-030 |
| `POST /api/tickets` `{branchId, serviceId}` → 201 Ticket | customer | FR-007..010 |
| `GET /api/tickets/mine` | customer | all own tickets |
| `GET /api/tickets?branchId=&date=` | staff(own branch)/admin | computed views |
| `POST /api/tickets/:id/start`, `/complete`, `/no-show`, `/cancel` | staff / customer(cancel own) | FR-017 |
| `POST /api/queue/call-next` | staff | returns called ticket; FR-015/016 |
| `GET /api/staff/dashboard` | staff | FR-020 payload |
| `GET /api/slots?branchId=&serviceId=&date=` → `[{ startTime, endTime, available }]` | customer | FR-022 |
| `POST /api/appointments` `{branchId, serviceId, date, startTime}` → 201 | customer | FR-023 |
| `GET /api/appointments/mine`, `POST /api/appointments/:id/cancel` | customer | FR-024 |
| `GET /api/admin/stats` → overall + per-branch figures | admin | FR-028 |
| `GET /api/display/:branchId` → `{ branchName, nowCalling[], upNext[] }` | visitor | FR-027 |

Error codes used: `VALIDATION_ERROR, UNKNOWN_USER, FORBIDDEN, NOT_FOUND, DUPLICATE_TICKET, BRANCH_CLOSED, BRANCH_INACTIVE, SERVICE_UNAVAILABLE, QUEUE_EMPTY, STAFF_BUSY, NO_COUNTER, INVALID_TRANSITION, PAST_DATE, SLOT_UNAVAILABLE, DUPLICATE_APPOINTMENT, COUNTER_IN_USE, COUNTER_TAKEN`.

## 7. Primary journey
Customer Emma Brown generates a walk-in ticket at Central / General Consultation (CEN-GC-005, Waiting; position 3 because CEN-GC-003 and CEN-DV-002 are ahead; wait 15+10 = 25 min). Staff Michael Chen (counter 2, currently serving CEN-CS-001) completes his customer, clicks Call Next → CEN-GC-003 (Tom) is called first (FIFO) — repeated with completion until CEN-GC-005 is called; Emma's open My Tickets view changes to Called within ≤2 s and shows "Proceed to counter 2". Staff clicks Start Service, Complete Service. Emma's History lists Completed. Admin dashboard shows updated Completed count/averages. After browser refresh all states are unchanged.

## 8. UI and non-functional behavior
- Professional minimal SaaS dashboard; responsive down to 360px (no horizontal scroll; tables collapse to cards); left/top navigation per role.
- All controls labelled, keyboard operable, visible focus; status never conveyed by colour alone; live regions (`aria-live="polite"`) announce ticket status changes and action errors.
- Loading (skeleton/spinner), empty ("No tickets yet", "No waiting customers", "No available slots"), error (retry) and success (toast/inline) states for each data view and mutation. Buttons disable while a request is in flight.
- Times displayed as `HH:MM` UTC with "UTC" noted in header; durations in minutes. Locale en-US.
- Persona switcher always visible; shows the current user name and role.
- Stable test hooks: `data-testid` on key elements is recommended by design stage, not mandated here.

## 9. Resolved seed and traceability
**Seed:** `input/seed.json` is a leftover Wheels2Go (car rental) seed (users owner/renter, cars, bookings) incompatible with QueueFlow; it is kept unchanged and **not imported**. `requirements/seed.json` is a domain seed built from the brief's §11: branches Central, Downtown; services General Consultation 15, Document Verification 10, Customer Support 20; staff Sarah Johnson, Michael Chen (Central), David Wilson (Downtown); customers Alex Rivera, Emma Brown, James Miller; plus one admin (Jordan Ellis, needed for the Admin role), 11 sample tickets covering all six statuses (Waiting 3, Called 0 — Called arises via Call Next, Serving 3, Completed 3, Cancelled 1, No-Show 1), and 2 scheduled appointments (appt_001 Emma Central DV 2026-11-02 11:00; appt_002 James Downtown CS 2026-11-01 15:00). Clock anchor 2026-11-01T10:00:00Z (run date). Seed guest tickets (customerId null) represent walk-ins at a counter.

**Traceability (supplied acceptance → FR):** TR-1 → FR-005..FR-008; TR-2 → FR-014..FR-017; TR-3 → FR-011, FR-015, FR-026; TR-4 → FR-012, FR-018, FR-019; TR-5 → FR-022..FR-024; TR-6 → FR-028, FR-029. `acceptance.json` contains exactly TR-1..TR-6 (source `brief`).

**Brief capability → FR:** customer branches/services/booking/ticket/track/history FR-005..013; staff capabilities FR-015..021; admin management FR-001..004, monitoring FR-029, statistics FR-028; branch/service/staff fields FR-001..004; algorithm FR-008, 009, 014..019; appointments FR-022..025; real-time FR-026; persistence FR-031, 032; queue display FR-027; demo accounts §2.

**Derived checks (not in acceptance.json):** D-1 duplicate ticket blocked (FR-009); D-2 closed/inactive branch or service blocked (FR-010); D-3 staff busy/Call Next on empty queue errors (FR-016, FR-015); D-4 appointment past date rejected (FR-023); D-5 cancelling appointment frees slot (FR-024); D-6 advancing the clock 300 min converts appt_002 into Waiting ticket DWN-CS-00N exactly once (FR-025, FR-030); D-7 role guards: customer cannot reach admin API (FR-004 / §2); D-8 persistence after refresh and reset (FR-031); D-9 360px layout, keyboard focus, no console errors (§8); D-10 seeded statistics (13.8 / 11.3, 3 completed) shown on admin dashboard (FR-028); D-11 admin creates branch/service/staff and assignment conflicts rejected (FR-002..004).

## 10. Assumptions and limitations
1. Active brief is QueueFlow; the commented Wheels2Go text is ignored; leftover seed is incompatible (see §9).
2. No real login; persona switcher with demo accounts is a labelled demo boundary; server checks the `X-User-Id` role only.
3. Real-time = 2 s polling, not WebSocket.
4. Branch-local time is UTC; all branches open every day 09:00–17:00 in seed.
5. App clock is anchored at 2026-11-01T10:00:00Z and runs in real time so seed data is always "today"; admin can advance it. Tests pick slots from UI at execution time.
6. Staff serve all services their branch offers; queue is FIFO per branch across services; estimate ignores counter count and remaining time of in-progress services.
7. Admin was not in the brief's seed list; one admin account was added.
8. Customers without a seeded ticket for a branch+service can create one; seed guest tickets are walk-ins without accounts.
9. Appointment length equals service duration; slot grid is 30 min; slots are assigned to the lowest free counter automatically.
10. Unit tests required: the queue algorithm, estimates, slot/overlap logic and statistics are pure logic (§5).
