import { test, expect, type Page } from '@playwright/test';
import { BRANCH, SERVICE, USER, addDays, apiCall, businessDate, chooseBranchAndService, openAs, openInNewContext, resetStore } from './support';

test.beforeEach(async ({ request }) => {
  await resetStore(request);
});

async function fillAppointmentForm(page: Page, date: string, serviceId: string): Promise<void> {
  await chooseBranchAndService(page, BRANCH.downtown, serviceId);
  await page.getByTestId('book-mode-appointment').check();
  await page.getByTestId('book-date').fill(date);
}

test('TR-5: Appointment Conflict Prevention', async ({ page, request, browser, baseURL }) => {
  const tomorrow = addDays(await businessDate(request), 1);

  await openAs(page, USER.alex, '/customer');
  await fillAppointmentForm(page, tomorrow, SERVICE.general);
  const firstAvailable = page.locator('[data-testid=slot][data-available="true"]').first();
  await expect(firstAvailable).toBeVisible();
  const startTime = (await firstAvailable.getAttribute('data-id')) ?? '';
  expect(startTime).toMatch(/^\d{2}:\d{2}$/);
  await firstAvailable.click();

  const [booked] = await Promise.all([
    page.waitForResponse((r) => new URL(r.url()).pathname === '/api/appointments' && r.request().method() === 'POST'),
    page.getByTestId('book-submit').click(),
  ]);
  expect(booked.status()).toBe(201);
  await expect(page.getByTestId('appointment-result')).toBeVisible();
  await expect(page.getByTestId('appointment-time')).toContainText(startTime);

  const sameService = await apiCall(request, USER.emma, 'POST', '/api/appointments', {
    branchId: BRANCH.downtown,
    serviceId: SERVICE.general,
    date: tomorrow,
    startTime,
  });
  expect(sameService.status).toBe(409);
  expect(sameService.body.error.code).toBe('SLOT_UNAVAILABLE');

  const otherService = await apiCall(request, USER.james, 'POST', '/api/appointments', {
    branchId: BRANCH.downtown,
    serviceId: SERVICE.support,
    date: tomorrow,
    startTime,
  });
  expect(otherService.status).toBe(409);
  expect(otherService.body.error.code).toBe('SLOT_UNAVAILABLE');

  const emmaPage = await openInNewContext(browser, baseURL, USER.emma, '/customer');
  await fillAppointmentForm(emmaPage, tomorrow, SERVICE.general);
  const blockedSlot = emmaPage.locator(`[data-testid=slot][data-id="${startTime}"]`);
  await expect(blockedSlot).toHaveAttribute('data-available', 'false');
  await expect(blockedSlot).toBeDisabled();
  await expect(blockedSlot).toContainText('Unavailable');
  await emmaPage.context().close();

  const mine = await apiCall(request, USER.alex, 'GET', '/api/appointments/mine');
  const sameStart = (mine.body as any[]).filter(
    (appointment) => appointment.date === tomorrow && appointment.startTime === startTime && appointment.status === 'scheduled',
  );
  expect(sameStart).toHaveLength(1);

  const seededConflict = await apiCall(request, USER.emma, 'POST', '/api/appointments', {
    branchId: BRANCH.downtown,
    serviceId: SERVICE.general,
    date: await businessDate(request),
    startTime: '15:00',
  });
  expect(seededConflict.status).toBe(409);
  expect(seededConflict.body.error.code).toBe('SLOT_UNAVAILABLE');
});
