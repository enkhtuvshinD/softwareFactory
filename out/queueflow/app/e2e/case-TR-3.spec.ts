import { test, expect } from '@playwright/test';
import { USER, apiCall, callNext, openAs, openInNewContext, resetStore, ticketCard } from './support';

test.beforeEach(async ({ request }) => {
  await resetStore(request);
});

test('TR-3: Real-Time Status Synchronization', async ({ page, request, browser, baseURL }) => {
  const finished = await apiCall(request, USER.david, 'POST', '/api/tickets/tkt_010/complete');
  expect(finished.status).toBe(200);

  await openAs(page, USER.alex, '/customer/tickets');
  const card = ticketCard(page, 'DWN-GC-003');
  await expect(card).toBeVisible();
  await expect(card.getByTestId('ticket-status')).toContainText('Waiting');
  await page.evaluate(() => {
    (window as unknown as { __noReload: boolean }).__noReload = true;
  });

  const staffPage = await openInNewContext(browser, baseURL, USER.david, '/staff');
  await callNext(staffPage, 'DWN-GC-003');

  await expect(card.getByTestId('ticket-status')).toContainText('Called', { timeout: 10_000 });
  await expect(card.getByTestId('ticket-message')).toContainText('Proceed to counter 1');
  const stillSamePage = await page.evaluate(() => (window as unknown as { __noReload?: boolean }).__noReload === true);
  expect(stillSamePage).toBe(true);

  await staffPage.context().close();
});
