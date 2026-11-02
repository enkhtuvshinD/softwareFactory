import fs from 'node:fs';
import readline from 'node:readline';

const [stage, logBase, baseDir, included = ''] = process.argv.slice(2);
const palette = { requirements: 36, review: 36, design: 35, build: 33, tests: 34, fix: 31, polish: 35, visual: 35 };
const color = palette[stage.split('-')[0]] ?? 37;
const tag = `\x1b[${color}m[${stage}]\x1b[0m`;
const raw = fs.createWriteStream(`${logBase}.jsonl`);
const startedAt = new Date();
let model = null;
let result = null;
const tools = {};
const skills = new Set(included.split(',').filter(Boolean));
const toolNames = new Map();
const skillCalls = new Map();
const toolErrors = [];

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
      if (block.type === 'tool_use') {
        console.log(`${tag} ${describeTool(block)}`);
        tools[block.name] = (tools[block.name] ?? 0) + 1;
        toolNames.set(block.id, block.name);
        const skillFile = block.name === 'Read' && String(block.input?.file_path ?? '').match(/\/skills\/([^/]+)\/SKILL\.md$/);
        const skill = block.name === 'Skill' ? block.input?.skill : skillFile?.[1];
        if (skill) skillCalls.set(block.id, skill);
      }
      if (block.type === 'text' && block.text.trim()) console.log(`${tag} ${shorten(block.text, 160)}`);
    }
  }
  if (event.type === 'user' && Array.isArray(event.message?.content)) {
    for (const block of event.message.content) {
      if (block.type !== 'tool_result') continue;
      if (!block.is_error && skillCalls.has(block.tool_use_id)) skills.add(skillCalls.get(block.tool_use_id));
      if (!block.is_error) continue;
      const text = Array.isArray(block.content) ? block.content.map((part) => part.text ?? '').join(' ') : block.content;
      const error = { tool: toolNames.get(block.tool_use_id) ?? 'unknown', message: shorten(text ?? '', 160) };
      toolErrors.push(error);
      console.log(`${tag} \x1b[31m✗ ${error.tool}: ${error.message}\x1b[0m`);
    }
  }
  if (event.type === 'result') result = event;
}
raw.end();

const tokenFields = { input: 'inputTokens', cache_read: 'cacheReadInputTokens', cache_write: 'cacheCreationInputTokens', output: 'outputTokens' };
const modelUsage = Object.values(result?.modelUsage ?? {});
const tokens = modelUsage.length
  ? Object.fromEntries(Object.entries(tokenFields).map(([key, field]) =>
    [key, modelUsage.reduce((sum, usage) => sum + (usage[field] ?? 0), 0)]))
  : null;
const tokenTotal = tokens ? Object.values(tokens).reduce((sum, value) => sum + value, 0) : null;
const compact = (value) => value >= 1e6 ? `${(value / 1e6).toFixed(1)}M` : value >= 1e3 ? `${Math.round(value / 1e3)}k` : String(value);

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
  tokens,
  tools,
  tool_errors: toolErrors,
  skills: [...skills],
};
fs.writeFileSync(`${logBase}.result.json.tmp`, JSON.stringify(summary, null, 2));
fs.renameSync(`${logBase}.result.json.tmp`, `${logBase}.result.json`);
console.log(
  `${tag} ${summary.outcome} · ${summary.cost_known ? `$${summary.cost_usd.toFixed(2)}` : 'cost unknown (allocation retained)'} · ${Math.round(summary.duration_ms / 1000)}s · ${summary.num_turns} turns · ${tokens ? `${compact(tokenTotal)} tokens` : 'tokens unknown'} · ${toolErrors.length} tool errors`,
);
process.exitCode = summary.is_error ? 1 : 0;
