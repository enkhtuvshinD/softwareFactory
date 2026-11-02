import { test, expect } from '@playwright/test';
import { OWNER_ID, RENTER_ID, resetStore, switchAccount } from './helpers';

test.beforeEach(async ({ request }) => {
  await resetStore(request);
});

test('JOURNEY: renter books a car and the owner approves it across both dashboards', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('result-count')).toBeVisible();
  await expect(page.getByTestId('account-switcher')).toHaveValue(RENTER_ID);
  await expect(page.getByTestId('current-user')).toContainText('Alex Rivera');

  await page.getByTestId('filter-make').fill('Tesla');
  await expect(page.getByTestId('car-card')).toHaveCount(1);
  await expect(page.getByTestId('car-card')).toContainText('Tesla');

  await page.getByTestId('car-link').click();
  await expect(page.getByTestId('car-detail')).toBeVisible();
  await page.getByTestId('booking-start').fill('2026-12-01');
  await page.getByTestId('booking-end').fill('2026-12-04');
  await expect(page.getByTestId('price-days')).toHaveText('3 days');
  await expect(page.getByTestId('price-subtotal')).toHaveText('$255.00');
  await expect(page.getByTestId('price-cleaning-fee')).toHaveText('$25.00');
  await expect(page.getByTestId('price-total')).toHaveText('$280.00');

  const createPromise = page.waitForResponse(
    (r) => r.url().endsWith('/api/bookings') && r.request().method() === 'POST',
  );
  await page.getByTestId('booking-submit').click();
  const created = await createPromise;
  expect(created.status()).toBe(201);
  const booking = await created.json();
  await expect(page.getByTestId('booking-success')).toContainText('Booking request sent. Status: Pending.');

  await page.getByTestId('go-my-bookings').click();
  const renterCard = page.locator(`[data-testid=booking-card][data-id=${booking.id}]`);
  await expect(renterCard.getByTestId('status-badge')).toHaveText('Pending');
  await expect(renterCard.getByTestId('booking-total')).toHaveText('$280.00');

  await switchAccount(page, OWNER_ID);
  await page.getByTestId('nav-booking-requests').click();
  const ownerCard = page.locator(`[data-testid=booking-card][data-id=${booking.id}]`);
  await expect(ownerCard).toBeVisible();
  await expect(ownerCard.getByTestId('booking-renter')).toHaveText('Alex Rivera');
  await expect(ownerCard.getByTestId('booking-renter-email')).toHaveText('alex.rivera@example.com');
  await expect(ownerCard.getByTestId('status-badge')).toHaveText('Pending');

  const approvePromise = page.waitForResponse(
    (r) => r.url().includes(`/api/bookings/${booking.id}/status`) && r.request().method() === 'PATCH',
  );
  await ownerCard.getByTestId('booking-approve').click();
  expect((await approvePromise).status()).toBe(200);
  await expect(ownerCard.getByTestId('status-badge')).toHaveText('Confirmed');

  await switchAccount(page, RENTER_ID);
  await page.getByTestId('nav-my-bookings').click();
  const confirmedCard = page.locator(`[data-testid=booking-card][data-id=${booking.id}]`);
  await expect(confirmedCard.getByTestId('status-badge')).toHaveText('Confirmed');

  await page.reload();
  const afterReload = page.locator(`[data-testid=booking-card][data-id=${booking.id}]`);
  await expect(afterReload).toBeVisible();
  await expect(afterReload.getByTestId('status-badge')).toHaveText('Confirmed');
  await expect(afterReload.getByTestId('booking-total')).toHaveText('$280.00');
});
