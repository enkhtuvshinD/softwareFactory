import { test, expect } from '@playwright/test';
import { BRANCH, SERVICE, USER, apiCall, clickAndExpectOk, openAs, openInNewContext, resetStore, ticketCard } from './support';

test.beforeEach(async ({ request }) => {
  await resetStore(request);
});

test('TR-4: Queue Position and Waiting Time', async ({ page, request, browser, baseURL }) => {
  const emma = await apiCall(request, USER.emma, 'POST', '/api/tickets', { branchId: BRANCH.central, serviceId: SERVICE.general });
  const james = await apiCall(request, USER.james, 'POST', '/api/tickets', { branchId: BRANCH.central, serviceId: SERVICE.support });
  expect(emma.status).toBe(201);
  expect(james.status).toBe(201);
  const emmaNumber: string = emma.body.ticketNumber;
  const jamesNumber: string = james.body.ticketNumber;

  await openAs(page, USER.emma, '/customer/tickets');
  const emmaCard = ticketCard(page, emmaNumber);
  await expect(emmaCard.getByTestId('ticket-position')).toHaveText(/Position 3/);
  await expect(emmaCard.getByTestId('ticket-wait')).toHaveText(/Est\. wait 25 min/);

  const jamesBefore = await apiCall(request, USER.james, 'GET', '/api/tickets/mine');
  const jamesTicket = (jamesBefore.body as any[]).find((ticket) => ticket.ticketNumber === jamesNumber);
  expect(jamesTicket.position).toBe(4);
  expect(jamesTicket.estimatedWaitMinutes).toBe(40);

  const staffPage = await openInNewContext(browser, baseURL, USER.sarah, '/staff');
  const tomRow = staffPage.locator('[data-testid=waiting-row][data-number="CEN-GC-003"]');
  await expect(tomRow).toBeVisible();
  await tomRow.getByTestId('waiting-cancel').click();
  await expect(staffPage.getByTestId('confirm-dialog')).toBeVisible();
  await clickAndExpectOk(staffPage, staffPage.getByTestId('confirm-yes'), '/api/tickets/tkt_005/cancel');
  await expect(tomRow).toHaveCount(0);

  await expect(emmaCard.getByTestId('ticket-position')).toHaveText(/Position 2/, { timeout: 10_000 });
  await expect(emmaCard.getByTestId('ticket-wait')).toHaveText(/Est\. wait 10 min/);

  const jamesAfter = await apiCall(request, USER.james, 'GET', '/api/tickets/mine');
  const jamesUpdated = (jamesAfter.body as any[]).find((ticket) => ticket.ticketNumber === jamesNumber);
  expect(jamesUpdated.position).toBe(3);
  expect(jamesUpdated.estimatedWaitMinutes).toBe(25);

  const omar = await apiCall(request, USER.sarah, 'GET', `/api/tickets?branchId=${BRANCH.central}`);
  const omarTicket = (omar.body as any[]).find((ticket) => ticket.ticketNumber === 'CEN-DV-002');
  expect(omarTicket.position).toBe(1);
  expect(omarTicket.estimatedWaitMinutes).toBe(0);

  await staffPage.context().close();
});
