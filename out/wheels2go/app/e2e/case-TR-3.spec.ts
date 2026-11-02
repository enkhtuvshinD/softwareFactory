import { test, expect } from '@playwright/test';
import { openMarketplace, resetStore } from './helpers';

test.beforeEach(async ({ request }) => {
  await resetStore(request);
});

test('TR-3: Dynamic Pricing', async ({ page }) => {
  await openMarketplace(page);
  await page.getByTestId('filter-make').fill('Tesla');
  await expect(page.getByTestId('car-card')).toHaveCount(1);
  await page.getByTestId('car-card').getByTestId('car-link').click();
  await expect(page.getByTestId('car-detail')).toBeVisible();
  await expect(page.getByTestId('detail-title')).toContainText('Model Y');

  await page.getByTestId('booking-start').fill('2026-12-01');
  await page.getByTestId('booking-end').fill('2026-12-04');

  await expect(page.getByTestId('price-days')).toHaveText('3 days');
  await expect(page.getByTestId('price-daily-rate')).toHaveText('$85.00');
  await expect(page.getByTestId('price-subtotal')).toHaveText('$255.00');
  await expect(page.getByTestId('price-cleaning-fee')).toHaveText('$25.00');
  await expect(page.getByTestId('price-total')).toHaveText('$280.00');
});
