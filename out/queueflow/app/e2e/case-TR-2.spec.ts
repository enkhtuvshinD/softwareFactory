import { test, expect } from '@playwright/test';
import { BRANCH, SERVICE, USER, apiCall, callNext, openAs, resetStore, staffAction, staffServeCurrent } from './support';

test.beforeEach(async ({ request }) => {
  await resetStore(request);
});

test('TR-2: FIFO Queue Processing', async ({ page, request }) => {
  test.setTimeout(90_000);

  const created: string[] = [];
  for (const [userId, serviceId] of [
    [USER.alex, SERVICE.general],
    [USER.emma, SERVICE.support],
    [USER.james, SERVICE.general],
  ] as const) {
    const result = await apiCall(request, userId, 'POST', '/api/tickets', { branchId: BRANCH.central, serviceId });
    expect(result.status).toBe(201);
    created.push(result.body.ticketNumber);
  }
  expect(new Set(created).size).toBe(3);

  await openAs(page, USER.sarah, '/staff');
  await expect(page.getByTestId('current-ticket-number')).toHaveText('CEN-GC-002');
  await staffAction(page, 'btn-complete', '/complete');
  await expect(page.getByTestId('current-empty')).toBeVisible();

  const expectedOrder = ['CEN-GC-003', 'CEN-DV-002', ...created];
  const processed: string[] = [];
  for (const expectedNumber of expectedOrder) {
    await callNext(page, expectedNumber);
    processed.push((await page.getByTestId('current-ticket-number').textContent())?.trim() ?? '');
    await staffServeCurrent(page, expectedNumber);
  }
  expect(processed).toEqual(expectedOrder);
  await expect(page.getByTestId('waiting-empty')).toBeVisible();
});
