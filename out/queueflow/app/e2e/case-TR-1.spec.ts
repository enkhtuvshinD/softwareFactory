import { test, expect } from '@playwright/test';
import { BRANCH, SERVICE, USER, TICKET_NUMBER_PATTERN, chooseBranchAndService, isTicketCreation, openAs, resetStore, todaysTickets } from './support';

test.beforeEach(async ({ request }) => {
  await resetStore(request);
});

test('TR-1: Queue Ticket Generation', async ({ page, request }) => {
  const before = (await todaysTickets(request)).map((ticket) => ticket.ticketNumber);

  await openAs(page, USER.emma, '/customer');
  await expect(page.getByTestId('branch-card').first()).toBeVisible();
  await chooseBranchAndService(page, BRANCH.central, SERVICE.general);
  await page.getByTestId('book-mode-walkin').check();

  const [response] = await Promise.all([
    page.waitForResponse(isTicketCreation),
    page.getByTestId('book-submit').click(),
  ]);
  expect(response.status()).toBe(201);

  const result = page.getByTestId('ticket-result');
  await expect(result).toBeVisible();
  const number = (await result.getByTestId('ticket-number').textContent())?.trim() ?? '';
  expect(number).toMatch(TICKET_NUMBER_PATTERN);
  expect(number).toBe('CEN-GC-005');
  expect(before).not.toContain(number);
  await expect(result.getByTestId('ticket-status')).toContainText('Waiting');

  const after = (await todaysTickets(request)).map((ticket) => ticket.ticketNumber);
  expect(after.filter((candidate) => candidate === number)).toHaveLength(1);
  expect(new Set(after).size).toBe(after.length);

  await page.reload();
  await page.getByTestId('nav-tickets').click();
  await expect(page.locator(`[data-testid=ticket-card][data-number="${number}"]`)).toBeVisible();
});
