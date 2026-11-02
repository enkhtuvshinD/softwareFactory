import fs from 'node:fs';
import readline from 'node:readline';

const [stage, logBase, baseDir] = process.argv.slice(2);
const palette = { requirements: 36, review: 36, design: 35, build: 33, tests: 34, fix: 31, polish: 35, visual: 35 };
const color = palette[stage.split('-')[0]] ?? 37;
const tag = `\x1b[${color}m[${stage}]\x1b[0m`;
const raw = fs.createWriteStream(`${logBase}.jsonl`);
const startedAt = new Date();
let model = null;
let result = null;

const shorten = (text, max) => {
  const flat = String(text).replaceAll(`${baseDir}/`, '').replace(/\s+/g, ' ').trim();
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
};

const describeTool = ({ name, input = {} }) =>
  `${name} ${shorten(input.file_path ?? input.command ?? input.pattern ?? input.path ?? '', 110)}`;

for await (const line of readline.createInterface({ input: process.stdin })) {
  raw.write(`${line}\n`);
  let event;
  try {
    event = JSON.parse(line);
  } catch {
    continue;
  }
  if (event.type === 'system' && event.subtype === 'init') model = event.model;
  if (event.type === 'assistant') {
    for (const block of event.message?.content ?? []) {
      if (block.type === 'tool_use') console.log(`${tag} ${describeTool(block)}`);
      if (block.type === 'text' && block.text.trim()) console.log(`${tag} ${shorten(block.text, 160)}`);
    }
  }
  if (event.type === 'result') result = event;
}
raw.end();

const summary = {
  stage,
  model,
  started_at: startedAt.toISOString(),
  finished_at: new Date().toISOString(),
  outcome: result?.subtype ?? 'no_result',
  is_error: result?.is_error ?? true,
  cost_usd: result?.total_cost_usd ?? null,
  cost_known: typeof result?.total_cost_usd === 'number' && Number.isFinite(result.total_cost_usd),
  duration_ms: result?.duration_ms ?? Date.now() - startedAt.getTime(),
  num_turns: result?.num_turns ?? 0,
  final_message: result?.result ?? null,
};
fs.writeFileSync(`${logBase}.result.json.tmp`, JSON.stringify(summary, null, 2));
fs.renameSync(`${logBase}.result.json.tmp`, `${logBase}.result.json`);
console.log(
  `${tag} ${summary.outcome} · ${summary.cost_known ? `$${summary.cost_usd.toFixed(2)}` : 'cost unknown (allocation retained)'} · ${Math.round(summary.duration_ms / 1000)}s · ${summary.num_turns} turns`,
);
process.exitCode = summary.is_error ? 1 : 0;
