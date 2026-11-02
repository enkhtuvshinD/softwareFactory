import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { collectRun, generateDashboard } from './dashboard.mjs';

function fixture(t) {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'factory-dashboard-'));
  t.after(() => fs.rmSync(out, { recursive: true, force: true }));
  const put = (file, value) => {
    const target = path.join(out, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, typeof value === 'string' ? value : JSON.stringify(value));
  };
  const writes = (...files) => files.map((file) => JSON.stringify({
    type: 'assistant', message: { content: [{ type: 'tool_use', name: 'Write', input: { file_path: file } }] },
  })).join('\n');
  put('requirements/product.json', { name: 'DeskCRM' });
  put('logs/run.json', { started_at: '2026-11-01T00:00:00Z', finished_at: '2026-11-01T00:10:00Z', total_budget: 4, max_wall_seconds: 3600, status: 'pass' });
  put('logs/requirements.allocation.json', { stage: 'requirements', budget_usd: 0.5, reserved_at: '2026-11-01T00:00:00Z' });
  put('logs/requirements.result.json', {
    stage: 'requirements', model: 'claude-sonnet-5-5', started_at: '2026-11-01T00:00:00Z', finished_at: '2026-11-01T00:02:00Z',
    outcome: 'success', cost_usd: 0.3, cost_known: true, num_turns: 7,
    tokens: { input: 10, cache_read: 1000, cache_write: 200, output: 50 }, tool_errors: [], final_message: 'Wrote the **contract**.',
  });
  put('logs/requirements.jsonl', writes('/elsewhere/out/run-20261101-000000/requirements/requirements.md', path.join(out, 'requirements/product.json')));
  put('logs/fix.allocation.json', { stage: 'fix', budget_usd: 0.5, reserved_at: '2026-11-01T00:06:00Z' });
  put('logs/fix.result.json', {
    stage: 'fix', model: 'claude-sonnet-5-5', started_at: '2026-11-01T00:06:00Z', finished_at: '2026-11-01T00:07:00Z',
    outcome: 'success', cost_usd: 0.2, cost_known: true, num_turns: 9,
    tokens: { input: 5, cache_read: 500, cache_write: 100, output: 30 },
    tool_errors: [{ tool: 'Bash', message: 'Exit code 1' }],
    final_message: '**Causes**\n- `Header` lacked its testid <script>alert(1)</script>\nAll tests pass.',
  });
  put('logs/fix.jsonl', writes(path.join(out, 'app/src/Header.tsx')));
  put('logs/verify-history.jsonl', [
    { round: 'functional-0', build: 'pass', unit: 'pass', e2e: 'fail', e2e_counts: '1 failed, 3 passed', started_at: '2026-11-01T00:05:00Z', finished_at: '2026-11-01T00:06:00Z' },
    { round: 'functional-1', build: 'pass', unit: 'pass', e2e: 'pass', e2e_counts: '4 passed', started_at: '2026-11-01T00:07:00Z', finished_at: '2026-11-01T00:08:00Z' },
  ].map((round) => JSON.stringify(round)).join('\n') + '\n');
  put('logs/verify-functional-0.e2e.log', '  1) failure details\n\n  1 failed\n    [chromium] › e2e/smoke.spec.ts:24:3 › SMOKE: contacts load ──────\n  3 passed (4.2s)\n');
  return { out, put };
}

test('stage time, cost, tokens and written files come from the recorded logs', (t) => {
  const { out } = fixture(t);
  const data = collectRun(out);
  const requirements = data.stages.find((stage) => stage.name === 'requirements');
  assert.deepEqual(requirements.files, ['requirements/requirements.md', 'requirements/product.json']);
  assert.equal(requirements.end - requirements.start, 120000);
  assert.equal(data.cost, 0.5);
  assert.deepEqual(data.tokens, { input: 15, cache_read: 1500, cache_write: 300, output: 80 });
  const html = generateDashboard(out);
  assert.match(html, /<h1>DeskCRM<\/h1>/);
  assert.match(html, /\$0\.50<\/p><p class="sub">of \$4\.00 budget/);
  assert.match(html, /<code>requirements\/requirements\.md<\/code>/);
  assert.match(html, /2m 00s · \$0\.30/);
});

test('a failed round is paired with the fix agent that ran before the next round', (t) => {
  const { out } = fixture(t);
  const [incident, ...rest] = collectRun(out).incidents;
  assert.equal(rest.length, 0);
  assert.equal(incident.round.name, 'functional-0');
  assert.equal(incident.repair.name, 'fix');
  assert.equal(incident.next.name, 'functional-1');
  assert.deepEqual(incident.round.failures[0].tests, [{ title: 'SMOKE: contacts load', location: 'e2e/smoke.spec.ts:24:3' }]);
  const html = generateDashboard(out);
  assert.match(html, /Round functional-0 failed/);
  assert.match(html, /SMOKE: contacts load/);
  assert.match(html, /Round functional-1 passed/);
  assert.match(html, /<strong>Causes<\/strong>/);
});

test('agent text is escaped rather than rendered as markup', (t) => {
  const { out } = fixture(t);
  const html = generateDashboard(out);
  assert.doesNotMatch(html, /<script>alert/);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.match(html, /<code>Header<\/code>/);
});

test('runs without verification history or token records stay readable', (t) => {
  const { out, put } = fixture(t);
  fs.rmSync(path.join(out, 'logs/verify-history.jsonl'));
  put('logs/fix.result.json', { stage: 'fix', outcome: 'no_result', cost_known: false });
  put('logs/requirements.result.json', { stage: 'requirements', outcome: 'success', cost_usd: 0.3, cost_known: true });
  const html = generateDashboard(out);
  assert.match(html, /No verification rounds were recorded/);
  assert.match(html, /<p class="label">Tokens<\/p><p class="value">—<\/p>/);
  assert.match(html, /\$0\.30<\/p><p class="sub">of \$4\.00 budget/);
});
