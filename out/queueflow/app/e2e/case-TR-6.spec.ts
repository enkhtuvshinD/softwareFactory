import { test, expect } from '@playwright/test';
import { BRANCH, USER, apiCall, averageMinutes, numberFrom, openAs, resetStore, todaysTickets } from './support';

test.beforeEach(async ({ request }) => {
  await resetStore(request);
});

test('TR-6: Admin Analytics', async ({ page, request }) => {
  await openAs(page, USER.jordan, '/admin');
  await expect(page.getByTestId('stat-total')).toHaveText('11');
  await expect(page.getByTestId('stat-completed')).toHaveText('3');
  await expect(page.getByTestId('stat-avg-service')).toHaveText('11.3 min');
  await expect(page.getByTestId('stat-avg-wait')).toHaveText('13.8 min');

  expect((await apiCall(request, USER.sarah, 'POST', '/api/tickets/tkt_003/complete')).status).toBe(200);
  expect((await apiCall(request, USER.michael, 'POST', '/api/tickets/tkt_004/complete')).status).toBe(200);
  const called = await apiCall(request, USER.sarah, 'POST', '/api/queue/call-next');
  expect(called.status).toBe(200);
  const calledId: string = called.body.id;
  expect((await apiCall(request, USER.sarah, 'POST', `/api/tickets/${calledId}/start`)).status).toBe(200);
  expect((await apiCall(request, USER.sarah, 'POST', `/api/tickets/${calledId}/complete`)).status).toBe(200);

  const tickets = await todaysTickets(request);
  const completed = tickets.filter((ticket) => ticket.status === 'completed');
  const count = (status: string) => tickets.filter((ticket) => ticket.status === status).length;
  expect(completed.length).toBe(6);

  await expect(page.getByTestId('stat-total')).toHaveText(String(tickets.length), { timeout: 10_000 });
  await expect(page.getByTestId('stat-completed')).toHaveText('6', { timeout: 10_000 });
  await expect(page.getByTestId('stat-waiting')).toHaveText(String(count('waiting')));
  await expect(page.getByTestId('stat-serving')).toHaveText(String(count('serving')));
  await expect(page.getByTestId('stat-called')).toHaveText(String(count('called')));
  await expect(page.getByTestId('stat-cancelled')).toHaveText(String(count('cancelled')));
  await expect(page.getByTestId('stat-no-show')).toHaveText(String(count('no_show')));

  const expectedService = averageMinutes(completed.map((ticket) => [ticket.startedAt, ticket.endedAt] as [string, string]));
  const expectedWait = averageMinutes(
    tickets.filter((ticket) => ticket.startedAt).map((ticket) => [ticket.createdAt, ticket.startedAt] as [string, string]),
  );
  expect(Math.abs(numberFrom(await page.getByTestId('stat-avg-service').textContent()) - expectedService)).toBeLessThanOrEqual(0.1);
  expect(Math.abs(numberFrom(await page.getByTestId('stat-avg-wait').textContent()) - expectedWait)).toBeLessThanOrEqual(0.1);

  const centralCompleted = completed.filter((ticket) => ticket.branchId === BRANCH.central).length;
  const downtownCompleted = completed.filter((ticket) => ticket.branchId === BRANCH.downtown).length;
  await expect(page.locator(`[data-testid=branch-compare-row][data-id="${BRANCH.central}"]`).getByTestId('compare-completed')).toHaveText(String(centralCompleted));
  await expect(page.locator(`[data-testid=branch-compare-row][data-id="${BRANCH.downtown}"]`).getByTestId('compare-completed')).toHaveText(String(downtownCompleted));
  await expect(page.locator('[data-testid=status-row][data-id=completed]').getByTestId('status-row-count')).toHaveText('6');

  await page.reload();
  await expect(page.getByTestId('stat-completed')).toHaveText('6');
});
