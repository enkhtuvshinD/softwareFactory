import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { budgetUsage, reserveBudget } from './control.mjs';

const fixture = (t) => {
  const logs = fs.mkdtempSync(path.join(os.tmpdir(), 'factory-budget-'));
  t.after(() => fs.rmSync(logs, { recursive: true, force: true }));
  return logs;
};

test('parallel agents cannot reserve the same remaining dollars', async (t) => {
  const logs = fixture(t);
  const reservations = await Promise.all([
    reserveBudget(logs, 'build', 6, 10), reserveBudget(logs, 'tests', 6, 10),
  ]);
  assert.equal(reservations.reduce((sum, item) => sum + item.budget, 0), 10);
  await assert.rejects(reserveBudget(logs, 'fix', 1, 10), /Insufficient/);
});

test('provider cost frees unused allocation and interrupted result retains it', async (t) => {
  const logs = fixture(t);
  await reserveBudget(logs, 'build', 6, 10);
  fs.writeFileSync(path.join(logs, 'build.result.json'), JSON.stringify({ outcome: 'success', cost_usd: 1.25, cost_known: true }));
  assert.equal(budgetUsage(logs, 10), 1.25);
  const first = await reserveBudget(logs, 'fix', 6, 10);
  assert.equal(first.name, 'fix');
  fs.writeFileSync(path.join(logs, 'fix.result.json'), JSON.stringify({ outcome: 'no_result', cost_usd: 0, cost_known: false }));
  assert.equal(budgetUsage(logs, 10), 7.25);
  const retry = await reserveBudget(logs, 'fix', 6, 10);
  assert.deepEqual(retry, { name: 'fix-2', budget: 2.75 });
});

test('rounding never allocates beyond the remaining budget', async (t) => {
  const logs = fixture(t);
  fs.writeFileSync(path.join(logs, 'old.result.json'), JSON.stringify({ outcome: 'success', cost_usd: 0.001 }));
  assert.equal((await reserveBudget(logs, 'build', 1, 1)).budget, 0.99);
});

test('unknown legacy costs consume the remaining budget conservatively', async (t) => {
  const logs = fixture(t);
  fs.writeFileSync(path.join(logs, 'old.result.json'), JSON.stringify({ outcome: 'no_result', cost_usd: 0 }));
  await assert.rejects(reserveBudget(logs, 'build', 1, 14), /Insufficient/);
});

const run = (args, env = process.env) => new Promise((resolve) => {
  const child = spawn(process.execPath, args, { env, stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '';
  child.stdout.on('data', (chunk) => { output += chunk; });
  child.stderr.on('data', (chunk) => { output += chunk; });
  child.on('close', (code) => resolve({ code, output }));
});

test('deadline terminates a command and its detached tool descendants', async (t) => {
  const logs = fixture(t);
  const marker = path.join(logs, 'leaked-child');
  const descendant = `process.on('SIGTERM',()=>{});setTimeout(()=>require('fs').writeFileSync(${JSON.stringify(marker)},'leaked'),1800);`;
  const parent = `require('child_process').spawn(process.execPath,['-e',${JSON.stringify(descendant)}],{stdio:'ignore'});setInterval(()=>{},1000);`;
  const result = await run([new URL('./limit.mjs', import.meta.url).pathname, String(Date.now() + 300), process.execPath, '-e', parent]);
  assert.equal(result.code, 124, result.output);
  await new Promise((resolve) => setTimeout(resolve, 1300));
  assert.equal(fs.existsSync(marker), false);
});

test('expired commands never start', async (t) => {
  const logs = fixture(t);
  const marker = path.join(logs, 'started');
  const result = await run([new URL('./limit.mjs', import.meta.url).pathname, String(Date.now() - 1),
    process.execPath, '-e', `require('fs').writeFileSync(${JSON.stringify(marker)},'bad')`]);
  assert.equal(result.code, 124);
  assert.equal(fs.existsSync(marker), false);
});

test('a successful command cannot leave background tool descendants alive', async (t) => {
  const logs = fixture(t);
  const marker = path.join(logs, 'orphan');
  const descendant = `setTimeout(()=>require('fs').writeFileSync(${JSON.stringify(marker)},'leaked'),900);`;
  const parent = `require('child_process').spawn(process.execPath,['-e',${JSON.stringify(descendant)}],{stdio:'ignore'}).unref();`;
  const result = await run([new URL('./limit.mjs', import.meta.url).pathname, String(Date.now() + 5000), process.execPath, '-e', parent]);
  assert.equal(result.code, 0, result.output);
  await new Promise((resolve) => setTimeout(resolve, 1000));
  assert.equal(fs.existsSync(marker), false);
});
