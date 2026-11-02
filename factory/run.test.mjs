import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';

const factory = path.dirname(fileURLToPath(import.meta.url));
const workspace = path.dirname(factory);
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

// Guard the existing generated product as well as isolating every fixture run.
function outputSnapshot(directory, relative = '') {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.name !== 'node_modules')
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap((entry) => {
      const file = path.join(directory, entry.name);
      const name = path.join(relative, entry.name);
      return entry.isDirectory() ? outputSnapshot(file, name) :
        entry.isFile() ? [[name, sha256(fs.readFileSync(file))]] : [];
    });
}
const originalOutput = outputSnapshot(path.join(workspace, 'out'));
after(() => assert.deepEqual(outputSnapshot(path.join(workspace, 'out')), originalOutput,
  'Mock factory runs must not modify the existing generated product'));

const scenarios = {
  wheels: {
    name: 'Wheels2Go', roles: ['owner', 'renter'], entities: ['cars', 'bookings'],
    brief: 'Build a peer-to-peer car rental marketplace.',
    checks: ['TR-1: Create a listing.', 'TR-2: Filter cars.', 'TR-3: Calculate a three-day price.', 'TR-4: Approve a booking.'],
    mode: 'provided', targets: ['catalog', 'checkout', 'owner'], mutates: true,
    inputSeed: { users: [], cars: [{ id: 'car-1', daily_rate: 85 }], bookings: [] },
    resolvedSeed: { users: [], cars: [{ id: 'car-1', daily_rate: 85 }], bookings: [] },
  },
  restaurant: {
    name: 'Bistro orders', roles: ['customer', 'staff'], entities: ['menu_items', 'orders'],
    brief: 'Build a restaurant ordering app with a menu and staff order management.',
    checks: ['ORDER-01: Submit an order from the menu.', 'TOTAL1: Display the correct order total.'],
    mode: 'provided', targets: ['menu', 'order', 'staff'], mutates: true,
    resolvedSeed: { menu_items: [{ id: 'meal-1', price: 12 }], orders: [] },
  },
  crm: {
    name: 'Team CRM', roles: ['sales_rep'], entities: ['contacts', 'notes'],
    brief: 'Build a CRM where sales reps create and search contacts and save notes.',
    checks: ['AC-001', 'AC-002'], mode: 'derived', targets: ['contacts', 'contact-detail'], mutates: true,
    resolvedSeed: { contacts: [], notes: [] },
  },
  calculator: {
    name: 'Tip calculator', roles: ['visitor'], entities: [],
    brief: 'Build an anonymous single-screen tip calculator that splits the total between diners.',
    checks: ['AC-001', 'AC-002'], mode: 'derived', targets: ['calculator'], mutates: false,
    resolvedSeed: {},
  },
  portfolio: {
    name: 'Artist portfolio', roles: ['visitor'], entities: [],
    brief: 'Build a static artist portfolio showing supplied work, biography, and contact links.',
    checks: ['AC-001'], mode: 'derived', targets: ['portfolio'], mutates: false,
    resolvedSeed: {}, unitTests: false, unitReason: 'Static supplied content and navigation only; no pure business logic.',
  },
};

const mockCommand = String.raw`
import fs from 'node:fs';
import path from 'node:path';
const command = path.basename(process.argv[1]);
const root = process.env.MOCK_FACTORY_ROOT;
const audit = path.join(root, 'audit.jsonl');
const mode = process.env.MOCK_FACTORY_MODE;
const scenario = JSON.parse(fs.readFileSync(path.join(root, 'scenario.json'), 'utf8'));
const args = process.argv.slice(2);
const out = command === 'claude' ? args[args.indexOf('--add-dir') + 1] : path.dirname(process.cwd());
const record = (event) => fs.appendFileSync(audit, JSON.stringify({ command, time: Date.now(), mock: true, ...event }) + '\n');
const write = (file, value) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value, null, 2));
};
const acceptance = scenario.checks.map((check, index) => ({
  id: scenario.mode === 'provided' ? check.split(':')[0] : check,
  title: 'Acceptance case ' + (index + 1), role: scenario.roles[0],
  source: scenario.mode === 'provided' ? 'brief' : 'derived',
  source_ref: scenario.mode === 'provided' ? check : scenario.brief,
  preconditions: [], steps: ['Perform the requested action'], expected: ['Observe the requested outcome'],
}));
const screenshotPaths = ['desktop', 'mobile'].flatMap((device) =>
  scenario.targets.map((screen) => 'app/visual-evidence/' + device + '-' + screen + '.png'));
const spec = (title, file) => ({ title, file: 'e2e/' + file + '.spec.ts', ok: true, tests: [{
  expectedStatus: 'passed', status: 'expected', results: [{ status: 'passed', duration: 1 }],
}] });

if (command === 'claude') {
  // Consume the actual runner prompt; no provider SDK, credentials or network is used.
  let prompt = '';
  for await (const chunk of process.stdin) prompt += chunk;
  const stage = process.env.FACTORY_STAGE;
  const budget = Number(args[args.indexOf('--max-budget-usd') + 1]);
  if (!stage || !Number.isFinite(budget) || budget < 0.3 || !prompt.trim()) process.exit(10);
  const systemPrompt = args[args.indexOf('--append-system-prompt') + 1];
  const skillDirectory = systemPrompt?.match(/^Project skills directory: (.+)$/m)?.[1];
  const allowedDirectories = args.flatMap((argument, index) => argument === '--add-dir' ? [args[index + 1]] : []);
  if (!skillDirectory || !allowedDirectories.includes(skillDirectory) || !fs.existsSync(skillDirectory)) process.exit(18);
  const availableSkills = fs.readdirSync(skillDirectory).filter((name) => fs.existsSync(path.join(skillDirectory, name, 'SKILL.md')));
  const { budgetUsage } = await import(path.join(root, 'factory/lib/control.mjs'));
  const run = JSON.parse(fs.readFileSync(path.join(out, 'logs/run.json'), 'utf8'));
  record({ phase: 'start', stage, budget, charged: budgetUsage(path.join(out, 'logs'), run.total_budget),
    total: run.total_budget, runDate: process.env.FACTORY_RUN_DATE, availableSkills });
  if (stage === 'requirements') {
    write(path.join(out, 'requirements/requirements.md'), '# Minimal reviewed specification\n');
    write(path.join(out, 'requirements/product.json'), {
      name: scenario.name, roles: scenario.roles, entities: scenario.entities, acceptance_mode: scenario.mode,
      primary_journey: { title: 'Complete the requested primary task', steps: ['Open app', 'Perform requested task'],
        expected: ['Requested outcome appears'], mutates_state: scenario.mutates },
      ...(scenario.unitTests === false ? { unit_tests_required: false, unit_test_reason: scenario.unitReason } : {}),
    });
    write(path.join(out, 'requirements/seed.json'), scenario.resolvedSeed);
    write(path.join(out, 'requirements/acceptance.json'), acceptance);
  } else if (stage === 'review') {
    write(path.join(out, 'requirements/review.json'), { status: 'approved', checks: {
      acceptance_preserved: true, capability_coverage: true, domain_consistent: true,
      journey_complete: true, scope_consistent: true,
    }, findings: [], assumptions: [] });
  } else if (stage === 'design') {
    write(path.join(out, 'design/tokens.json'), { color: { brand: '#123456' } });
    write(path.join(out, 'design/tokens.css'), ':root { --color-brand: #123456; }\n');
    write(path.join(out, 'design/ui-spec.md'), '# UI contract\nUse data-testid controls.\n');
    write(path.join(out, 'design/visual-plan.json'), { targets: scenario.targets.map((id, index) => ({
      id, route: index ? '/screen-' + index : '/', role: scenario.roles[0], purpose: 'Review ' + id,
      ready: id + '-ready', prepare: [],
    })) });
  } else if (stage === 'build') {
    write(path.join(out, 'app/index.html'), '<title>' + scenario.name + '</title>\n');
    if (mode === 'existing-unit-test') write(path.join(out, 'app/shared/existing.test.ts'), '// Existing business test\n');
    await new Promise((resolve) => setTimeout(resolve, 350));
  } else if (stage === 'tests') {
    for (const item of acceptance) write(path.join(out, 'app/e2e/case-' + item.id + '.spec.ts'),
      "test('" + item.id + ': ' + item.title + "', async () => {});\n");
    for (const name of ['smoke', 'journey', 'edge-cases', 'visual']) {
      if (mode !== 'missing-journey' || name !== 'journey') write(path.join(out, 'app/e2e/' + name + '.spec.ts'),
        "test('" + name + "', async () => {});\n");
    }
    await new Promise((resolve) => setTimeout(resolve, 350));
  } else if (stage === 'polish') {
    record({ phase: 'polish-input', screenshots: screenshotPaths.filter((file) => fs.existsSync(path.join(out, file))).length,
      hasPlaywrightResults: fs.existsSync(path.join(out, 'app/test-results/results.json')) });
    write(path.join(out, 'quality/polish.md'), '# Mock polish\nAll planned fixture screenshots were supplied.\n');
  } else if (stage === 'visual') {
    write(path.join(out, 'quality/visual-review.json'), { status: 'pass',
      reviewed: screenshotPaths.map((file) => ({ path: file, findings: [] })), fixed: [], remaining: [] });
  } else {
    record({ phase: 'unexpected-stage', stage });
    process.exit(11);
  }
  record({ phase: 'end', stage, budget });
  console.log(JSON.stringify({ type: 'system', subtype: 'init', model: 'offline-test-double' }));
  console.log(JSON.stringify({ type: 'result', subtype: 'success', is_error: false,
    total_cost_usd: 0.05, duration_ms: 1, num_turns: 1, result: 'Offline fixture completed' }));
} else if (command === 'npm') {
  record({ phase: 'command', args });
  if (args.join(' ') !== 'run build') process.exit(12);
  const events = fs.readFileSync(audit, 'utf8').trim().split('\n').map((line) => JSON.parse(line));
  const buildNumber = events.filter((event) => event.command === 'npm' && event.phase === 'command').length;
  if (mode === 'final-build-failure' && buildNumber === 2) {
    console.error('Mock final build failed after polish');
    process.exit(17);
  }
  console.log('Mock build succeeded');
} else if (command === 'npx') {
  record({ phase: 'command', args });
  if (args.join(' ') === 'vitest run') console.log(' 1 passed');
  else if (args.join(' ') === 'playwright test') {
    const events = fs.readFileSync(audit, 'utf8').trim().split('\n').map((line) => JSON.parse(line));
    const round = events.filter((event) => event.command === 'npx' && event.args?.join(' ') === 'playwright test').length;
    const specs = [
      ...acceptance.map((item) => spec(item.id + ': ' + item.title, 'case-' + item.id)),
      spec('JOURNEY: complete primary task', 'journey'), spec('EDGE: validation', 'edge-cases'),
      spec('SMOKE: routes', 'smoke'),
      ...screenshotPaths.map((file) => spec('VISUAL: ' + path.basename(file, '.png'), 'visual')),
    ];
    write(path.join(out, 'app/test-results/results.json'), { suites: [{ specs }], errors: [],
      stats: { expected: specs.length, unexpected: 0, flaky: 0, skipped: 0 } });
    for (const file of screenshotPaths) {
      if (mode === 'missing-final-evidence' && round >= 2 && file === screenshotPaths.at(-1)) continue;
      // Headers are sufficient for the artifact gate; these are deliberately mock PNG fixtures.
      const bytes = Buffer.alloc(33);
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(bytes);
      bytes.writeUInt32BE(13, 8);
      bytes.write('IHDR', 12);
      bytes.writeUInt32BE(file.includes('/mobile-') ? 390 : 1440, 16);
      bytes.writeUInt32BE(file.includes('/mobile-') ? 844 : 900, 20);
      bytes[32] = round;
      write(path.join(out, file), bytes);
    }
    console.log(' ' + specs.length + ' passed');
  } else process.exit(13);
} else process.exit(14);
`;

function makeFixture(t, mode = 'success', scenarioName = 'wheels', { inputSeed } = {}) {
  // Keep the OS path spelling: on macOS /var is a symlink to /private/var.
  // This also exercises the CLI entry-point guards through a symlinked path.
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'factory-offline-run-'));
  const scenario = scenarios[scenarioName];
  fs.writeFileSync(path.join(root, 'scenario.json'), JSON.stringify(scenario));
  const target = path.join(root, 'factory');
  fs.mkdirSync(target, { recursive: true });
  fs.cpSync(path.join(workspace, '.claude/skills'), path.join(root, '.claude/skills'), { recursive: true });
  fs.copyFileSync(path.join(factory, 'run.sh'), path.join(target, 'run.sh'));
  for (const directory of ['lib', 'prompts']) fs.cpSync(path.join(factory, directory), path.join(target, directory), { recursive: true });
  fs.cpSync(path.join(factory, 'template'), path.join(target, 'template'), {
    recursive: true,
    filter: (file) => !['node_modules', 'dist', 'test-results', 'playwright-report'].includes(path.basename(file)),
  });
  fs.mkdirSync(path.join(target, 'template/node_modules'), { recursive: true });
  const bin = path.join(root, 'mock-bin');
  fs.mkdirSync(bin);
  for (const command of ['claude', 'npm', 'npx']) {
    fs.writeFileSync(path.join(bin, command), '#!' + process.execPath + '\n' + mockCommand, { mode: 0o755 });
  }
  fs.mkdirSync(path.join(root, 'input'));
  fs.writeFileSync(path.join(root, 'input/brief.md'), [scenario.brief, ...(scenario.mode === 'provided' ? scenario.checks : [])].join('\n'));
  const suppliedSeed = inputSeed ?? scenario.inputSeed;
  if (suppliedSeed !== undefined) fs.writeFileSync(path.join(root, 'input/seed.json'), JSON.stringify(suppliedSeed));
  const inputBefore = outputSnapshot(path.join(root, 'input'));
  t.after(() => {
    try { assert.deepEqual(outputSnapshot(path.join(root, 'input')), inputBefore, 'Original input folder must remain unchanged'); }
    finally { fs.rmSync(root, { recursive: true, force: true }); }
  });
  const env = { ...process.env };
  for (const key of Object.keys(env)) if (/^(ANTHROPIC_|CLAUDE)|^(BASH_ENV|ENV)$/.test(key)) delete env[key];
  Object.assign(env, {
    PATH: bin + path.delimiter + process.env.PATH,
    MOCK_FACTORY_ROOT: root, MOCK_FACTORY_MODE: mode,
    INPUT: path.join(root, 'input'), OUT: path.join(root, 'out'),
    TOTAL_BUDGET: '3.20', MAX_WALL_SECONDS: '20', MAX_FIX_ROUNDS: '0', RUN_DATE: '2026-11-01',
    REQ_BUDGET: '0.4', REVIEW_BUDGET: '0.4', DESIGN_BUDGET: '0.4', BUILD_BUDGET: '2.7',
    TESTS_BUDGET: '1.5', POLISH_BUDGET: '0.4', VISUAL_BUDGET: '0.4',
  });
  return { root, env, scenario, run: (args = []) => new Promise((resolve) => {
    execFile('/bin/bash', [path.join(target, 'run.sh'), ...args], { cwd: root, env, timeout: 25_000, maxBuffer: 2 * 1024 * 1024 },
      (error, stdout, stderr) => resolve({ code: error?.code ?? 0, stdout, stderr }));
  }) };
}

const readJson = (root, file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const eventsFor = (root) => fs.existsSync(path.join(root, 'audit.jsonl')) ?
  fs.readFileSync(path.join(root, 'audit.jsonl'), 'utf8').trim().split('\n').filter(Boolean).map((line) => JSON.parse(line)) : [];
const startedStages = (events) => events.filter((event) => event.phase === 'start').map((event) => event.stage);

test('offline runner reviews, builds in parallel, verifies twice, and stamps final visual evidence', { timeout: 30_000 }, async (t) => {
  const fixture = makeFixture(t);
  const result = await fixture.run();
  assert.equal(result.code, 0, result.stdout + result.stderr);
  const events = eventsFor(fixture.root);
  assert(events.length > 0 && events.every((event) => event.mock === true), 'All provider/package calls must use offline doubles');
  for (const event of events.filter((item) => item.phase === 'start')) {
    for (const name of ['frontend-design', 'domain-invariants', 'ux-writing', 'demo-data-quality', 'product-scope', 'vercel-react-best-practices']) {
      assert(event.availableSkills.includes(name), `${event.stage} must be able to read the installed ${name} skill from its own working directory`);
    }
  }
  const stages = startedStages(events);
  assert.deepEqual(stages.slice(0, 3), ['requirements', 'review', 'design']);
  assert.deepEqual(new Set(stages.slice(3, 5)), new Set(['build', 'tests']));
  assert.deepEqual(stages.slice(5), ['polish', 'visual']);
  assert(events.filter((event) => event.phase === 'start').every((event) => event.runDate === '2026-11-01'));
  const starts = events.filter((event) => event.phase === 'start');
  assert(starts.every((event) => event.charged <= event.total + 1e-9), 'Simultaneous reservations must stay within the original total');
  const parallel = starts.filter((event) => ['build', 'tests'].includes(event.stage));
  assert(parallel.reduce((sum, event) => sum + event.budget, 0) + 0.15 <= 3.20 + 1e-9,
    'Parallel budgets plus earlier spend must fit even when requested budgets exceed the remainder');
  const firstParallelEnd = Math.min(...events.filter((event) => event.phase === 'end' && ['build', 'tests'].includes(event.stage)).map((event) => event.time));
  assert(Math.max(...parallel.map((event) => event.time)) < firstParallelEnd, 'Builder and QA must actually overlap');
  for (const file of ['functional-0', 'final-0']) {
    for (const gate of ['build', 'unit', 'e2e']) assert(fs.existsSync(path.join(fixture.root, 'out/logs/verify-' + file + '.' + gate + '.log')));
  }
  const calls = events.filter((event) => event.phase === 'command');
  assert.equal(calls.filter((event) => event.command === 'npm').length, 2);
  assert.equal(calls.filter((event) => event.command === 'npx' && event.args[0] === 'vitest').length, 2);
  assert.equal(calls.filter((event) => event.command === 'npx' && event.args[0] === 'playwright').length, 2);
  const polishTime = starts.find((event) => event.stage === 'polish').time;
  const playwrightTimes = calls.filter((event) => event.args[0] === 'playwright').map((event) => event.time);
  assert(playwrightTimes[0] < polishTime && polishTime < playwrightTimes[1]);
  const evidence = readJson(fixture.root, 'out/quality/evidence.json');
  assert.equal(evidence.status, 'pass');
  assert.equal(evidence.screenshots.length, 6);
  for (const item of evidence.screenshots) {
    const bytes = fs.readFileSync(path.join(fixture.root, 'out', item.path));
    assert.equal(bytes[32], 2, 'Evidence must come from final verification, not the pre-polish run');
    assert.equal(item.sha256, sha256(bytes));
  }
  assert.equal(evidence.review_sha256, sha256(fs.readFileSync(path.join(fixture.root, 'out/quality/visual-review.json'))));
  const report = fs.readFileSync(path.join(fixture.root, 'out/REPORT.md'), 'utf8');
  assert.match(report, /Acceptance checks \(4\/4 passing\)/);
  assert.match(report, /Screenshots captured: 6\/6/);
  assert.match(report, /reviewed without open findings and matching final evidence: 6\/6/);
  assert.equal(readJson(fixture.root, 'out/logs/verify.json').round, 'final-0');
});

test('missing journey fails the test gate before polish instead of reporting a complete product', { timeout: 30_000 }, async (t) => {
  const fixture = makeFixture(t, 'missing-journey');
  const result = await fixture.run();
  assert.notEqual(result.code, 0, result.stdout + result.stderr);
  assert.match(result.stdout + result.stderr, /Missing journey tests|tests gate failed/);
  assert(!startedStages(eventsFor(fixture.root)).includes('polish'));
  assert(!fs.existsSync(path.join(fixture.root, 'out/quality/evidence.json')));
});

test('missing regenerated screenshot fails final review despite passing functional tests', { timeout: 30_000 }, async (t) => {
  const fixture = makeFixture(t, 'missing-final-evidence');
  const result = await fixture.run();
  assert.notEqual(result.code, 0, result.stdout + result.stderr);
  assert(startedStages(eventsFor(fixture.root)).includes('visual'));
  assert(!fs.existsSync(path.join(fixture.root, 'out/quality/evidence.json')));
  const report = fs.readFileSync(path.join(fixture.root, 'out/REPORT.md'), 'utf8');
  assert.match(report, /Screenshots captured: 5\/6/);
  assert.match(report, /Visual review is missing, incomplete, unresolved/);
  assert.equal(readJson(fixture.root, 'out/logs/verify.json').e2e, 'pass');
});

test('failed final build invalidates prior green results and all six pre-polish screenshots', { timeout: 30_000 }, async (t) => {
  const fixture = makeFixture(t, 'final-build-failure');
  const result = await fixture.run();
  assert.notEqual(result.code, 0, result.stdout + result.stderr);
  const events = eventsFor(fixture.root);
  const polishInput = events.find((event) => event.phase === 'polish-input');
  assert.equal(polishInput?.screenshots, 6, 'Functional verification must have produced all screenshots before polish');
  assert.equal(polishInput.hasPlaywrightResults, true);
  assert(!startedStages(events).includes('visual'), 'Failed final verification must not reach image approval');
  const verify = readJson(fixture.root, 'out/logs/verify.json');
  assert.equal(verify.round, 'final-0');
  assert.equal(verify.build, 'fail');
  assert.equal(verify.unit, 'skipped');
  assert.equal(verify.e2e, 'skipped');
  assert(!fs.existsSync(path.join(fixture.root, 'out/app/test-results/results.json')),
    'Old successful Playwright JSON must be removed before the failed final build');
  for (const device of ['desktop', 'mobile']) for (const screen of ['catalog', 'checkout', 'owner']) {
    assert(!fs.existsSync(path.join(fixture.root, 'out/app/visual-evidence', device + '-' + screen + '.png')),
      'Old screenshots must not survive failed final verification');
  }
  assert(!fs.existsSync(path.join(fixture.root, 'out/quality/evidence.json')));
  const report = fs.readFileSync(path.join(fixture.root, 'out/REPORT.md'), 'utf8');
  assert.match(report, /Acceptance checks \(0\/4 passing\)/);
  assert.doesNotMatch(report, /Acceptance checks \(4\/4 passing\)/);
  assert.match(report, /Screenshots captured: 0\/6/);
  assert.match(report, /TR-1[^\n]*missing/);
  assert.equal(readJson(fixture.root, 'out/logs/run.json').status, 'fail');
});

test('expired resume preserves original budget/date/deadline and never invokes the provider double', { timeout: 30_000 }, async (t) => {
  const fixture = makeFixture(t);
  fs.mkdirSync(path.join(fixture.root, 'out/logs'), { recursive: true });
  fs.mkdirSync(path.join(fixture.root, 'out/input'), { recursive: true });
  fs.copyFileSync(path.join(fixture.root, 'input/brief.md'), path.join(fixture.root, 'out/input/brief.md'));
  const original = { started_at: '2000-01-01T00:00:00Z', total_budget: 2.25,
    run_date: '2000-01-01', deadline_at: '2000-01-01T00:00:01Z', max_wall_seconds: 1, resume_count: 0 };
  fs.writeFileSync(path.join(fixture.root, 'out/logs/run.json'), JSON.stringify(original));
  fixture.env.TOTAL_BUDGET = '99';
  fixture.env.MAX_WALL_SECONDS = '999999';
  fixture.env.RUN_DATE = '2099-01-01';
  const result = await fixture.run(['--from', '4']);
  assert.notEqual(result.code, 0);
  assert.match(result.stdout + result.stderr, /deadline has expired/);
  assert.deepEqual(eventsFor(fixture.root), [], 'An expired run must not start provider or package commands');
  const resumed = readJson(fixture.root, 'out/logs/run.json');
  for (const key of ['started_at', 'total_budget', 'run_date', 'deadline_at', 'max_wall_seconds']) assert.equal(resumed[key], original[key]);
  assert.equal(resumed.resume_count, 1);
  assert(!fs.existsSync(path.join(fixture.root, '.factory.lock')), 'Run lock must be released after expiry');
});

test('default output gets its own product-named project folder without replacing earlier projects', { timeout: 30_000 }, async (t) => {
  const fixture = makeFixture(t);
  delete fixture.env.OUT;
  const earlier = path.join(fixture.root, 'out/wheels2go/REPORT.md');
  fs.mkdirSync(path.dirname(earlier), { recursive: true });
  fs.writeFileSync(earlier, '# Earlier project\n');
  const result = await fixture.run();
  assert.equal(result.code, 0, result.stdout + result.stderr);
  assert.equal(fs.readFileSync(earlier, 'utf8'), '# Earlier project\n');
  assert.equal(fs.readlinkSync(path.join(fixture.root, 'out/latest')), 'wheels2go-2');
  assert.equal(readJson(fixture.root, 'out/wheels2go-2/logs/run.json').status, 'pass');
  assert(fs.existsSync(path.join(fixture.root, 'out/wheels2go-2/REPORT.md')));
  assert.deepEqual(fs.readdirSync(path.join(fixture.root, 'out')).sort(), ['latest', 'wheels2go', 'wheels2go-2']);
});

for (const name of ['restaurant', 'crm', 'calculator', 'portfolio']) {
  test(`${name} brief-only fixture completes with its own roles, cases, journey and visual targets`, { timeout: 30_000 }, async (t) => {
    const fixture = makeFixture(t, 'success', name);
    assert.equal(fs.existsSync(path.join(fixture.root, 'input/seed.json')), false, 'This scenario intentionally supplies only a brief');
    const result = await fixture.run();
    assert.equal(result.code, 0, result.stdout + result.stderr);
    const product = readJson(fixture.root, 'out/requirements/product.json');
    assert.equal(product.name, fixture.scenario.name);
    assert.deepEqual(product.roles, fixture.scenario.roles);
    assert.deepEqual(product.entities, fixture.scenario.entities);
    assert.equal(product.acceptance_mode, fixture.scenario.mode);
    assert.equal(product.primary_journey.mutates_state, fixture.scenario.mutates);
    assert.deepEqual(readJson(fixture.root, 'out/input/seed.json'), {}, 'Missing seed gets a neutral run-local default');
    assert.deepEqual(readJson(fixture.root, 'out/app/server/data/seed.json'), fixture.scenario.resolvedSeed);
    const cases = readJson(fixture.root, 'out/requirements/acceptance.json');
    assert.equal(cases.length, fixture.scenario.checks.length);
    assert(cases.every((item) => item.source === (fixture.scenario.mode === 'provided' ? 'brief' : 'derived')));
    for (const item of cases) assert(fs.existsSync(path.join(fixture.root, 'out/app/e2e/case-' + item.id + '.spec.ts')));
    const evidence = readJson(fixture.root, 'out/quality/evidence.json');
    const imageCount = fixture.scenario.targets.length * 2;
    assert.equal(evidence.screenshots.length, imageCount);
    assert.equal(evidence.visual_plan_sha256, sha256(fs.readFileSync(path.join(fixture.root, 'out/design/visual-plan.json'))));
    for (const image of evidence.screenshots) assert(fixture.scenario.targets.some((target) => image.path.endsWith('-' + target + '.png')));
    const report = fs.readFileSync(path.join(fixture.root, 'out/REPORT.md'), 'utf8');
    assert.match(report, new RegExp('Acceptance checks \\(' + cases.length + '/' + cases.length + ' passing\\)'));
    assert.match(report, new RegExp('Screenshots captured: ' + imageCount + '/' + imageCount));
    if (fixture.scenario.mode === 'derived') {
      assert.match(report, /No brief-provided acceptance cases were recorded/);
      assert.match(report, /Derived checks were inferred from requested behavior; they are not supplied judge cases/);
    } else {
      assert.deepEqual(cases.map((item) => item.id), ['ORDER-01', 'TOTAL1']);
    }
    const vitest = eventsFor(fixture.root).filter((event) => event.command === 'npx' && event.args?.[0] === 'vitest');
    const verification = readJson(fixture.root, 'out/logs/verify.json');
    if (fixture.scenario.unitTests === false) {
      assert.equal(vitest.length, 0);
      assert.equal(verification.unit, 'not_applicable');
      assert.equal(product.unit_test_reason, fixture.scenario.unitReason);
    } else {
      assert.equal(vitest.length, 2, 'Logic-bearing products still require actual unit test commands');
      assert.equal(verification.unit, 'pass');
    }
    assert.equal(readJson(fixture.root, 'out/logs/run.json').status, 'pass');
  });
}

test('unrelated car seed remains untouched while resolved CRM seed reaches the generated app', { timeout: 30_000 }, async (t) => {
  const unrelated = { cars: [{ id: 'old-car', brand: 'Tesla' }], bookings: [] };
  const fixture = makeFixture(t, 'success', 'crm', { inputSeed: unrelated });
  const result = await fixture.run();
  assert.equal(result.code, 0, result.stdout + result.stderr);
  assert.deepEqual(readJson(fixture.root, 'input/seed.json'), unrelated);
  assert.deepEqual(readJson(fixture.root, 'out/input/seed.json'), unrelated);
  assert.deepEqual(readJson(fixture.root, 'out/requirements/seed.json'), { contacts: [], notes: [] });
  assert.deepEqual(readJson(fixture.root, 'out/app/server/data/seed.json'), { contacts: [], notes: [] });
});

test('a static unit-test exemption cannot skip existing business tests', { timeout: 30_000 }, async (t) => {
  const fixture = makeFixture(t, 'existing-unit-test', 'portfolio');
  const result = await fixture.run();
  assert.equal(result.code, 0, result.stdout + result.stderr);
  assert.equal(readJson(fixture.root, 'out/requirements/product.json').unit_tests_required, false);
  assert(fs.existsSync(path.join(fixture.root, 'out/app/shared/existing.test.ts')));
  const calls = eventsFor(fixture.root).filter((event) => event.command === 'npx' && event.args?.[0] === 'vitest');
  assert.equal(calls.length, 2, 'Both verification phases must execute existing unit tests');
  assert.equal(readJson(fixture.root, 'out/logs/verify.json').unit, 'pass');
});
