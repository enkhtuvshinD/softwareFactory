import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { getScreenshotPaths, validateProduct, validateAcceptance, validateReview, validateDesign,
  validateVisualPlan, validateTests, validateResults, validateVisual } from './gates.mjs';

const write = (out, file, value) => {
  const full = path.join(out, file);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value));
};
const read = (out, file) => JSON.parse(fs.readFileSync(path.join(out, file), 'utf8'));
const reviewKeys = ['acceptance_preserved', 'capability_coverage', 'domain_consistent', 'journey_complete', 'scope_consistent'];
const fixture = (t, { domain = 'calculator', targets = 1, provided = false } = {}) => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'factory-gates-'));
  t.after(() => fs.rmSync(out, { recursive: true, force: true }));
  const domains = {
    calculator: { name: 'Tip calculator', roles: ['visitor'], entities: [], brief: 'Build a tip calculator that splits the total between diners.' },
    restaurant: { name: 'Restaurant orders', roles: ['customer', 'staff'], entities: ['menu_items', 'orders'], brief: 'Customers order menu items; staff update order status.' },
    crm: { name: 'Sales CRM', roles: ['sales_rep'], entities: ['contacts', 'notes'], brief: 'Sales reps create and search contacts and add notes.' },
  };
  const selected = domains[domain];
  const brief = provided ? `${selected.brief}\nCHECK_A: Complete the primary task.\nCHECK_B: Show a useful error.` : selected.brief;
  write(out, 'input/brief.md', brief);
  write(out, 'requirements/product.json', {
    name: selected.name, roles: selected.roles, entities: selected.entities,
    primary_journey: { title: 'Complete the primary task', steps: ['Open the app', 'Perform the main interaction'],
      expected: ['Requested result is visible'], mutates_state: domain !== 'calculator' },
    acceptance_mode: provided ? 'provided' : 'derived',
  });
  write(out, 'requirements/seed.json', {});
  write(out, 'requirements/acceptance.json', (provided ? ['CHECK_A', 'CHECK_B'] : ['AC-001', 'AC-002']).map((id, index) => ({
    id, title: index ? 'Validation' : 'Primary task', role: selected.roles[0], source: provided ? 'brief' : 'derived',
    source_ref: provided ? (index ? 'CHECK_B: Show a useful error.' : 'CHECK_A: Complete the primary task.') : selected.brief,
    preconditions: [], steps: ['Perform requested action'], expected: ['Observe requested result'],
  })));
  write(out, 'requirements/review.json', { status: 'approved',
    checks: Object.fromEntries(reviewKeys.map((key) => [key, true])), findings: [], assumptions: [] });
  write(out, 'design/visual-plan.json', { targets: ['primary', 'detail', 'manage'].slice(0, targets).map((id, index) => ({
    id, route: index ? `/screen-${index}` : '/', role: selected.roles[0], purpose: `Review ${id} task`,
    ready: `${id}-ready`, prepare: index ? ['Navigate to representative state'] : [],
  })) });
  write(out, 'design/tokens.json', { color: { brand: '#123456' } });
  write(out, 'design/tokens.css', ':root { --color-brand: #123456; }');
  write(out, 'design/ui-spec.md', 'UI test contract: data-testid="main-content".');
  return out;
};
const passedSpec = (title, file) => ({ title, file, ok: true, tests: [{
  expectedStatus: 'passed', status: 'expected', results: [{ status: 'passed' }],
}] });
const successfulResults = (out) => ({ suites: [{ specs: [
  ...read(out, 'requirements/acceptance.json').map((item) => passedSpec(`${item.id}: ${item.title}`, `e2e/case-${item.id}.spec.ts`)),
  ...['smoke', 'journey', 'edge-cases', 'visual'].map((name) => passedSpec(`${name} check`, `${name}.spec.ts`)),
] }] });
const prepareEvidence = (out) => {
  const paths = getScreenshotPaths(out);
  for (const file of paths) {
    const bytes = Buffer.alloc(32);
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(bytes);
    bytes.writeUInt32BE(file.includes('/mobile-') ? 390 : 1440, 16);
    bytes.writeUInt32BE(file.includes('/mobile-') ? 844 : 900, 20);
    write(out, file, bytes);
  }
  write(out, 'quality/visual-review.json', { status: 'pass', reviewed: paths.map((file) => ({ path: file, findings: [] })),
    fixed: [], remaining: [], limitations: [] });
  return paths;
};

for (const domain of ['calculator', 'restaurant', 'crm']) {
  test(`${domain} brief without judge IDs or input seed derives valid acceptance`, (t) => {
    const out = fixture(t, { domain });
    assert.equal(fs.existsSync(path.join(out, 'input/seed.json')), false);
    assert.equal(validateAcceptance(out).length, 2);
    validateReview(out);
    validateDesign(out);
  });
}

test('arbitrary explicit case IDs and domain roles preserve exact source excerpts', (t) => {
  const out = fixture(t, { domain: 'crm', provided: true });
  assert.deepEqual(validateAcceptance(out).map((item) => item.id), ['CHECK_A', 'CHECK_B']);
  const cases = read(out, 'requirements/acceptance.json');
  cases[0].source_ref = 'An invented outcome absent from the brief';
  write(out, 'requirements/acceptance.json', cases);
  assert.throws(() => validateAcceptance(out), /source excerpt is absent/);
});

test('provided and derived checks cannot silently exchange provenance', (t) => {
  const out = fixture(t);
  const cases = read(out, 'requirements/acceptance.json');
  cases[0].source = 'brief';
  write(out, 'requirements/acceptance.json', cases);
  assert.throws(() => validateAcceptance(out), /source contradicts/);
});

test('provided cases may use TR IDs without making ordinary asset IDs into test cases', (t) => {
  const out = fixture(t, { provided: true });
  write(out, 'input/brief.md', 'TR-1: Create a record. TR-2: Search records.');
  const cases = read(out, 'requirements/acceptance.json');
  cases.forEach((item, index) => {
    item.id = `TR-${index + 1}`;
    item.source_ref = index ? 'TR-2: Search records.' : 'TR-1: Create a record.';
  });
  write(out, 'requirements/acceptance.json', cases);
  assert.equal(validateAcceptance(out).length, 2);
  const derived = fixture(t);
  const brief = 'Build an inventory tracker for assets TR-1 and TR-2.';
  write(derived, 'input/brief.md', brief);
  const product = read(derived, 'requirements/product.json');
  product.name = 'Asset inventory';
  product.entities = ['assets'];
  write(derived, 'requirements/product.json', product);
  const derivedCases = read(derived, 'requirements/acceptance.json');
  derivedCases.forEach((item) => { item.source_ref = brief; });
  write(derived, 'requirements/acceptance.json', derivedCases);
  assert.equal(validateAcceptance(derived).length, 2);
  assert.equal(validateProduct(derived).acceptance_mode, 'derived');
});

test('unsafe or duplicate case IDs and invented roles are rejected', (t) => {
  const out = fixture(t);
  const cases = read(out, 'requirements/acceptance.json');
  cases[0].id = '../escape';
  write(out, 'requirements/acceptance.json', cases);
  assert.throws(() => validateAcceptance(out), /safe IDs/);
  cases[0].id = cases[1].id;
  write(out, 'requirements/acceptance.json', cases);
  assert.throws(() => validateAcceptance(out), /safe IDs/);
  cases[0].id = cases[1].id.toLowerCase();
  write(out, 'requirements/acceptance.json', cases);
  assert.throws(() => validateAcceptance(out), /case-insensitive/);
  cases[0].id = 'AC-001';
  cases[0].role = 'car_owner';
  write(out, 'requirements/acceptance.json', cases);
  assert.throws(() => validateAcceptance(out), /invalid role/);
});

test('static unit-test exemption requires a reason and a valid resolved seed', (t) => {
  const out = fixture(t);
  const product = read(out, 'requirements/product.json');
  product.unit_tests_required = false;
  write(out, 'requirements/product.json', product);
  assert.throws(() => validateProduct(out), /exemption needs/);
  product.unit_test_reason = 'Static supplied content only; no pure business logic.';
  write(out, 'requirements/product.json', product);
  validateProduct(out);
  write(out, 'requirements/seed.json', 'null');
  assert.throws(() => validateProduct(out), /Resolved seed/);
});

test('requirements review rejects unresolved or unchecked generic rules', (t) => {
  const out = fixture(t);
  const review = read(out, 'requirements/review.json');
  review.findings.push('The primary journey omits the requested save');
  write(out, 'requirements/review.json', review);
  assert.throws(() => validateReview(out), /Unresolved/);
  review.findings = [];
  review.checks.scope_consistent = false;
  write(out, 'requirements/review.json', review);
  assert.throws(() => validateReview(out), /not approved/);
});

test('QA requires dynamic case files plus journey, edge, visual and smoke suites', (t) => {
  const out = fixture(t);
  for (const name of ['case-AC-001', 'case-AC-002', 'smoke', 'journey', 'edge-cases']) write(out, `app/e2e/${name}.spec.ts`, 'test');
  assert.throws(() => validateTests(out), /visual/);
  write(out, 'app/e2e/visual.spec.ts', 'test');
  validateTests(out);
});

test('successful CLI exit cannot hide missing or skipped derived cases', (t) => {
  const out = fixture(t);
  const results = successfulResults(out);
  write(out, 'app/test-results/results.json', results);
  validateResults(out);
  results.suites[0].specs[0].tests[0].results[0].status = 'skipped';
  write(out, 'app/test-results/results.json', results);
  assert.throws(() => validateResults(out), /skipped/);
  results.suites[0].specs.shift();
  write(out, 'app/test-results/results.json', results);
  assert.throws(() => validateResults(out), /AC-001/);
});

test('case results inherit filenames and require their contracted case files', (t) => {
  const out = fixture(t);
  const results = successfulResults(out);
  results.suites = results.suites[0].specs.map(({ file, ...spec }) => ({ file, specs: [spec] }));
  write(out, 'app/test-results/results.json', results);
  validateResults(out);
  results.suites[0].file = 'wrong-case.spec.ts';
  write(out, 'app/test-results/results.json', results);
  assert.throws(() => validateResults(out), /AC-001/);
});

test('global Playwright runner errors cannot produce a green gate', (t) => {
  const out = fixture(t);
  write(out, 'app/test-results/results.json', { errors: [{ message: 'Server teardown failed' }], suites: [] });
  assert.throws(() => validateResults(out), /global runner errors/);
});

test('single-screen apps require two screenshots rather than invented screens', (t) => {
  const out = fixture(t);
  const paths = prepareEvidence(out);
  assert.deepEqual(paths, ['app/visual-evidence/desktop-primary.png', 'app/visual-evidence/mobile-primary.png']);
  validateVisual(out, { stamp: true });
  assert.equal(validateVisual(out).screenshots.length, 2);
});

test('three selected screens require six current images bound to plan and review', (t) => {
  const out = fixture(t, { domain: 'restaurant', targets: 3 });
  const paths = prepareEvidence(out);
  assert.equal(paths.length, 6);
  assert.throws(() => validateVisual(out), /ENOENT/);
  validateVisual(out, { stamp: true });
  validateVisual(out);
  fs.appendFileSync(path.join(out, paths[0]), 'changed');
  assert.throws(() => validateVisual(out), /changed after/);
});

test('changing planned states invalidates previously approved visual evidence', (t) => {
  const out = fixture(t);
  prepareEvidence(out);
  validateVisual(out, { stamp: true });
  const plan = read(out, 'design/visual-plan.json');
  plan.targets[0].prepare = ['Enter a different state'];
  write(out, 'design/visual-plan.json', plan);
  assert.throws(() => validateVisual(out), /changed after/);
});

test('visual plan rejects unsafe targets, unknown roles and external routes', (t) => {
  const out = fixture(t);
  const plan = read(out, 'design/visual-plan.json');
  plan.targets[0].id = '../outside';
  write(out, 'design/visual-plan.json', plan);
  assert.throws(() => validateVisualPlan(out), /safe lowercase/);
  plan.targets[0].id = 'primary';
  plan.targets[0].role = 'owner';
  write(out, 'design/visual-plan.json', plan);
  assert.throws(() => validateVisualPlan(out), /role is not/);
  plan.targets[0].role = 'visitor';
  plan.targets[0].route = '//external.invalid';
  write(out, 'design/visual-plan.json', plan);
  assert.throws(() => validateVisualPlan(out), /application path/);
});

test('missing mobile evidence and unresolved visual defects cannot pass', (t) => {
  const out = fixture(t);
  const paths = prepareEvidence(out);
  fs.unlinkSync(path.join(out, paths[1]));
  assert.throws(() => validateVisual(out, { stamp: true }), /ENOENT/);
  write(out, 'quality/visual-review.json', { status: 'pass', reviewed: [], fixed: [], remaining: ['Overflow'] });
  assert.throws(() => validateVisual(out), /unresolved/);
});
