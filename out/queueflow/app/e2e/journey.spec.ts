import { test, expect } from '@playwright/test';
import {
  SERVICE,
  BRANCH,
  USER,
  callNext,
  chooseBranchAndService,
  isTicketCreation,
  openAs,
  openInNewContext,
  resetStore,
  staffAction,
  staffServeCurrent,
  ticketCard,
} from './support';

test.beforeEach(async ({ request }) => {
  await resetStore(request);
});

test('JOURNEY: customer ticket is called, served and reflected in admin analytics', async ({ page, browser, baseURL }) => {
  test.setTimeout(120_000);

  await openAs(page, USER.alex, '/customer');
  await page.getByTestId('persona-switcher').selectOption(USER.emma);
  await expect(page.getByTestId('current-user')).toContainText('Emma Brown');
  await page.goto('/customer');
  await chooseBranchAndService(page, BRANCH.central, SERVICE.general);
  await page.getByTestId('book-mode-walkin').check();
  const [created] = await Promise.all([
    page.waitForResponse(isTicketCreation),
    page.getByTestId('book-submit').click(),
  ]);
  expect(created.status()).toBe(201);

  const result = page.getByTestId('ticket-result');
  await expect(result.getByTestId('ticket-number')).toHaveText('CEN-GC-005');
  await expect(result.getByTestId('ticket-status')).toContainText('Waiting');
  await expect(result.getByTestId('ticket-position')).toHaveText(/Position 3/);
  await expect(result.getByTestId('ticket-wait')).toHaveText(/Est\. wait 25 min/);

  await page.getByTestId('nav-tickets').click();
  await expect(page).toHaveURL(/\/customer\/tickets/);
  const card = ticketCard(page, 'CEN-GC-005');
  await expect(card.getByTestId('ticket-status')).toContainText('Waiting');
  await expect(card.getByTestId('ticket-position')).toHaveText(/Position 3/);
  await expect(card.getByTestId('ticket-wait')).toHaveText(/Est\. wait 25 min/);
  await page.evaluate(() => {
    (window as unknown as { __noReload: boolean }).__noReload = true;
  });

  const staffPage = await openInNewContext(browser, baseURL, USER.alex, '/staff');
  await staffPage.getByTestId('persona-switcher').selectOption(USER.michael);
  await expect(staffPage.getByTestId('current-user')).toContainText('Michael Chen');
  await expect(staffPage.getByTestId('staff-branch')).toHaveText('Central Branch');
  await expect(staffPage.getByTestId('staff-counter')).toHaveText('Counter 2');
  await expect(staffPage.getByTestId('current-ticket-number')).toHaveText('CEN-CS-001');
  await expect(staffPage.getByTestId('btn-call-next')).toBeDisabled();
  await expect(staffPage.getByTestId('action-reason')).toBeVisible();
  await staffAction(staffPage, 'btn-complete', '/complete');
  await expect(staffPage.getByTestId('current-empty')).toBeVisible();

  await callNext(staffPage, 'CEN-GC-003');
  await staffServeCurrent(staffPage, 'CEN-GC-003');
  await callNext(staffPage, 'CEN-DV-002');
  await staffServeCurrent(staffPage, 'CEN-DV-002');
  await callNext(staffPage, 'CEN-GC-005');
  await expect(staffPage.getByTestId('current-customer')).toContainText('Emma Brown');

  await expect(card.getByTestId('ticket-status')).toContainText('Called', { timeout: 10_000 });
  await expect(card.getByTestId('ticket-message')).toContainText('Proceed to counter 2');
  expect(await page.evaluate(() => (window as unknown as { __noReload?: boolean }).__noReload === true)).toBe(true);

  await staffAction(staffPage, 'btn-start', '/start');
  await expect(card.getByTestId('ticket-status')).toContainText('Serving', { timeout: 10_000 });
  await expect(card.getByTestId('ticket-message')).toContainText('Being served at counter 2');
  await staffAction(staffPage, 'btn-complete', '/complete');
  await expect(staffPage.getByTestId('current-empty')).toBeVisible();

  await page.getByTestId('nav-history').click();
  const historyRow = page.locator('[data-testid=history-row][data-number="CEN-GC-005"]');
  await expect(historyRow.getByTestId('history-status')).toContainText('Completed');
  await expect(historyRow.getByTestId('history-branch')).toContainText('Central Branch');

  await staffPage.getByTestId('persona-switcher').selectOption(USER.jordan);
  await expect(staffPage.getByTestId('current-user')).toContainText('Jordan Ellis');
  await staffPage.goto('/admin');
  await expect(staffPage.getByTestId('stat-completed')).toHaveText('7');
  await expect(staffPage.getByTestId('stat-total')).toHaveText('12');
  await expect(staffPage.getByTestId('stat-serving')).toHaveText('2');
  await expect(staffPage.getByTestId('stat-waiting')).toHaveText('1');
  await expect(staffPage.getByTestId('stat-avg-service')).toHaveText(/^\d+\.\d min$/);

  await staffPage.reload();
  await expect(staffPage.getByTestId('stat-completed')).toHaveText('7');
  await expect(staffPage.getByTestId('stat-total')).toHaveText('12');
  await expect(staffPage.locator(`[data-testid=branch-compare-row][data-id="${BRANCH.central}"]`).getByTestId('compare-completed')).toHaveText('6');

  await page.reload();
  await page.getByTestId('nav-history').click();
  await expect(page.locator('[data-testid=history-row][data-number="CEN-GC-005"]').getByTestId('history-status')).toContainText('Completed');

  await openAs(staffPage, USER.michael, '/staff');
  await expect(staffPage.getByTestId('staff-completed-today')).toHaveText('5');

  await staffPage.context().close();
});
