import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { generateReport, specStatus } from './report.mjs';

const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const image = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jVJkAAAAASUVORK5CYII=', 'base64');
const passingTest = (projectName = 'chromium') => ({
  projectName, expectedStatus: 'passed', status: 'expected', results: [{ status: 'passed' }],
});
const spec = (title = 'CASE-CONTACT: Add contact', file = 'e2e/case-CASE-CONTACT.spec.ts', tests = [passingTest()]) => ({ title, file, ok: true, tests });

function fixture(t, options = {}) {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'factory-report-'));
  t.after(() => fs.rmSync(out, { recursive: true, force: true }));
  const put = (file, value) => {
    const target = path.join(out, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, Buffer.isBuffer(value) || typeof value === 'string' ? value : JSON.stringify(value));
  };
  const product = {
    name: options.name ?? 'DeskCRM', roles: options.roles ?? ['agent'], entities: options.entities ?? ['Contact'],
    primary_journey: { title: options.journey ?? 'Add and find a contact', steps: ['Open the main screen', 'Complete the requested task'],
      expected: ['The result is visible'], mutates_state: options.mutatesState ?? true },
    acceptance_mode: options.mode ?? 'provided',
    ...(options.unitTestsRequired === false ? { unit_tests_required: false, unit_test_reason: 'Static presentation has no custom business logic.' } : {}),
  };
  const id = options.id ?? 'CASE-CONTACT';
  const title = options.title ?? 'Add contact';
  const brief = options.brief ?? `${id}: ${title} and display the saved record.`;
  const acceptance = [{ id, title, role: product.roles[0],
    source: product.acceptance_mode === 'provided' ? 'brief' : 'derived', source_ref: brief,
    preconditions: [], steps: ['Perform the requested action'], expected: ['Observe the requested result'] }];
  const targets = options.targets ?? ['contacts', 'contact-detail', 'analytics'];
  const imagePaths = ['desktop', 'mobile'].flatMap((device) => targets.map((target) => `app/visual-evidence/${device}-${target}.png`));
  put('logs/run.json', {
    started_at: '2026-11-01T00:00:00Z', finished_at: '2026-11-01T00:01:00Z', total_budget: 14,
    deadline_at: '2026-11-01T01:00:00Z', resume_count: 1, status: 'pass',
  });
  put('logs/verify.json', { round: 'final-0', build: 'pass', unit: options.unitTestsRequired === false ? 'not_applicable' : 'pass', e2e: 'pass' });
  put('input/brief.md', brief);
  put('requirements/product.json', product);
  put('requirements/seed.json', {});
  put('requirements/acceptance.json', acceptance);
  put('app/test-results/results.json', { suites: [{ file: `e2e/case-${id}.spec.ts`, specs: [spec(`${id}: ${title}`, `e2e/case-${id}.spec.ts`)] }], errors: [] });
  put('requirements/review.json', {
    status: 'approved', checks: {
      acceptance_preserved: true, capability_coverage: true, domain_consistent: true,
      journey_complete: true, scope_consistent: true,
    }, findings: [], assumptions: [],
  });
  put('design/visual-plan.json', { targets: targets.map((target) => ({
    id: target, route: `/${target}`, role: product.roles[0], purpose: 'Inspect the main task', ready: 'Main content is visible', prepare: [],
  })) });
  for (const file of imagePaths) {
    const bytes = Buffer.from(image);
    // Report fixtures exercise dimensions, signatures and hashes without browser rendering.
    bytes.writeUInt32BE(file.includes('/mobile-') ? 390 : 1440, 16);
    bytes.writeUInt32BE(file.includes('/mobile-') ? 844 : 900, 20);
    put(file, bytes);
  }
  put('quality/visual-review.json', {
    status: 'pass', reviewed: imagePaths.map((file) => ({ path: file, findings: [] })), fixed: [], remaining: [], limitations: [],
  });
  const stamp = () => put('quality/evidence.json', {
    status: 'pass', verified_at: '2026-11-01T00:00:59Z',
    review_sha256: hash(fs.readFileSync(path.join(out, 'quality/visual-review.json'))),
    visual_plan_sha256: hash(fs.readFileSync(path.join(out, 'design/visual-plan.json'))),
    screenshots: imagePaths.map((file) => ({ path: file, sha256: hash(fs.readFileSync(path.join(out, file))) })),
  });
  stamp();
  return { out, put, stamp, imagePaths, product, acceptance };
}

test('only successful actual executions count as passes', () => {
  assert.equal(specStatus(spec()), 'pass');
  assert.equal(specStatus({ ...spec(), ok: false }), 'fail');
  assert.equal(specStatus({ ok: true, tests: [] }), 'missing');
  assert.equal(specStatus(spec('x', 'x', [{ ...passingTest(), results: [] }])), 'missing');
  assert.equal(specStatus(spec('x', 'x', [{ ...passingTest(), status: 'skipped', results: [{ status: 'skipped' }] }])), 'skipped');
  assert.equal(specStatus(spec('x', 'x', [{ ...passingTest(), expectedStatus: 'failed', results: [{ status: 'failed' }] }])), 'fail');
  assert.equal(specStatus(spec('x', 'x', [{ ...passingTest(), status: 'flaky', results: [{ status: 'failed' }, { status: 'passed' }] }])), 'flaky');
  assert.equal(specStatus(spec('x', 'x', [{ ...passingTest(), results: [{ status: 'passed' }, { status: 'passed' }] }])), 'fail');
  assert.equal(specStatus(spec('x', 'x', [passingTest(), { ...passingTest('mobile'), status: 'unexpected', results: [{ status: 'timedOut' }] }])), 'fail');
});

test('missing artifacts do not write files or claim zero-case success', (t) => {
  const { out } = fixture(t);
  for (const file of ['logs', 'requirements', 'quality', 'design', 'app/test-results']) fs.rmSync(path.join(out, file), { recursive: true });
  const report = generateReport(out);
  assert.match(report, /No acceptance cases \| ⚠️ missing/);
  assert.match(report, /\| Journey \| 0\/0 \| ⚠️ missing \|/);
  assert.match(report, /No readable Playwright result/);
  assert.match(report, /Screenshots captured: 0\/not available/);
  assert.equal(fs.existsSync(path.join(out, 'REPORT.md')), false);
});

test('arbitrary CRM acceptance IDs preserve their source and aggregate every project', (t) => {
  const { out, put } = fixture(t);
  const skipped = spec('CASE-CONTACT: Add contact', 'e2e/case-CASE-CONTACT.spec.ts', [{ ...passingTest('mobile'), status: 'skipped' }]);
  put('app/test-results/results.json', { suites: [{ specs: [spec(), skipped] }] });
  const report = generateReport(out);
  assert.match(report, /Brief-provided acceptance cases \(0\/1 passing\)/);
  assert.match(report, /\| CASE-CONTACT \| Add contact \| ⏭️ skipped/);
  assert.match(report, /Product roles: agent/);
  assert.match(report, /Primary journey: Add and find a contact/);
});

test('restaurant and calculator briefs have different roles and evidence target counts', (t) => {
  const restaurant = fixture(t, { name: 'Lunch Counter', roles: ['customer', 'staff'], entities: ['MenuItem', 'Order'],
    id: 'CHECK-ORDER', title: 'Place order', journey: 'Select lunch and place an order', targets: ['menu', 'order', 'kitchen'] });
  const restaurantReport = generateReport(restaurant.out);
  assert.match(restaurantReport, /Factory Run Report — Lunch Counter/);
  assert.match(restaurantReport, /Product roles: customer, staff/);
  assert.match(restaurantReport, /Screenshots captured: 6\/6/);
  assert.match(restaurantReport, /\[mobile-kitchen.png\]/);

  const calculator = fixture(t, { name: 'Unit Converter', roles: ['visitor'], entities: [], mode: 'derived', id: 'AC-001',
    title: 'Convert length', brief: 'Build a single-page length converter.', targets: ['converter'],
    journey: 'Enter a length and read the converted value', mutatesState: false });
  const report = generateReport(calculator.out);
  assert.match(report, /Factory Run Report — Unit Converter/);
  assert.match(report, /Product roles: visitor/);
  assert.match(report, /Derived acceptance cases \(1\/1 passing\)/);
  assert.match(report, /Brief-provided acceptance cases \(none recorded\)/);
  assert.match(report, /not supplied judge cases/);
  assert.match(report, /Screenshots captured: 2\/2; reviewed without open findings and matching final evidence: 2\/2/);
  assert.doesNotMatch(report, /Official judge cases|booking|renter|earnings|catalog|checkout/);
});

test('supplemental checks use files rather than an acceptance ID convention', (t) => {
  const { out, put } = fixture(t);
  put('app/test-results/results.json', {
    suites: [{ specs: [spec(), spec('JOURNEY: complete task', 'journey.spec.ts'), spec('EDGE: validation', 'edge-cases.spec.ts'),
      spec('SMOKE: route', 'smoke.spec.ts'), spec('VISUAL: primary', 'visual.spec.ts')] }], errors: [{ message: 'server stopped' }],
  });
  const report = generateReport(out);
  for (const group of ['Journey', 'Edge cases', 'Route smoke', 'Visual capture']) assert.ok(report.includes(`| ${group} | 1/1 | ✅ pass |`));
  assert.match(report, /Brief-provided acceptance cases \(1\/1 passing\)/);
  assert.match(report, /Playwright recorded 1 runner error/);
});

test('dynamic screenshot links, current hashes and resume metadata are reported', (t) => {
  const { out } = fixture(t);
  const report = generateReport(out);
  assert.match(report, /Screenshots captured: 6\/6; reviewed without open findings and matching final evidence: 6\/6/);
  assert.match(report, /\[desktop-contacts.png\]\(app\/visual-evidence\/desktop-contacts.png\)/);
  assert.match(report, /Deadline 2026-11-01T01:00:00Z · Resumes 1/);
  assert.match(report, /\| ✅ pass \| ✅ pass \| ✅ pass \| ✅ pass \| ✅ pass \|/);
});

test('changed images and changed visual plans invalidate final evidence', (t) => {
  const { out, put, imagePaths } = fixture(t);
  put(imagePaths[0], Buffer.concat([fs.readFileSync(path.join(out, imagePaths[0])), Buffer.from('changed')]));
  assert.match(generateReport(out), /matching final evidence: 5\/6/);
  const plan = JSON.parse(fs.readFileSync(path.join(out, 'design/visual-plan.json'), 'utf8'));
  plan.targets[0].route = '/changed-screen';
  put('design/visual-plan.json', plan);
  const report = generateReport(out);
  assert.match(report, /matching final evidence: 0\/6/);
  assert.match(report, /\| ✅ pass \| ✅ pass \| ✅ pass \| ✅ pass \| ❌ fail \|/);
});

test('changed review or absent stamp cannot establish visual approval', (t) => {
  const { out, put, imagePaths } = fixture(t);
  put('quality/visual-review.json', { status: 'pass', reviewed: imagePaths.map((file) => ({ path: file, findings: [] })),
    fixed: ['Changed spacing'], remaining: [] });
  assert.match(generateReport(out), /matching final evidence: 0\/6/);
  fs.rmSync(path.join(out, 'quality/evidence.json'));
  assert.match(generateReport(out), /\| ✅ pass \| ✅ pass \| ✅ pass \| ✅ pass \| ❌ fail \|/);
});

test('approved labels cannot override invalid product contracts or unresolved findings', (t) => {
  const { out, put, stamp, imagePaths } = fixture(t);
  put('requirements/review.json', { status: 'approved', checks: {}, findings: [] });
  put('quality/visual-review.json', { status: 'pass', reviewed: imagePaths.map((file) => ({ path: file, findings: [] })),
    fixed: [], remaining: ['Mobile action clipped'] });
  stamp();
  const report = generateReport(out);
  assert.match(report, /\| ✅ pass \| ✅ pass \| ✅ pass \| ❌ fail \| ❌ fail \|/);
  assert.match(report, /Mobile action clipped/);
});

test('legacy acceptance results retain an explicitly unrecorded source', (t) => {
  const { out, put } = fixture(t);
  fs.rmSync(path.join(out, 'requirements/product.json'));
  put('requirements/acceptance.json', [{ id: 'TR-1', title: 'Legacy action' }]);
  put('app/test-results/results.json', { suites: [{ specs: [spec('TR-1: Legacy action', 'tr-1.spec.ts')] }] });
  const report = generateReport(out);
  assert.match(report, /Acceptance cases with unrecorded source \(1\/1 passing\)/);
  assert.match(report, /Brief-provided acceptance cases \(none recorded\)/);
  assert.match(report, /Some acceptance case sources were not recorded/);
});

test('static presentation records justified unit-test non-applicability', (t) => {
  const { out } = fixture(t, { name: 'Event Information', roles: ['visitor'], entities: [], mode: 'derived', id: 'AC-001',
    title: 'Read event details', brief: 'Build a one-page event information site.', targets: ['event'],
    journey: 'Read event date and venue', mutatesState: false, unitTestsRequired: false });
  const report = generateReport(out);
  assert.match(report, /Unit tests: not applicable — Static presentation has no custom business logic/);
  assert.match(report, /\| ✅ pass \| — not applicable \| ✅ pass \| ✅ pass \| ✅ pass \|/);
});

test('executed unit tests override a requested static-product exemption in the report', (t) => {
  const { out, put } = fixture(t, { unitTestsRequired: false });
  put('logs/verify.json', { round: 'final-0', build: 'pass', unit: 'pass', e2e: 'pass' });
  const report = generateReport(out);
  assert.doesNotMatch(report, /Unit tests: not applicable/);
  assert.match(report, /\| ✅ pass \| ✅ pass \| ✅ pass \| ✅ pass \| ✅ pass \|/);
});

test('unknown and unfinished agents retain allocations alongside confirmed spend', (t) => {
  const { out, put } = fixture(t);
  put('logs/build.result.json', { stage: 'build', cost_usd: 1.25, cost_known: true, outcome: 'success' });
  put('logs/tests.allocation.json', { stage: 'tests', budget_usd: 2, reserved_at: '2026-11-01T00:00:20Z' });
  put('logs/tests.result.json', { stage: 'tests', cost_usd: null, cost_known: false, outcome: 'no_result' });
  put('logs/visual.allocation.json', { stage: 'visual', budget_usd: 0.75, reserved_at: '2026-11-01T00:00:25Z' });
  const report = generateReport(out);
  assert.match(report, /Recorded cost \*\*\$1.25\*\*/);
  assert.match(report, /Budget accounting: \*\*\$4.00\*\* charged\/reserved \(\$1.25 confirmed spend \+ \$2.75 unreconciled reservations\)/);
  assert.match(report, /\| unknown \| \$2.00 reserved \| no_result \|/);
  assert.match(report, /\| unknown \| \$0.75 reserved \| unfinished \|/);
});

test('token usage, tool calls and tool errors are reported per stage with totals', (t) => {
  const { out, put } = fixture(t);
  put('logs/build.result.json', {
    stage: 'build', cost_usd: 1, cost_known: true, outcome: 'success',
    tokens: { input: 10, cache_read: 2000, cache_write: 300, output: 40 },
    tools: { Read: 2, Write: 5 }, skills: ['express-api'],
    tool_errors: [{ tool: 'Bash', message: 'Exit code 2 | tsc failed' }],
  });
  put('logs/tests.result.json', {
    stage: 'tests', cost_usd: 0.5, cost_known: true, outcome: 'success',
    tokens: { input: 5, cache_read: 1000, cache_write: 100, output: 20 },
    tools: {}, skills: [], tool_errors: [],
  });
  put('logs/review.result.json', { stage: 'review', cost_usd: 0.1, cost_known: true, outcome: 'success' });
  const report = generateReport(out);
  assert.match(report, /\| build \| 10 \| 2,000 \| 300 \| 40 \| Write 5, Read 2 \| 1 \| express-api \|/);
  assert.match(report, /\| tests \| 5 \| 1,000 \| 100 \| 20 \| none \| 0 \| — \|/);
  assert.match(report, /\| review \| not recorded \| not recorded \| not recorded \| not recorded \| not recorded \| not recorded \| not recorded \|/);
  assert.match(report, /\| \*\*Total\*\* \| \*\*15\*\* \| \*\*3,000\*\* \| \*\*400\*\* \| \*\*60\*\* \| \| \*\*1\*\* \| \|/);
  assert.match(report, /- build · Bash: Exit code 2 \\\| tsc failed/);
});

test('malformed partial model artifacts stay visible without crashing the report', (t) => {
  const { out, put } = fixture(t);
  put('requirements/acceptance.json', [null, { id: 42 }, { title: 'No ID' }]);
  put('app/test-results/results.json', { suites: [null, { specs: [null] }] });
  const report = generateReport(out);
  assert.match(report, /No acceptance cases \| ⚠️ missing/);
  assert.match(report, /Malformed acceptance entries were excluded/);
});
