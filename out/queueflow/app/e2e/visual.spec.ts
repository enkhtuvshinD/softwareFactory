import { mkdir } from 'node:fs/promises';
import { test, expect, type Page, type TestInfo } from '@playwright/test';
import { BRANCH, SERVICE, USER, TICKET_NUMBER_PATTERN, chooseBranchAndService, isTicketCreation, openAs, resetStore } from './support';

test.describe.configure({ mode: 'serial' });

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
} as const;

type ViewportName = keyof typeof VIEWPORTS;

async function prepareAndAwaitPrimary(page: Page): Promise<void> {
  await openAs(page, USER.alex, '/customer');
  await page.getByTestId('persona-switcher').selectOption(USER.emma);
  await expect(page.getByTestId('current-user')).toContainText('Emma Brown');
  await page.goto('/customer');
  await chooseBranchAndService(page, BRANCH.central, SERVICE.general);
  await page.getByTestId('book-mode-walkin').check();
  const [response] = await Promise.all([page.waitForResponse(isTicketCreation), page.getByTestId('book-submit').click()]);
  expect(response.status()).toBe(201);
  await expect(page.getByTestId('ticket-result')).toBeVisible();
  await page.getByTestId('nav-tickets').click();
  const card = page.getByTestId('ticket-card').filter({ has: page.getByTestId('ticket-number') }).first();
  await expect(card).toBeVisible();
  await expect(card.getByTestId('ticket-number')).toHaveText(TICKET_NUMBER_PATTERN);
  await expect(card.getByTestId('ticket-status')).toContainText('Waiting');
  await expect(card.getByTestId('ticket-position')).toBeVisible();
  await expect(card.getByTestId('ticket-wait')).toBeVisible();
}

async function prepareAndAwaitStaffDesk(page: Page): Promise<void> {
  await openAs(page, USER.alex, '/staff');
  await page.getByTestId('persona-switcher').selectOption(USER.michael);
  await expect(page.getByTestId('current-user')).toContainText('Michael Chen');
  await expect(page.getByTestId('staff-current')).toBeVisible();
  await expect(page.getByTestId('current-ticket-number')).toHaveText('CEN-CS-001');
  await expect(page.getByTestId('btn-complete')).toBeEnabled();
  await expect(page.getByTestId('waiting-row').first()).toBeVisible();
  await expect(page.getByTestId('action-reason')).toBeVisible();
}

async function prepareAndAwaitAdminDashboard(page: Page): Promise<void> {
  await openAs(page, USER.alex, '/admin');
  await page.getByTestId('persona-switcher').selectOption(USER.jordan);
  await expect(page.getByTestId('current-user')).toContainText('Jordan Ellis');
  await page.goto('/admin');
  await expect(page.getByTestId('stat-completed')).toHaveText(/^\d+$/);
  await expect(page.getByTestId('chart-branches')).toBeVisible();
  await expect(page.locator('[data-testid=branch-compare-row]')).toHaveCount(2);
}

const TARGETS: Array<{ id: string; prepare: (page: Page) => Promise<void> }> = [
  { id: 'primary', prepare: prepareAndAwaitPrimary },
  { id: 'staff-desk', prepare: prepareAndAwaitStaffDesk },
  { id: 'admin-dashboard', prepare: prepareAndAwaitAdminDashboard },
];

async function findUnlabelledControls(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const selector = 'button, a[href], select, input:not([type=hidden]), textarea, [role=button]';
    const unlabelled: string[] = [];
    document.querySelectorAll<HTMLElement>(selector).forEach((element) => {
      const rect = element.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const labelled =
        element.getAttribute('aria-label') ||
        element.getAttribute('aria-labelledby') ||
        element.getAttribute('title') ||
        (element.textContent ?? '').trim() ||
        ((element as HTMLInputElement).labels?.length ?? 0) > 0;
      if (!labelled) unlabelled.push(element.outerHTML.slice(0, 120));
    });
    return unlabelled;
  });
}

async function findBrokenImages(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    Array.from(document.images)
      .filter((image) => image.getBoundingClientRect().width > 0 && image.complete && image.naturalWidth === 0)
      .map((image) => image.src),
  );
}

async function captureTarget(page: Page, testInfo: TestInfo, viewportName: ViewportName, targetId: string): Promise<void> {
  await page.setViewportSize(VIEWPORTS[viewportName]);
  const target = TARGETS.find((candidate) => candidate.id === targetId);
  if (!target) throw new Error(`Unknown visual target ${targetId}`);
  await target.prepare(page);

  const overflow = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.innerWidth + 1);

  expect(await findUnlabelledControls(page)).toEqual([]);
  expect(await findBrokenImages(page)).toEqual([]);

  await page.keyboard.press('Tab');
  const focusedTag = await page.evaluate(() => document.activeElement?.tagName ?? 'BODY');
  expect(focusedTag).not.toBe('BODY');

  await page.evaluate(() => window.scrollTo(0, 0));
  await mkdir('visual-evidence', { recursive: true });
  const path = `visual-evidence/${viewportName}-${targetId}.png`;
  await page.screenshot({ path, fullPage: true, animations: 'disabled' });
  await testInfo.attach(`${viewportName}-${targetId}`, { path, contentType: 'image/png' });
}

test.beforeEach(async ({ request }) => {
  await resetStore(request);
});

for (const target of TARGETS) {
  for (const viewportName of Object.keys(VIEWPORTS) as ViewportName[]) {
    test(`VISUAL: ${viewportName} ${target.id}`, async ({ page }, testInfo) => {
      await captureTarget(page, testInfo, viewportName, target.id);
    });
  }
}
