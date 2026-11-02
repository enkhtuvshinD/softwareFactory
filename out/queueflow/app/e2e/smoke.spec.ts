import { test, expect } from '@playwright/test';
import { BRANCH, USER, openAs, resetStore, trackPageErrors } from './support';

test.beforeEach(async ({ request }) => {
  await resetStore(request);
});

const AUTHENTICATED_ROUTES = [
  { path: '/customer', user: USER.emma, ready: 'branch-card' },
  { path: '/customer/services', user: USER.emma, ready: 'service-card' },
  { path: '/customer/tickets', user: USER.emma, ready: 'appointment-card' },
  { path: '/customer/history', user: USER.emma, ready: 'history-row' },
  { path: '/staff', user: USER.michael, ready: 'staff-current' },
  { path: '/admin', user: USER.jordan, ready: 'chart-branches' },
  { path: '/admin/monitor', user: USER.jordan, ready: 'monitor-row' },
  { path: '/admin/branches', user: USER.jordan, ready: 'branch-row' },
  { path: '/admin/services', user: USER.jordan, ready: 'service-row' },
  { path: '/admin/staff', user: USER.jordan, ready: 'staff-row' },
];

for (const route of AUTHENTICATED_ROUTES) {
  test(`SMOKE: ${route.path} renders for its role`, async ({ page }) => {
    const errors = trackPageErrors(page);
    await openAs(page, route.user, route.path);
    await expect(page.getByTestId(route.ready).first()).toBeVisible();
    await expect(page.getByTestId('forbidden-state')).toHaveCount(0);
    await expect(page.getByTestId('error-state')).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}

test('SMOKE: /display?branchId renders now calling and up next', async ({ page }) => {
  const errors = trackPageErrors(page);
  await page.goto(`/display?branchId=${BRANCH.central}`);
  await expect(page.getByTestId('display-title')).toContainText('Central Branch');
  await expect(page.getByTestId('now-calling-item').first()).toBeVisible();
  await expect(page.getByTestId('up-next-item').first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('SMOKE: /display without branchId offers a branch selector', async ({ page }) => {
  const errors = trackPageErrors(page);
  await page.goto('/display');
  const select = page.getByTestId('display-branch-select');
  await expect(select).toBeVisible();
  await select.selectOption(BRANCH.downtown);
  await expect(page.getByTestId('display-title')).toContainText('Downtown Branch');
  expect(errors).toEqual([]);
});

test('SMOKE: unknown route shows a not-found page', async ({ page }) => {
  const errors = trackPageErrors(page);
  await openAs(page, USER.emma, '/customer');
  await page.goto('/this-route-does-not-exist');
  await expect(page.getByText('Page not found')).toBeVisible();
  expect(errors).toEqual([]);
});
