import { test, expect } from '@playwright/test';
import {
  OWNER_ID,
  RENTER_ID,
  createListingAsOwner,
  requestBooking,
  resetStore,
  startAs,
  type ListingValues,
} from './helpers';

test.beforeEach(async ({ request }) => {
  await resetStore(request);
});

test('TR-6: Data Persistence', async ({ page }) => {
  const brand = `Persist${Date.now()}`;
  const listing: ListingValues = {
    brand,
    model: 'Roadster',
    year: '2022',
    dailyRate: '64.5',
    cleaningFee: '18',
    seats: '4',
    fuel: 'Hybrid',
    transmission: 'Manual',
    imageUrl: 'https://images.unsplash.com/photo-1555215695-3004980adade',
    city: 'Austin',
    pickupAddress: 'Persistence Plaza 7',
    instructions: 'Ring the bell twice.',
  };
  const car = await createListingAsOwner(page, listing);
  await expect(page.getByTestId('toast').filter({ hasText: 'Listing created' })).toBeVisible();

  await startAs(page, RENTER_ID);
  const response = await requestBooking(page, 'car_02', '2026-12-10', '2026-12-12');
  expect(response.status()).toBe(201);
  const booking = await response.json();
  await expect(page.getByTestId('booking-success')).toBeVisible();

  await page.reload();
  await page.goto('/');
  await expect(page.getByTestId('result-count')).toBeVisible();
  const card = page.locator(`[data-testid=car-card][data-id=${car.id}]`);
  await expect(card).toBeVisible();
  await expect(card).toContainText(brand);
  await expect(card.getByTestId('car-price')).toContainText('$64.50/day');
  await expect(card.getByTestId('car-location')).toContainText('Persistence Plaza 7');

  await page.goto('/my-bookings');
  await page.reload();
  const bookingCard = page.locator(`[data-testid=booking-card][data-id=${booking.id}]`);
  await expect(bookingCard).toBeVisible();
  await expect(bookingCard.getByTestId('status-badge')).toHaveText('Pending');
  await expect(bookingCard.getByTestId('booking-total')).toHaveText('$255.00');

  await startAs(page, OWNER_ID, '/owner/listings');
  await page.reload();
  await expect(page.locator(`[data-testid=listing-row][data-id=${car.id}]`)).toBeVisible();
  await page.goto('/owner/requests');
  await page.reload();
  const ownerBooking = page.locator(`[data-testid=booking-card][data-id=${booking.id}]`);
  await expect(ownerBooking).toBeVisible();
  await expect(ownerBooking.getByTestId('status-badge')).toHaveText('Pending');
});
