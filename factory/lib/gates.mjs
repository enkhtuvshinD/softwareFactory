import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';

const sha256 = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const load = (out, file) => JSON.parse(fs.readFileSync(path.join(out, file), 'utf8'));
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const strings = (value) => Array.isArray(value) && value.every((item) => typeof item === 'string');
const text = (value) => typeof value === 'string' && value.trim().length > 0;
const nonemptyStrings = (value) => strings(value) && value.length > 0 && value.every(text);
const uniqueStrings = (value) => strings(value) && value.every(text) && new Set(value).size === value.length;
const safeId = /^[A-Za-z][A-Za-z0-9_-]{0,63}$/;

export function validateProduct(out) {
  const product = load(out, 'requirements/product.json');
  assert(text(product.name), 'Product name is missing');
  assert(uniqueStrings(product.roles) && product.roles.length > 0, 'Product roles must be nonempty and unique (use visitor for anonymous apps)');
  assert(uniqueStrings(product.entities), 'Product entities must be a unique array (may be empty)');
  assert(text(product.primary_journey?.title) && nonemptyStrings(product.primary_journey.steps) &&
    nonemptyStrings(product.primary_journey.expected) && typeof product.primary_journey.mutates_state === 'boolean',
  'Product primary journey is incomplete');
  assert(['provided', 'derived'].includes(product.acceptance_mode), 'Invalid acceptance mode');
  assert(product.unit_tests_required === undefined || typeof product.unit_tests_required === 'boolean',
    'unit_tests_required must be a boolean when supplied');
  if (product.unit_tests_required === false) assert(text(product.unit_test_reason), 'Unit-test exemption needs a concrete reason');
  const seed = load(out, 'requirements/seed.json');
  assert(seed !== null && typeof seed === 'object', 'Resolved seed must be a JSON object or array');
  return product;
}

export function validateAcceptance(out) {
  const product = validateProduct(out);
  const acceptance = load(out, 'requirements/acceptance.json');
  assert(Array.isArray(acceptance) && acceptance.length > 0, 'Acceptance cases are missing');
  const brief = fs.readFileSync(path.join(out, 'input/brief.md'), 'utf8');
  assert(text(brief), 'Product brief is empty');
  const ids = new Set();
  for (const item of acceptance) {
    assert(typeof item.id === 'string' && safeId.test(item.id) && !ids.has(item.id.toLowerCase()),
      'Acceptance IDs must be unique case-insensitive safe IDs');
    ids.add(item.id.toLowerCase());
    assert(text(item.title), `${item.id}: missing title`);
    assert([...product.roles, 'any', 'both'].includes(item.role), `${item.id}: invalid role for this product`);
    assert(item.source === (product.acceptance_mode === 'provided' ? 'brief' : 'derived'), `${item.id}: source contradicts acceptance mode`);
    assert(text(item.source_ref), `${item.id}: source reference is missing`);
    if (item.source === 'brief') assert(brief.includes(item.source_ref.trim()), `${item.id}: source excerpt is absent from the current brief`);
    for (const key of ['preconditions', 'steps', 'expected']) {
      assert(strings(item[key]) && item[key].every(text) && (key === 'preconditions' || item[key].length > 0), `${item.id}: invalid ${key}`);
    }
  }
  return acceptance;
}

export function validateReview(out) {
  validateAcceptance(out);
  const review = load(out, 'requirements/review.json');
  const keys = ['acceptance_preserved', 'capability_coverage', 'domain_consistent', 'journey_complete', 'scope_consistent'];
  assert(review.status === 'approved' && keys.every((key) => review.checks?.[key] === true), 'Requirements review is not approved');
  assert(strings(review.findings) && review.findings.length === 0 && strings(review.assumptions), 'Unresolved requirements findings');
  return review;
}

export function validateVisualPlan(out) {
  const product = validateProduct(out);
  const plan = load(out, 'design/visual-plan.json');
  assert(Array.isArray(plan.targets) && plan.targets.length >= 1 && plan.targets.length <= 3,
    'Visual plan must contain one to three representative screens or states');
  const ids = new Set();
  for (const target of plan.targets) {
    assert(typeof target.id === 'string' && /^[a-z][a-z0-9-]{0,31}$/.test(target.id) && !ids.has(target.id),
      'Visual target IDs must be unique safe lowercase IDs');
    ids.add(target.id);
    assert(text(target.route) && target.route.startsWith('/') && !target.route.startsWith('//'),
      `${target.id}: visual route must be an application path`);
    assert([...product.roles, 'any'].includes(target.role), `${target.id}: visual role is not in this product`);
    assert(text(target.purpose) && text(target.ready) && strings(target.prepare) && target.prepare.every(text),
      `${target.id}: incomplete visual preparation plan`);
  }
  return plan;
}

export function getScreenshotPaths(out) {
  const plan = validateVisualPlan(out);
  return ['desktop', 'mobile'].flatMap((device) =>
    plan.targets.map((target) => `app/visual-evidence/${device}-${target.id}.png`));
}

export function validateDesign(out) {
  const tokens = load(out, 'design/tokens.json');
  assert(tokens && typeof tokens === 'object' && !Array.isArray(tokens) && Object.keys(tokens).length > 0,
    'Design tokens must be a nonempty JSON object');
  assert(text(fs.readFileSync(path.join(out, 'design/tokens.css'), 'utf8')), 'Design CSS is missing');
  assert(fs.readFileSync(path.join(out, 'design/ui-spec.md'), 'utf8').includes('data-testid'), 'Design UI test contract is missing');
  return validateVisualPlan(out);
}

export function validateTests(out) {
  const acceptance = validateAcceptance(out);
  const dir = path.join(out, 'app/e2e');
  for (const item of acceptance) {
    const file = path.join(dir, `case-${item.id}.spec.ts`);
    assert(fs.existsSync(file) && fs.statSync(file).size > 0, `Missing acceptance test file: ${item.id}`);
  }
  for (const name of ['smoke', 'journey', 'edge-cases', 'visual']) {
    const file = path.join(dir, `${name}.spec.ts`);
    assert(fs.existsSync(file) && fs.statSync(file).size > 0, `Missing ${name} tests`);
  }
}

export function validateResults(out) {
  const acceptance = validateAcceptance(out);
  const results = load(out, 'app/test-results/results.json');
  assert(!results.errors?.length, 'Playwright reported global runner errors');
  const specs = [];
  const collect = (suite, parentFile = '') => {
    const file = suite.file ?? parentFile;
    specs.push(...(suite.specs ?? []).map((spec) => ({ ...spec, file: spec.file ?? file })));
    (suite.suites ?? []).forEach((nested) => collect(nested, file));
  };
  (results.suites ?? []).forEach((suite) => collect(suite));
  const passed = (spec) => spec.ok === true && spec.tests?.length > 0 && spec.tests.every((test) =>
    test.expectedStatus === 'passed' && test.status === 'expected' && test.results?.length === 1 && test.results[0].status === 'passed');
  assert(specs.length > 0 && specs.every(passed), 'E2E results contain missing, failed, skipped, retried, or expected-failure tests');
  for (const item of acceptance) {
    assert(specs.some((spec) => spec.title?.startsWith(`${item.id}:`) &&
      path.basename(spec.file ?? '') === `case-${item.id}.spec.ts`), `Acceptance result missing: ${item.id}`);
  }
  for (const file of ['smoke', 'journey', 'edge-cases', 'visual']) {
    assert(specs.some((spec) => path.basename(spec.file ?? '') === `${file}.spec.ts`), `Executed ${file} tests missing`);
  }
}

export function validateVisual(out, { stamp = false } = {}) {
  const screenshotPaths = getScreenshotPaths(out);
  const review = load(out, 'quality/visual-review.json');
  assert(review.status === 'pass' && strings(review.remaining) && review.remaining.length === 0,
    'Visual review failed or has unresolved findings');
  assert(strings(review.fixed) && Array.isArray(review.reviewed) && review.reviewed.length === screenshotPaths.length,
    'Invalid visual review manifest');
  assert(review.limitations === undefined || strings(review.limitations), 'Invalid visual limitations');
  const reviewed = new Map(review.reviewed.map((item) => [item.path, item.findings]));
  const screenshots = screenshotPaths.map((file) => {
    assert(reviewed.has(file) && strings(reviewed.get(file)) && reviewed.get(file).length === 0, `Screenshot not approved: ${file}`);
    const full = path.join(out, file);
    const bytes = fs.readFileSync(full);
    assert(bytes.length > 24 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), `Invalid PNG: ${file}`);
    const mobile = file.includes('/mobile-');
    assert(bytes.readUInt32BE(16) === (mobile ? 390 : 1440) && bytes.readUInt32BE(20) >= (mobile ? 844 : 900),
      `Wrong screenshot dimensions: ${file}`);
    return { path: file, sha256: sha256(full) };
  });
  const evidence = { status: 'pass', verified_at: new Date().toISOString(),
    review_sha256: sha256(path.join(out, 'quality/visual-review.json')),
    visual_plan_sha256: sha256(path.join(out, 'design/visual-plan.json')), screenshots };
  if (stamp) fs.writeFileSync(path.join(out, 'quality/evidence.json'), JSON.stringify(evidence, null, 2));
  else {
    const recorded = load(out, 'quality/evidence.json');
    assert(recorded.status === 'pass' && recorded.review_sha256 === evidence.review_sha256 &&
      recorded.visual_plan_sha256 === evidence.visual_plan_sha256 &&
      JSON.stringify(recorded.screenshots) === JSON.stringify(screenshots), 'Visual evidence changed after approval');
  }
  return evidence;
}

if (process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href) {
  try {
    const [gate, out] = process.argv.slice(2);
    const gates = { acceptance: validateAcceptance, review: validateReview, design: validateDesign,
      'visual-plan': validateVisualPlan, tests: validateTests, results: validateResults,
      visual: (root) => validateVisual(root, { stamp: true }) };
    assert(gates[gate], 'Unknown gate');
    gates[gate](out);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
