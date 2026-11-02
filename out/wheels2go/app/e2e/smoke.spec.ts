import { test, expect, type Page } from '@playwright/test';
import { OWNER_ID, resetStore, startAs } from './helpers';

test.beforeEach(async ({ request }) => {
  await resetStore(request);
});

function collectPageErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

test('SMOKE: renter routes render main content', async ({ page }) => {
  const errors = collectPageErrors(page);

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Find a car' })).toBeVisible();
  await expect(page.getByTestId('car-card').first()).toBeVisible();

  await page.goto('/cars/car_01');
  await expect(page.getByTestId('car-detail')).toHaveAttribute('data-id', 'car_01');
  await expect(page.getByTestId('detail-title')).toContainText('Tesla');
  await expect(page.getByTestId('booking-panel')).toBeVisible();

  await page.goto('/cars/car_does_not_exist');
  await expect(page.getByTestId('not-found')).toContainText('Car not found');

  await page.goto('/my-bookings');
  await expect(page.getByRole('heading', { name: 'My Bookings' })).toBeVisible();
  await expect(page.locator('[data-testid=booking-card][data-id=book_301]')).toBeVisible();

  await page.goto('/owner/listings');
  await expect(page.getByTestId('access-denied')).toContainText('This page is not available for your account.');

  expect(errors).toEqual([]);
});

test('SMOKE: owner routes render main content', async ({ page }) => {
  const errors = collectPageErrors(page);
  await startAs(page, OWNER_ID);

  await page.goto('/owner/listings');
  await expect(page.getByRole('heading', { name: 'My Listings' })).toBeVisible();
  await expect(page.locator('[data-testid=listing-row][data-id=car_01]')).toBeVisible();

  await page.goto('/owner/listings/new');
  await expect(page.getByTestId('listing-form')).toBeVisible();

  await page.goto('/owner/listings/car_01/edit');
  await expect(page.getByTestId('listing-form')).toBeVisible();
  await expect(page.getByTestId('field-brand')).toHaveValue('Tesla');

  await page.goto('/owner/requests');
  await expect(page.getByRole('heading', { name: 'Booking Requests' })).toBeVisible();
  await expect(page.locator('[data-testid=booking-card][data-id=book_301]')).toBeVisible();

  await page.goto('/owner/earnings');
  await expect(page.getByRole('heading', { name: 'Earnings' })).toBeVisible();
  await expect(page.getByTestId('stat-confirmed-revenue')).toHaveText('$280.00');
  await expect(page.getByTestId('earnings-empty')).toContainText('No completed rentals yet.');

  await page.goto('/my-bookings');
  await expect(page.getByTestId('access-denied')).toBeVisible();

  expect(errors).toEqual([]);
});
