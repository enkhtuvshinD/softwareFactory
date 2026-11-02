import { test, expect } from '@playwright/test';
import {
  RENTER_ID,
  TESLA_LISTING,
  createListingAsOwner,
  openMarketplace,
  resetStore,
  switchAccount,
} from './helpers';

test.beforeEach(async ({ request }) => {
  await resetStore(request);
});

test('TR-1: Car Listing Creation', async ({ page }) => {
  await createListingAsOwner(page, TESLA_LISTING);
  await expect(page.getByTestId('toast').filter({ hasText: 'Listing created' })).toBeVisible();
  await expect(page.getByTestId('listing-row').filter({ hasText: 'Tesla Model Y 2023' })).toBeVisible();

  await switchAccount(page, RENTER_ID);
  await openMarketplace(page);
  const card = page.getByTestId('car-card').filter({ hasText: 'Tesla Model Y 2023' });
  await expect(card).toHaveCount(1);
  await expect(card.getByTestId('car-price')).toContainText('$85/day');
  await expect(card.getByTestId('car-location')).toContainText('Airport Hub');
  await expect(card.getByTestId('availability-badge')).toContainText('Available');
});
