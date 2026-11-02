import { test, expect } from '@playwright/test';
import { OWNER_ID, RENTER_ID, requestBooking, resetStore, startAs, switchAccount } from './helpers';

test.beforeEach(async ({ request }) => {
  await resetStore(request);
});

test('TR-4: Owner Booking Approval', async ({ page }) => {
  await startAs(page, RENTER_ID);
  const created = await requestBooking(page, 'car_01', '2026-12-01', '2026-12-04');
  expect(created.status()).toBe(201);
  const booking = await created.json();
  await expect(page.getByTestId('booking-success')).toContainText('Booking request sent. Status: Pending.');

  await page.getByTestId('nav-my-bookings').click();
  const renterCard = page.locator(`[data-testid=booking-card][data-id=${booking.id}]`);
  await expect(renterCard.getByTestId('status-badge')).toHaveText('Pending');

  await switchAccount(page, OWNER_ID);
  await page.getByTestId('nav-booking-requests').click();
  const ownerCard = page.locator(`[data-testid=booking-card][data-id=${booking.id}]`);
  await expect(ownerCard.getByTestId('status-badge')).toHaveText('Pending');
  await expect(ownerCard.getByTestId('booking-renter')).toHaveText('Alex Rivera');

  const approvePromise = page.waitForResponse(
    (r) => r.url().includes(`/api/bookings/${booking.id}/status`) && r.request().method() === 'PATCH',
  );
  await ownerCard.getByTestId('booking-approve').click();
  expect((await approvePromise).status()).toBe(200);
  await expect(ownerCard.getByTestId('status-badge')).toHaveText('Confirmed');

  await switchAccount(page, RENTER_ID);
  await page.getByTestId('nav-my-bookings').click();
  await expect(
    page.locator(`[data-testid=booking-card][data-id=${booking.id}]`).getByTestId('status-badge'),
  ).toHaveText('Confirmed');
});
