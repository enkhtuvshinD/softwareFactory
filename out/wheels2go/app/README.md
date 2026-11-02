# Wheels2Go

Peer-to-peer car rental demo: owners list cars and approve requests, renters browse, price and book.

## Run

- `npm run build` then `npm start` (serves API and client on `PORT`, default 3000)
- `npx vitest run` for unit tests (pricing, dates, overlap, filters, validation, earnings)
- `npx playwright test` for E2E

## Demo accounts

Use the "Switch account" selector in the header. This is a labeled local demo boundary, not authentication; the API trusts the `X-User-Id` header.

- Owner: Sarah Jenkins (`usr_101`)
- Renter: Alex Rivera (`usr_102`), the default

## Notes

- Data lives in `server/data/db.json`, initialized from `server/data/seed.json`. `POST /api/reset` restores the seed.
- Car images are remote URLs; a placeholder shows when they fail to load.
- Assumptions: rentals are limited to 30 days, cars with pending or confirmed bookings cannot be deleted, renters may cancel before the start date.
