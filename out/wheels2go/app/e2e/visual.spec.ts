import { mkdir } from 'node:fs/promises';
import { test, expect, type Page } from '@playwright/test';
import { OWNER_ID, RENTER_ID, resetStore, startAs } from './helpers';

type Target = {
  id: string;
  route: string;
  userId: string;
  prepare: (page: Page) => Promise<void>;
  ready: (page: Page) => Promise<void>;
};

const targets: Target[] = [
  {
    id: 'catalog',
    route: '/',
    userId: RENTER_ID,
    prepare: async () => {},
    ready: async (page) => {
      await expect(page.getByTestId('car-card').first()).toBeVisible();
      await expect(page.getByTestId('result-count')).toHaveText('3 cars');
    },
  },
  {
    id: 'booking',
    route: '/cars/car_01',
    userId: RENTER_ID,
    prepare: async (page) => {
      await page.getByTestId('booking-start').fill('2026-12-01');
      await page.getByTestId('booking-end').fill('2026-12-04');
    },
    ready: async (page) => {
      await expect(page.getByTestId('price-total')).toHaveText('$280.00');
      await expect(page.getByTestId('booking-submit')).toBeEnabled();
    },
  },
  {
    id: 'requests',
    route: '/owner/requests',
    userId: OWNER_ID,
    prepare: async () => {},
    ready: async (page) => {
      const card = page.locator('[data-testid=booking-card][data-id=book_301]');
      await expect(card).toBeVisible();
      await expect(card.getByTestId('status-badge')).toHaveText('Confirmed');
    },
  },
];

const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
];

async function assertNoOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

async function assertControlsLabelled(page: Page) {
  const unlabelled = await page.evaluate(() => {
    const controls = Array.from(
      document.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea'),
    ).filter((el) => {
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && (el as HTMLInputElement).type !== 'hidden';
    });
    return controls
      .filter((el) => {
        const labelled = (el as HTMLInputElement).labels?.length ?? 0;
        const name =
          el.getAttribute('aria-label') ||
          el.getAttribute('aria-labelledby') ||
          el.getAttribute('title') ||
          (el.textContent ?? '').trim() ||
          el.querySelector('img[alt]:not([alt=""])');
        return !labelled && !name;
      })
      .map((el) => el.outerHTML.slice(0, 120));
  });
  expect(unlabelled).toEqual([]);
}

async function assertFocusable(page: Page) {
  await page.keyboard.press('Tab');
  const tag = await page.evaluate(() => document.activeElement?.tagName ?? 'BODY');
  expect(tag).not.toBe('BODY');
}

async function assertImagesLoaded(page: Page) {
  await page.evaluate(async () => {
    const step = Math.max(window.innerHeight - 100, 200);
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForFunction(() =>
    Array.from(document.images).every((img) => img.complete),
  );
  const broken = await page.evaluate(() =>
    Array.from(document.images)
      .filter((img) => img.getBoundingClientRect().width > 0 && getComputedStyle(img).visibility !== 'hidden')
      .filter((img) => img.naturalWidth === 0)
      .map((img) => img.src),
  );
  expect(broken).toEqual([]);
}

test.describe.configure({ mode: 'serial' });

test.beforeEach(async ({ request }) => {
  await resetStore(request);
  await mkdir('visual-evidence', { recursive: true });
});

for (const target of targets) {
  for (const viewport of viewports) {
    test(`VISUAL: ${viewport.name} ${target.id}`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await startAs(page, target.userId, target.route);
      await target.prepare(page);
      await target.ready(page);

      await assertNoOverflow(page);
      await assertControlsLabelled(page);
      await assertFocusable(page);
      await assertImagesLoaded(page);
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);

      const path = `visual-evidence/${viewport.name}-${target.id}.png`;
      await page.screenshot({ path, fullPage: true, animations: 'disabled' });
      await testInfo.attach(`${viewport.name}-${target.id}`, { path, contentType: 'image/png' });
    });
  }
}
