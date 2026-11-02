import { test, expect } from '@playwright/test';
import { BRANCH, SERVICE, USER, apiCall, chooseBranchAndService, isTicketCreation, openAs, resetStore } from './support';

test.beforeEach(async ({ request }) => {
  await resetStore(request);
});

test('EDGE: duplicate walk-in ticket for the same branch and service is blocked', async ({ page, request }) => {
  await openAs(page, USER.emma, '/customer');
  await chooseBranchAndService(page, BRANCH.central, SERVICE.general);
  const [first] = await Promise.all([page.waitForResponse(isTicketCreation), page.getByTestId('book-submit').click()]);
  expect(first.status()).toBe(201);
  await expect(page.getByTestId('ticket-result')).toBeVisible();

  await page.getByRole('button', { name: 'Book another' }).click();
  await chooseBranchAndService(page, BRANCH.central, SERVICE.general);
  const [second] = await Promise.all([page.waitForResponse(isTicketCreation), page.getByTestId('book-submit').click()]);
  expect(second.status()).toBe(409);
  await expect(page.getByTestId('form-error')).toBeVisible();
  await expect(page.getByTestId('form-error')).not.toHaveText('');

  const mine = await apiCall(request, USER.emma, 'GET', '/api/tickets/mine');
  const active = (mine.body as any[]).filter(
    (ticket) => ticket.branchId === BRANCH.central && ticket.serviceId === SERVICE.general && ['waiting', 'called', 'serving'].includes(ticket.status),
  );
  expect(active).toHaveLength(1);

  await resetStore(request);
  const [one, two] = await Promise.all([
    apiCall(request, USER.alex, 'POST', '/api/tickets', { branchId: BRANCH.central, serviceId: SERVICE.docs }),
    apiCall(request, USER.alex, 'POST', '/api/tickets', { branchId: BRANCH.central, serviceId: SERVICE.docs }),
  ]);
  expect([one.status, two.status].sort()).toEqual([201, 409]);
  const rejected = one.status === 409 ? one : two;
  expect(rejected.body.error.code).toBe('DUPLICATE_TICKET');
});

test('EDGE: staff cannot call next while busy and Call Next is disabled with a reason', async ({ page, request }) => {
  await openAs(page, USER.sarah, '/staff');
  await expect(page.getByTestId('current-ticket-number')).toHaveText('CEN-GC-002');
  await expect(page.getByTestId('btn-call-next')).toBeDisabled();
  await expect(page.getByTestId('action-reason')).toBeVisible();
  await expect(page.getByTestId('action-reason')).not.toHaveText('');
  await expect(page.getByTestId('btn-complete')).toBeEnabled();

  const busy = await apiCall(request, USER.sarah, 'POST', '/api/queue/call-next');
  expect(busy.status).toBe(409);
  expect(busy.body.error.code).toBe('STAFF_BUSY');
  await expect(page.getByTestId('current-ticket-number')).toHaveText('CEN-GC-002');
  await expect(page.locator('[data-testid=waiting-row][data-number="CEN-GC-003"]')).toBeVisible();
});

test('EDGE: role boundaries are enforced in the UI and the API', async ({ page, request }) => {
  await openAs(page, USER.emma, '/admin');
  await expect(page.getByTestId('forbidden-state')).toBeVisible();
  await expect(page.getByTestId('stat-total')).toHaveCount(0);

  const customerStats = await apiCall(request, USER.emma, 'GET', '/api/admin/stats');
  expect(customerStats.status).toBe(403);
  expect(customerStats.body.error.code).toBe('FORBIDDEN');

  const customerCallNext = await apiCall(request, USER.emma, 'POST', '/api/queue/call-next');
  expect(customerCallNext.status).toBe(403);

  const unknown = await apiCall(request, 'usr_does_not_exist', 'GET', '/api/branches');
  expect(unknown.status).toBe(401);
  expect(unknown.body.error.code).toBe('UNKNOWN_USER');
});
