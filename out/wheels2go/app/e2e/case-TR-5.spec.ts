import { test, expect } from '@playwright/test';
import { RENTER_ID, requestBooking, resetStore, startAs } from './helpers';

test.beforeEach(async ({ request }) => {
  await resetStore(request);
});

test('TR-5: Booking Conflict Prevention', async ({ page, request }) => {
  await startAs(page, RENTER_ID);
  const response = await requestBooking(page, 'car_01', '2026-11-11', '2026-11-14');
  expect(response.status()).toBe(409);
  await expect(page.getByTestId('booking-error')).toHaveText(
    'These dates conflict with an existing confirmed booking for this car',
  );
  await expect(page.getByTestId('booking-success')).toHaveCount(0);

  await page.getByTestId('nav-my-bookings').click();
  await expect(page.getByTestId('booking-card')).toHaveCount(1);
  await expect(page.locator('[data-testid=booking-card][data-id=book_301]')).toBeVisible();

  const list = await request.get('/api/bookings', { headers: { 'X-User-Id': RENTER_ID } });
  expect(list.ok()).toBeTruthy();
  const bookings = (await list.json()) as unknown[];
  expect(bookings).toHaveLength(1);
});
