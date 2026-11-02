import { expect, type APIRequestContext, type Page } from '@playwright/test';

export const OWNER_ID = 'usr_101';
export const RENTER_ID = 'usr_102';

export async function resetStore(request: APIRequestContext) {
  const response = await request.post('/api/reset');
  expect(response.ok()).toBeTruthy();
}

export async function openMarketplace(page: Page) {
  await page.goto('/');
  await expect(page.getByTestId('result-count')).toBeVisible();
  await expect(page.getByTestId('car-card').first()).toBeVisible();
}

export async function switchAccount(page: Page, userId: string) {
  await page.getByTestId('account-switcher').selectOption(userId);
  await expect(page.getByTestId('account-switcher')).toHaveValue(userId);
}

export async function startAs(page: Page, userId: string, path = '/') {
  await page.goto('/');
  await expect(page.getByTestId('account-switcher')).toBeVisible();
  await switchAccount(page, userId);
  if (path !== '/') {
    await page.goto(path);
  }
  await expect(page.getByTestId('account-switcher')).toHaveValue(userId);
}

export function isoDate(offsetDays: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

export type ListingValues = {
  brand: string;
  model: string;
  year: string;
  dailyRate: string;
  cleaningFee: string;
  seats: string;
  fuel: string;
  transmission: string;
  imageUrl: string;
  city: string;
  pickupAddress: string;
  instructions: string;
};

export const TESLA_LISTING: ListingValues = {
  brand: 'Tesla',
  model: 'Model Y',
  year: '2023',
  dailyRate: '85',
  cleaningFee: '25',
  seats: '5',
  fuel: 'Electric',
  transmission: 'Automatic',
  imageUrl: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89',
  city: 'Miami',
  pickupAddress: 'Airport Hub',
  instructions: 'Meet at the hub entrance and call on arrival.',
};

export async function fillListingForm(page: Page, values: ListingValues) {
  await page.getByTestId('field-brand').fill(values.brand);
  await page.getByTestId('field-model').fill(values.model);
  await page.getByTestId('field-year').fill(values.year);
  await page.getByTestId('field-fuel').selectOption(values.fuel);
  await page.getByTestId('field-transmission').selectOption(values.transmission);
  await page.getByTestId('field-seats').fill(values.seats);
  await page.getByTestId('field-daily-rate').fill(values.dailyRate);
  await page.getByTestId('field-cleaning-fee').fill(values.cleaningFee);
  await page.getByTestId('field-image-url').fill(values.imageUrl);
  await page.getByTestId('field-city').fill(values.city);
  await page.getByTestId('field-pickup-address').fill(values.pickupAddress);
  await page.getByTestId('field-instructions').fill(values.instructions);
}

export async function createListingAsOwner(page: Page, values: ListingValues) {
  await startAs(page, OWNER_ID, '/owner/listings');
  await page.getByTestId('add-listing').click();
  await expect(page.getByTestId('listing-form')).toBeVisible();
  await fillListingForm(page, values);
  const responsePromise = page.waitForResponse(
    (r) => r.url().endsWith('/api/cars') && r.request().method() === 'POST',
  );
  await page.getByTestId('listing-save').click();
  const response = await responsePromise;
  expect(response.status()).toBe(201);
  const car = await response.json();
  return car as { id: string };
}

export async function requestBooking(page: Page, carId: string, start: string, end: string) {
  await page.goto(`/cars/${carId}`);
  await expect(page.getByTestId('booking-panel')).toBeVisible();
  await page.getByTestId('booking-start').fill(start);
  await page.getByTestId('booking-end').fill(end);
  const responsePromise = page.waitForResponse(
    (r) => r.url().endsWith('/api/bookings') && r.request().method() === 'POST',
  );
  await page.getByTestId('booking-submit').click();
  return responsePromise;
}
