import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { budgetUsage } from './control.mjs';
import { getScreenshotPaths, validateReview, validateVisual } from './gates.mjs';

const icons = { pass: '✅', fail: '❌', flaky: '❌', skipped: '⏭️', missing: '⚠️', not_applicable: '—' };
const reviewChecks = ['acceptance_preserved', 'capability_coverage', 'domain_consistent', 'journey_complete', 'scope_consistent'];
const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const cell = (value) => String(value ?? '').replace(/\x1b\[[0-9;]*m/g, '').replaceAll('|', '\\|').replace(/\s+/g, ' ').trim();
const money = (value) => Number.isFinite(value) ? `$${value.toFixed(2)}` : 'not recorded';
const count = (value) => Number.isFinite(value) ? value.toLocaleString('en-US') : 'not recorded';
const toolCalls = (tools) => tools && typeof tools === 'object'
  ? Object.entries(tools).sort((a, b) => b[1] - a[1]).map(([name, calls]) => `${name} ${calls}`).join(', ') || 'none'
  : 'not recorded';
const duration = (value) => {
  if (!Number.isFinite(value) || value < 0) return 'not recorded';
  const seconds = Math.round(value / 1000);
  return `${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2, '0')}s`;
};
const gate = (value) => `${icons[value] ?? '—'} ${value === 'not_applicable' ? 'not applicable' : value ?? 'not run'}`;
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

// Playwright's spec.ok includes skipped and expected-to-fail tests. A pass here
// requires a successful execution in every project, without failed retries.
export function specStatus(spec) {
  const tests = spec?.tests;
  if (!Array.isArray(tests) || tests.length === 0) return 'missing';
  if (spec.ok !== true) return 'fail';
  return aggregate(tests.map((test) => {
    if (test.status === 'flaky') return 'flaky';
    if (test.status === 'skipped' || test.expectedStatus === 'skipped') return 'skipped';
    if (test.expectedStatus !== 'passed') return 'fail';
    if (!Array.isArray(test.results) || test.results.length === 0) return 'missing';
    if (test.results.every((result) => result.status === 'skipped')) return 'skipped';
    if (test.status !== 'expected' || test.results.length !== 1 || test.results.some((result) => result.status !== 'passed')) return 'fail';
    return 'pass';
  }));
}

function aggregate(statuses) {
  if (statuses.length === 0) return 'missing';
  return ['fail', 'flaky', 'skipped', 'missing'].find((status) => statuses.includes(status)) ?? 'pass';
}

function firstError(specs) {
  return specs.flatMap((spec) => spec.tests ?? [])
    .flatMap((test) => test.results ?? [])
    .map((result) => result.error?.message ?? result.errors?.[0]?.message)
    .find(Boolean)?.split('\n')[0] ?? '';
}

export function generateReport(outputDirectory) {
  const out = path.resolve(outputDirectory);
  const read = (file, fallback) => {
    try { return JSON.parse(fs.readFileSync(path.join(out, file), 'utf8')); }
    catch { return fallback; }
  };
  const readLines = (file) => {
    try { return fs.readFileSync(path.join(out, file), 'utf8').split('\n').filter(Boolean).map((line) => JSON.parse(line)); }
    catch { return []; }
  };
  const exists = (file) => {
    try { return fs.statSync(path.join(out, file)).isFile(); }
    catch { return false; }
  };
  const run = read('logs/run.json', {}) ?? {};
  const verify = read('logs/verify.json', {}) ?? {};
  const verifyRounds = readLines('logs/verify-history.jsonl').filter((item) => typeof item?.round === 'string');
  const product = read('requirements/product.json', null);
  const acceptanceData = read('requirements/acceptance.json', []);
  const acceptance = Array.isArray(acceptanceData) ? acceptanceData.filter((item) =>
    item && typeof item.id === 'string' && typeof item.title === 'string') : [];
  const playwright = read('app/test-results/results.json', {}) ?? {};
  const requirementReview = read('requirements/review.json', null);
  const visualReview = read('quality/visual-review.json', null);
  const evidence = read('quality/evidence.json', null);
  let stageFiles = [];
  try { stageFiles = fs.readdirSync(path.join(out, 'logs')); } catch { /* Report partial runs too. */ }
  const stageNames = [...new Set(stageFiles.filter((file) => /\.(allocation|result)\.json$/.test(file))
    .map((file) => file.replace(/\.(allocation|result)\.json$/, '')))];
  const stages = stageNames.map((name) => {
    const result = read(`logs/${name}.result.json`, null);
    const allocation = read(`logs/${name}.allocation.json`, null);
    const confirmed = result && result.outcome !== 'no_result' && result.cost_known !== false &&
      Number.isFinite(result.cost_usd) && result.cost_usd >= 0;
    return {
      stage: name, started_at: allocation?.reserved_at, outcome: 'unfinished', ...result,
      confirmed: Boolean(confirmed),
      budget_charge: confirmed ? result.cost_usd : (allocation?.budget_usd ?? run.total_budget),
    };
  })
    .sort((a, b) => String(a.started_at ?? '').localeCompare(String(b.started_at ?? '')));
  const specs = [];
  const collect = (suite, parentFile = '') => {
    if (!suite || typeof suite !== 'object') return;
    const file = typeof suite.file === 'string' ? suite.file : parentFile;
    for (const spec of Array.isArray(suite.specs) ? suite.specs : []) {
      if (spec && typeof spec === 'object') specs.push({ ...spec, file: typeof spec.file === 'string' ? spec.file : file });
    }
    for (const nested of Array.isArray(suite.suites) ? suite.suites : []) collect(nested, file);
  };
  for (const suite of Array.isArray(playwright.suites) ? playwright.suites : []) collect(suite);

  const acceptanceCases = acceptance.map((testCase) => {
    const matches = specs.filter((spec) => spec.title?.startsWith(`${testCase.id}:`));
    const status = aggregate(matches.map(specStatus));
    const note = firstError(matches) || (status === 'pass' ? '' : 'Every project must execute and pass; skipped/flaky checks do not count.');
    return { ...testCase, status, note };
  });
  const acceptancePassed = acceptanceCases.filter((testCase) => testCase.status === 'pass').length;
  const matchesAcceptance = (spec) => acceptance.some((item) => spec.title?.startsWith(`${item.id}:`));
  const extraSpecs = specs.filter((spec) => !matchesAcceptance(spec));
  const extraGroups = [
    ['Journey', 'journey.spec.ts'], ['Edge cases', 'edge-cases.spec.ts'],
    ['Route smoke', 'smoke.spec.ts'], ['Visual capture', 'visual.spec.ts'],
  ];
  const knownFiles = new Set(extraGroups.map(([, file]) => file));
  const extraRows = extraGroups.map(([label, file]) => {
    const items = extraSpecs.filter((spec) => path.basename(spec.file ?? '') === file);
    const passed = items.filter((spec) => specStatus(spec) === 'pass').length;
    return `| ${label} | ${passed}/${items.length} | ${gate(aggregate(items.map(specStatus)))} |`;
  });
  const otherSpecs = extraSpecs.filter((spec) => !knownFiles.has(path.basename(spec.file ?? '')));
  if (otherSpecs.length) extraRows.push(`| Other | ${otherSpecs.filter((spec) => specStatus(spec) === 'pass').length}/${otherSpecs.length} | ${gate(aggregate(otherSpecs.map(specStatus)))} |`);
  const unexpectedCaseSpecs = specs.filter((spec) => path.basename(spec.file ?? '').startsWith('case-') && !matchesAcceptance(spec));

  let requirementStatus = requirementReview ? 'fail' : 'missing';
  try { validateReview(out); requirementStatus = 'pass'; } catch { /* A label alone cannot establish a valid contract. */ }
  let screenshots = [];
  let visualPlanError = null;
  try { screenshots = getScreenshotPaths(out); } catch (error) { visualPlanError = error.message; }
  let reviewHashMatches = false;
  try {
    reviewHashMatches = evidence?.review_sha256 === sha256(fs.readFileSync(path.join(out, 'quality/visual-review.json'))) &&
      evidence?.visual_plan_sha256 === sha256(fs.readFileSync(path.join(out, 'design/visual-plan.json')));
  }
  catch { /* Missing review cannot match a stamp. */ }
  const imageEvidence = screenshots.map((file) => {
    let captured = false;
    let current = false;
    try {
      const bytes = fs.readFileSync(path.join(out, file));
      const mobile = file.includes('/mobile-');
      captured = bytes.length > 24 && bytes.subarray(0, 8).equals(pngSignature) &&
        bytes.readUInt32BE(16) === (mobile ? 390 : 1440) && bytes.readUInt32BE(20) >= (mobile ? 844 : 900);
      const stamps = Array.isArray(evidence?.screenshots) ? evidence.screenshots.filter((item) => item.path === file) : [];
      current = stamps.length === 1 && stamps[0].sha256 === sha256(bytes);
    } catch { /* Missing evidence is reported, never assumed. */ }
    const reviews = Array.isArray(visualReview?.reviewed) ? visualReview.reviewed.filter((item) => item.path === file) : [];
    const reviewed = reviews.length === 1 && Array.isArray(reviews[0].findings) && reviews[0].findings.length === 0;
    return { file, captured, current, reviewed };
  });
  let visualStatus = visualReview ? 'fail' : 'missing';
  try { validateVisual(out); visualStatus = 'pass'; } catch { /* Explain incomplete evidence in the report. */ }
  const totalCost = stages.reduce((sum, stage) => sum + (stage.confirmed ? stage.cost_usd : 0), 0);
  const tokenTotal = (key) => {
    const known = stages.filter((stage) => Number.isFinite(stage.tokens?.[key]));
    return known.length ? known.reduce((sum, stage) => sum + stage.tokens[key], 0) : NaN;
  };
  const toolErrors = stages.flatMap((stage) => Array.isArray(stage.tool_errors)
    ? stage.tool_errors.map((error) => ({ stage: stage.stage, ...error }))
    : []);
  const unknownCosts = stages.filter((stage) => !stage.confirmed);
  let budgetCharge = NaN;
  try { budgetCharge = budgetUsage(path.join(out, 'logs'), run.total_budget); } catch { /* Partial run may not have a ledger. */ }
  const reservedCost = budgetCharge - totalCost;
  const wallMs = run.started_at && run.finished_at ? Date.parse(run.finished_at) - Date.parse(run.started_at) : NaN;
  let appTitle = null;
  if (exists('app/index.html')) appTitle = fs.readFileSync(path.join(out, 'app/index.html'), 'utf8').match(/<title>(.*?)<\/title>/)?.[1];
  const limitations = [
    ...(Array.isArray(requirementReview?.findings) ? requirementReview.findings : []),
    ...(Array.isArray(visualReview?.remaining) ? visualReview.remaining : []),
    ...(Array.isArray(visualReview?.limitations) ? visualReview.limitations : []),
    ...(!acceptance.length ? ['Acceptance cases are missing or invalid.'] : []),
    ...(Array.isArray(acceptanceData) && acceptanceData.length !== acceptance.length ? ['Malformed acceptance entries were excluded from the report.'] : []),
    ...(!product ? ['Product contract is missing; domain, roles and acceptance provenance are not established.'] : []),
    ...(acceptance.some((item) => !['brief', 'derived'].includes(item.source)) ? ['Some acceptance case sources were not recorded; they are not claimed as brief-provided judge cases.'] : []),
    ...(requirementStatus !== 'pass' ? ['Requirements review has not passed.'] : []),
    ...(visualStatus !== 'pass' ? ['Visual review is missing, incomplete, unresolved, or no longer matches the captured evidence.'] : []),
    ...(visualPlanError ? [`Visual evidence plan is unavailable: ${visualPlanError}`] : []),
    ...(!Array.isArray(playwright.suites) ? ['No readable Playwright result was produced.'] : []),
    ...(playwright.errors?.length ? [`Playwright recorded ${playwright.errors.length} runner error(s).`] : []),
    ...(unknownCosts.length ? ['Some agent costs are missing or incomplete. Their allocations remain reserved; confirmed spend is not the final total.'] : []),
    ...(unexpectedCaseSpecs.length ? [`${unexpectedCaseSpecs.length} acceptance-file test(s) do not match the acceptance list.`] : []),
  ];
  const deadline = run.deadline_at ? ` · Deadline ${cell(run.deadline_at)}` : '';
  const resumed = run.resume_count ? ` · Resumes ${cell(run.resume_count)}` : '';
  const reviewRows = reviewChecks.map((key) => `| ${key} | ${gate(requirementReview ? (requirementReview.checks?.[key] === true ? 'pass' : 'fail') : 'missing')} |`);
  const caseSection = (title, cases, empty) => `## ${title}${cases.length ? ` (${cases.filter((item) => item.status === 'pass').length}/${cases.length} passing)` : ' (none recorded)'}

${cases.length ? `| ID | Test case | Result | Source reference | Detail |
|---|---|---|---|---|
${cases.map((item) => `| ${cell(item.id)} | ${cell(item.title)} | ${gate(item.status)} | ${cell(item.source_ref ?? 'not recorded')} | ${cell(item.note)} |`).join('\n')}` : empty}
`;
  const provided = acceptanceCases.filter((item) => item.source === 'brief');
  const derived = acceptanceCases.filter((item) => item.source === 'derived');
  const unrecorded = acceptanceCases.filter((item) => !['brief', 'derived'].includes(item.source));
  const evidenceCount = screenshots.length || 'not available';
  const report = `# Factory Run Report${product?.name || appTitle ? ` — ${cell(product?.name || appTitle)}` : ''}

Started ${cell(run.started_at ?? 'not recorded')} · Wall time **${duration(wallMs)}** · Recorded cost **${money(totalCost)}** of ${money(run.total_budget)} budget${deadline}${resumed}

Run outcome: **${cell(run.status ?? 'not recorded')}**.

Budget accounting: **${money(budgetCharge)}** charged/reserved (${money(totalCost)} confirmed spend + ${money(reservedCost)} unreconciled reservations). Missing provider costs are never counted as zero.

${product ? `Product roles: ${Array.isArray(product.roles) ? product.roles.map(cell).join(', ') : 'not recorded'}. Acceptance mode: ${cell(product.acceptance_mode ?? 'not recorded')}.

Primary journey: ${cell(product.primary_journey?.title ?? 'not recorded')}.${verify.unit === 'not_applicable' ? ` Unit tests: not applicable — ${cell(product.unit_test_reason ?? 'reason not recorded')}.` : ''}
` : ''}
## Acceptance checks (${acceptancePassed}/${acceptance.length} passing)

A case passes only when all its recorded project executions actually pass. Skipped, flaky, expected-failure, and unexecuted tests do not count.

${!acceptance.length ? 'No acceptance cases | ⚠️ missing\n' : ''}
${caseSection('Brief-provided acceptance cases', provided, 'No brief-provided acceptance cases were recorded.')}
${caseSection('Derived acceptance cases', derived, 'No derived acceptance cases were recorded.')}
${derived.length ? 'Derived checks were inferred from requested behavior; they are not supplied judge cases.\n' : ''}
${unrecorded.length ? caseSection('Acceptance cases with unrecorded source', unrecorded, '') : ''}
## Additional behavior and capture checks

| Group | Passing/recorded | Result |
|---|---|---|
${extraRows.join('\n')}
${verifyRounds.length ? `
## Self-healing verification rounds

When a round fails, the runner sends its failure logs to the fix agent and reruns every gate. Rounds are in execution order.

| Round | Type-check + build | Unit tests | E2E tests | E2E counts |
|---|---|---|---|---|
${verifyRounds.map((item) => `| ${cell(item.round)} | ${gate(item.build)} | ${gate(item.unit)} | ${gate(item.e2e)} | ${cell(item.e2e_counts || '—')} |`).join('\n')}
` : ''}
## Quality gates (verification round ${cell(verify.round ?? 'not run')})

| Type-check + build | Unit tests | E2E tests | Requirements review | Visual review |
|---|---|---|---|---|
| ${gate(verify.build)} | ${gate(verify.unit)} | ${gate(verify.e2e)} | ${gate(requirementStatus)} | ${gate(visualStatus)} |

Requirements review: ${requirementReview ? '[record](requirements/review.json)' : 'not produced'}.

| Contract check | Result |
|---|---|
${reviewRows.join('\n')}

## Rendered evidence

Visual plan: ${visualPlanError ? 'not available' : '[record](design/visual-plan.json)'}. Visual review: ${visualReview ? '[record](quality/visual-review.json)' : 'not produced'}. Screenshots captured: ${imageEvidence.filter((item) => item.captured).length}/${evidenceCount}; reviewed without open findings and matching final evidence: ${imageEvidence.filter((item) => item.captured && item.current && item.reviewed && reviewHashMatches).length}/${evidenceCount}.

| Screenshot | PNG present | Recorded review | Matches final stamp |
|---|---|---|---|
${imageEvidence.map((item) => `| ${item.captured ? `[${path.basename(item.file)}](${item.file})` : path.basename(item.file)} | ${gate(item.captured ? 'pass' : 'missing')} | ${gate(item.reviewed ? 'pass' : 'missing')} | ${gate(item.current && reviewHashMatches ? 'pass' : 'missing')} |`).join('\n') || '| No valid targets recorded | ⚠️ missing | ⚠️ missing | ⚠️ missing |'}
${Array.isArray(visualReview?.fixed) && visualReview.fixed.length ? `\nVisual fixes: ${visualReview.fixed.map(cell).join('; ')}.\n` : ''}
## Remaining limitations

${limitations.length ? limitations.map((item) => `- ${cell(item)}`).join('\n') : 'No open limitations were recorded by the review stages.'}

## Agent stages

| Stage | Model | Turns | Time | Confirmed cost | Budget charge/reservation | Outcome |
|---|---|---|---|---|---|---|
${stages.map((stage) => `| ${cell(stage.stage)} | ${cell(stage.model ?? 'not recorded')} | ${cell(stage.num_turns ?? 'not recorded')} | ${duration(stage.duration_ms)} | ${stage.confirmed ? money(stage.cost_usd) : 'unknown'} | ${money(stage.budget_charge)}${stage.confirmed ? '' : ' reserved'} | ${cell(stage.outcome)} |`).join('\n')}
| **Total** | | ${stages.reduce((sum, stage) => sum + (stage.num_turns ?? 0), 0)} | | **${money(totalCost)}** | **${money(budgetCharge)}** | |

## Tokens and tool activity

| Stage | Input | Cache read | Cache write | Output | Tool calls | Tool errors | Skills |
|---|---|---|---|---|---|---|---|
${stages.map((stage) => `| ${cell(stage.stage)} | ${count(stage.tokens?.input)} | ${count(stage.tokens?.cache_read)} | ${count(stage.tokens?.cache_write)} | ${count(stage.tokens?.output)} | ${cell(toolCalls(stage.tools))} | ${Array.isArray(stage.tool_errors) ? stage.tool_errors.length : 'not recorded'} | ${cell(Array.isArray(stage.skills) ? stage.skills.join(', ') || '—' : 'not recorded')} |`).join('\n')}
| **Total** | **${count(tokenTotal('input'))}** | **${count(tokenTotal('cache_read'))}** | **${count(tokenTotal('cache_write'))}** | **${count(tokenTotal('output'))}** | | **${toolErrors.length}** | |
${toolErrors.length ? `\nTool errors:\n\n${toolErrors.map((error) => `- ${cell(error.stage)} · ${cell(error.tool)}: ${cell(error.message)}`).join('\n')}\n` : ''}
## Artifacts

- Requirements: [requirements/requirements.md](requirements/requirements.md), [requirements/product.json](requirements/product.json), [requirements/acceptance.json](requirements/acceptance.json)
- Design: [design/ui-spec.md](design/ui-spec.md), [design/visual-plan.json](design/visual-plan.json), [design/tokens.json](design/tokens.json), [design/tokens.css](design/tokens.css)
- Application: [app/](app/) — run with \`cd app && npm ci && npm run build && npm start\` from this folder, then open http://localhost:3000
- Tests: [app/e2e/](app/e2e/), unit tests in \`app/shared/*.test.ts\`, [HTML report](app/playwright-report/index.html)
${exists('quality/demo.md') ? '- Demo script: [quality/demo.md](quality/demo.md)\n' : ''}- Agent transcripts: [logs/](logs/)
`;
  return report;
}

if (process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href) {
  if (!process.argv[2]) {
    console.error('usage: node factory/lib/report.mjs <output-directory>');
    process.exitCode = 1;
  } else {
    const report = generateReport(process.argv[2]);
    fs.writeFileSync(path.join(path.resolve(process.argv[2]), 'REPORT.md'), report);
    console.log(`\n${report}`);
  }
}
