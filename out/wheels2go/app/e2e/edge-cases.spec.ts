import { test, expect } from '@playwright/test';
import { OWNER_ID, isoDate, openMarketplace, resetStore, startAs } from './helpers';

test.beforeEach(async ({ request }) => {
  await resetStore(request);
});

test('EDGE: invalid booking dates show clear errors and create nothing', async ({ page, request }) => {
  await page.goto('/cars/car_02');
  await expect(page.getByTestId('booking-panel')).toBeVisible();

  const start = isoDate(10);
  const sameDay = start;
  await page.getByTestId('booking-start').fill(start);
  await page.getByTestId('booking-end').fill(sameDay);
  await expect(page.getByTestId('booking-error')).toHaveText('End date must be after start date');

  await page.getByTestId('booking-start').fill(isoDate(-3));
  await page.getByTestId('booking-end').fill(isoDate(-1));
  await expect(page.getByTestId('booking-error')).toHaveText('Start date cannot be in the past');

  await page.getByTestId('booking-start').fill(isoDate(10));
  await page.getByTestId('booking-end').fill(isoDate(50));
  await expect(page.getByTestId('booking-error')).toHaveText('Rentals are limited to 30 days');

  await page.getByTestId('booking-submit').click();
  await expect(page.getByTestId('booking-error')).toBeVisible();
  await expect(page.getByTestId('booking-success')).toHaveCount(0);

  const list = await request.get('/api/bookings', { headers: { 'X-User-Id': 'usr_102' } });
  expect(((await list.json()) as unknown[]).length).toBe(1);
});

test('EDGE: empty listing form is rejected with field errors and saves nothing', async ({ page, request }) => {
  await startAs(page, OWNER_ID, '/owner/listings');
  const before = ((await (await request.get('/api/cars')).json()) as unknown[]).length;
  await page.getByTestId('add-listing').click();
  await expect(page.getByTestId('listing-form')).toBeVisible();
  await page.getByTestId('listing-save').click();

  await expect(page.getByTestId('field-brand-error')).toHaveText('Make is required');
  await expect(page.getByTestId('field-model-error')).toBeVisible();
  await expect(page.getByTestId('field-daily-rate-error')).toBeVisible();
  await expect(page.getByTestId('field-pickup-address-error')).toBeVisible();
  await expect(page.getByTestId('listing-form')).toBeVisible();

  const after = ((await (await request.get('/api/cars')).json()) as unknown[]).length;
  expect(after).toBe(before);
});

test('EDGE: filters with no match show the empty state and can be cleared', async ({ page }) => {
  await openMarketplace(page);
  await page.getByTestId('filter-make').fill('zzz-no-such-make');
  await expect(page.getByTestId('empty-state')).toContainText('No cars match your filters');
  await expect(page.getByTestId('car-card')).toHaveCount(0);
  await expect(page.getByTestId('result-count')).toHaveText('0 cars');

  await page.getByTestId('empty-clear-filters').click();
  await expect(page.getByTestId('car-card').first()).toBeVisible();
  await expect(page.getByTestId('filter-make')).toHaveValue('');

  await page.getByTestId('filter-max-price').fill('-5');
  await expect(page.getByTestId('filter-max-price-error')).toHaveText('Max price must be a positive number');
  await expect(page.getByTestId('car-card').first()).toBeVisible();
});
