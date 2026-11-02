import { test, expect } from '@playwright/test';
import { openMarketplace, resetStore } from './helpers';

test.beforeEach(async ({ request }) => {
  await resetStore(request);
});

test('TR-2: Search and Filtering', async ({ page }) => {
  await openMarketplace(page);
  await expect(page.getByTestId('car-card').filter({ hasText: 'Bronco' })).toHaveCount(1);
  await expect(page.getByTestId('car-card').filter({ hasText: 'M3' })).toHaveCount(1);

  let navigations = 0;
  page.on('framenavigated', () => {
    navigations += 1;
  });
  const navigationsBefore = navigations;

  await page.getByTestId('filter-make').fill('Tesla');
  await expect(page.getByTestId('car-card').filter({ hasText: 'Bronco' })).toHaveCount(0);
  await expect(page.getByTestId('car-card').filter({ hasText: 'M3' })).toHaveCount(0);
  await expect(page.getByTestId('car-card').filter({ hasText: 'Model Y' })).toHaveCount(1);

  await page.getByTestId('filter-max-price').fill('90');
  await expect(page.getByTestId('car-card')).toHaveCount(1);
  const card = page.getByTestId('car-card').first();
  await expect(card).toContainText('Tesla');
  await expect(card.getByTestId('car-price')).toContainText('$85/day');
  await expect(page.getByTestId('result-count')).toHaveText('1 car');
  expect(navigations).toBe(navigationsBefore);
});
