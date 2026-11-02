import { expect, type APIRequestContext, type Browser, type Locator, type Page } from '@playwright/test';

export const USER = {
  alex: 'usr_201',
  emma: 'usr_202',
  james: 'usr_203',
  sarah: 'usr_301',
  michael: 'usr_302',
  david: 'usr_303',
  jordan: 'usr_401',
} as const;

export const BRANCH = { central: 'br_central', downtown: 'br_downtown' } as const;
export const SERVICE = { general: 'svc_general', docs: 'svc_docs', support: 'svc_support' } as const;

export const TICKET_NUMBER_PATTERN = /^CEN-GC-\d{3}$/;

export async function resetStore(request: APIRequestContext): Promise<void> {
  const response = await request.post('/api/reset');
  expect(response.ok()).toBeTruthy();
}

export interface ApiResult {
  status: number;
  body: any;
}

export async function apiCall(
  request: APIRequestContext,
  userId: string,
  method: 'GET' | 'POST' | 'PUT',
  path: string,
  data?: Record<string, unknown>,
): Promise<ApiResult> {
  const response = await request.fetch(path, { method, headers: { 'X-User-Id': userId }, data });
  const text = await response.text();
  return { status: response.status(), body: text ? JSON.parse(text) : null };
}

export function asList(body: any): any[] {
  if (Array.isArray(body)) return body;
  if (body && Array.isArray(body.tickets)) return body.tickets;
  return [];
}

export async function businessDate(request: APIRequestContext): Promise<string> {
  const clock = await apiCall(request, USER.jordan, 'GET', '/api/clock');
  expect(clock.status).toBe(200);
  return clock.body.businessDate as string;
}

export function addDays(date: string, days: number): string {
  const moment = new Date(`${date}T00:00:00Z`);
  moment.setUTCDate(moment.getUTCDate() + days);
  return moment.toISOString().slice(0, 10);
}

export async function todaysTickets(request: APIRequestContext): Promise<any[]> {
  const date = await businessDate(request);
  const all: any[] = [];
  for (const branchId of Object.values(BRANCH)) {
    const result = await apiCall(request, USER.jordan, 'GET', `/api/tickets?branchId=${branchId}&date=${date}`);
    expect(result.status).toBe(200);
    all.push(...asList(result.body));
  }
  return all;
}

export async function openAs(page: Page, userId: string, path: string): Promise<void> {
  await page.goto('/');
  await page.evaluate((id) => window.localStorage.setItem('queueflow.userId', id), userId);
  await page.goto(path);
  await expect(page.getByTestId('current-user')).toBeVisible();
}

export async function openInNewContext(browser: Browser, baseURL: string | undefined, userId: string, path: string): Promise<Page> {
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();
  await openAs(page, userId, path);
  return page;
}

export async function switchPersona(page: Page, userId: string, expectedName: string): Promise<void> {
  await page.getByTestId('persona-switcher').selectOption(userId);
  await expect(page.getByTestId('current-user')).toContainText(expectedName);
}

export function isTicketCreation(response: { url(): string; request(): { method(): string } }): boolean {
  return new URL(response.url()).pathname === '/api/tickets' && response.request().method() === 'POST';
}

export async function chooseBranchAndService(page: Page, branchId: string, serviceId: string): Promise<void> {
  await page.getByTestId('book-branch').selectOption(branchId);
  await page.getByTestId('book-service').selectOption(serviceId);
}

export async function generateWalkInTicket(page: Page, branchId: string, serviceId: string): Promise<void> {
  await page.goto('/customer');
  await chooseBranchAndService(page, branchId, serviceId);
  await page.getByTestId('book-mode-walkin').check();
  const [response] = await Promise.all([
    page.waitForResponse(isTicketCreation),
    page.getByTestId('book-submit').click(),
  ]);
  expect(response.status()).toBe(201);
  await expect(page.getByTestId('ticket-result')).toBeVisible();
}

export async function clickAndExpectOk(page: Page, button: Locator, urlPart: string): Promise<void> {
  const [response] = await Promise.all([
    page.waitForResponse((r) => r.url().includes(urlPart) && r.request().method() === 'POST'),
    button.click(),
  ]);
  expect(response.ok()).toBeTruthy();
}

export async function staffAction(page: Page, testId: string, urlPart: string): Promise<void> {
  await clickAndExpectOk(page, page.getByTestId(testId), urlPart);
}

export async function staffServeCurrent(page: Page, expectedNumber: string): Promise<void> {
  await expect(page.getByTestId('current-ticket-number')).toHaveText(expectedNumber);
  await staffAction(page, 'btn-start', '/start');
  await expect(page.getByTestId('btn-complete')).toBeEnabled();
  await staffAction(page, 'btn-complete', '/complete');
  await expect(page.getByTestId('current-empty')).toBeVisible();
}

export async function callNext(page: Page, expectedNumber: string): Promise<void> {
  await expect(page.getByTestId('btn-call-next')).toBeEnabled();
  await staffAction(page, 'btn-call-next', '/api/queue/call-next');
  await expect(page.getByTestId('current-ticket-number')).toHaveText(expectedNumber);
}

export function ticketCard(page: Page, number: string): Locator {
  return page.locator(`[data-testid=ticket-card][data-number="${number}"]`);
}

export function trackPageErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

export function numberFrom(text: string | null): number {
  const match = /-?\d+(\.\d+)?/.exec(text ?? '');
  return match ? Number(match[0]) : Number.NaN;
}

export function averageMinutes(pairs: Array<[string, string]>): number {
  if (pairs.length === 0) return Number.NaN;
  const total = pairs.reduce((sum, [from, to]) => sum + (Date.parse(to) - Date.parse(from)) / 60000, 0);
  return total / pairs.length;
}
