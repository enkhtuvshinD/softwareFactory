import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const read = (file) => {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
};
const amount = (value) => typeof value === 'number' && Number.isFinite(value) && value >= 0;

// An unfinished or interrupted agent keeps its entire allocation reserved.
// A real provider result replaces that reservation with its reported cost.
export function budgetUsage(logs, total) {
  const names = new Set(fs.readdirSync(logs)
    .filter((name) => /\.(allocation|result)\.json$/.test(name))
    .map((name) => name.replace(/\.(allocation|result)\.json$/, '')));
  let used = 0;
  for (const name of names) {
    const allocation = read(path.join(logs, `${name}.allocation.json`));
    const result = read(path.join(logs, `${name}.result.json`));
    if (result && result.outcome !== 'no_result' && result.cost_known !== false && amount(result.cost_usd)) {
      used += result.cost_usd;
    } else {
      used += amount(allocation?.budget_usd) ? allocation.budget_usd : total;
    }
  }
  return used;
}

export async function reserveBudget(logs, stage, wanted, total) {
  if (!/^[a-z][a-z0-9-]*$/.test(stage) || !(wanted > 0) || !(total > 0) ||
      !Number.isFinite(wanted) || !Number.isFinite(total)) throw new Error('Invalid budget configuration');
  fs.mkdirSync(logs, { recursive: true });
  const lock = path.join(logs, '.budget-lock');
  let acquired = false;
  for (let attempt = 0; attempt < 200; attempt++) {
    try {
      fs.mkdirSync(lock);
      acquired = true;
      break;
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }
  if (!acquired) throw new Error('Budget reservation lock is busy; no agent was started');
  try {
    const available = total - budgetUsage(logs, total);
    // Round down: rounding up could allocate more than the remaining budget.
    const budget = Math.floor((Math.min(wanted, available) + 1e-9) * 100) / 100;
    if (budget < 0.3) throw new Error('Insufficient unreserved budget (minimum $0.30 per agent)');
    let name = stage;
    for (let index = 2; fs.existsSync(path.join(logs, `${name}.allocation.json`)) ||
      fs.existsSync(path.join(logs, `${name}.result.json`)); index++) name = `${stage}-${index}`;
    fs.writeFileSync(path.join(logs, `${name}.allocation.json`), JSON.stringify({
      stage: name, budget_usd: budget, reserved_at: new Date().toISOString(),
    }, null, 2), { flag: 'wx' });
    return { name, budget };
  } finally {
    fs.rmdirSync(lock);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href) {
  try {
    const [command, logs, stage, wanted, total] = process.argv.slice(2);
    if (command !== 'reserve') throw new Error('Usage: control.mjs reserve LOGS STAGE WANTED TOTAL');
    const reservation = await reserveBudget(logs, stage, Number(wanted), Number(total));
    console.log(`${reservation.name}\t${reservation.budget.toFixed(2)}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
