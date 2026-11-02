import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ansi = /\x1b\[[0-9;]*m/g;
const writeTools = new Set(['Write', 'Edit', 'MultiEdit', 'NotebookEdit']);
const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const money = (value) => Number.isFinite(value) ? `$${value.toFixed(2)}` : '—';
const count = (value) => Number.isFinite(value) ? value.toLocaleString('en-US') : '—';
const compact = (value) => !Number.isFinite(value) ? '—' : value >= 1e6 ? `${(value / 1e6).toFixed(1)}M` : value >= 1e3 ? `${Math.round(value / 1e3)}k` : String(value);
const clock = (ms) => {
  if (!Number.isFinite(ms) || ms < 0) return '—';
  const seconds = Math.round(ms / 1000);
  return `${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2, '0')}s`;
};
const instant = (value) => {
  const time = Date.parse(value ?? '');
  return Number.isFinite(time) ? time : NaN;
};
const roundPassed = (round) => round.build === 'pass' && ['pass', 'not_applicable'].includes(round.unit) && round.e2e === 'pass';
const startOrder = (event) => Number.isFinite(event.start) ? event.start : Infinity;

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { return null; }
}

function readText(file) {
  try { return fs.readFileSync(file, 'utf8').replace(ansi, ''); }
  catch { return ''; }
}

function parseLine(line) {
  try { return JSON.parse(line); }
  catch { return null; }
}

function writtenFiles(transcript, out) {
  const files = new Set();
  for (const event of readText(transcript).split('\n').map(parseLine)) {
    const blocks = Array.isArray(event?.message?.content) ? event.message.content : [];
    for (const block of blocks) {
      const file = block?.type === 'tool_use' && writeTools.has(block.name) ? block.input?.file_path ?? block.input?.notebook_path : null;
      if (typeof file !== 'string') continue;
      files.add(file.startsWith(out + path.sep) ? path.relative(out, file) : file.replace(/^.*\/out\/[^/]+\//, ''));
    }
  }
  return [...files].sort((a, b) => Number(b.endsWith('.md')) - Number(a.endsWith('.md')) || a.localeCompare(b));
}

function failedTests(log) {
  const titles = [];
  let collecting = false;
  for (const line of readText(log).split('\n')) {
    if (/^\s+\d+ failed\s*$/.test(line)) {
      collecting = true;
      continue;
    }
    const match = collecting ? line.match(/^\s+\[[^\]]+\] › (.+?) › (.+?)\s*─*\s*$/) : null;
    if (match) titles.push({ title: match[2], location: match[1] });
    else collecting = false;
  }
  return titles;
}

const tail = (file, lines = 8) => readText(file).trim().split('\n').slice(-lines).join('\n');

function roundTimes(logs, round) {
  if (round.started_at && round.finished_at) return [instant(round.started_at), instant(round.finished_at)];
  const modified = ['build', 'unit', 'e2e'].map((gate) => {
    try { return fs.statSync(path.join(logs, `verify-${round.round}.${gate}.log`)).mtimeMs; }
    catch { return NaN; }
  }).filter(Number.isFinite);
  if (!modified.length) return [NaN, NaN];
  return [Math.min(...modified), Math.max(...modified)];
}

function roundFailures(logs, round) {
  const base = path.join(logs, `verify-${round.round}`);
  const failures = [];
  if (round.build === 'fail') failures.push({ gate: 'Type-check + build', detail: tail(`${base}.build.log`) });
  if (round.unit === 'fail') failures.push({ gate: 'Unit tests', detail: tail(`${base}.unit.log`) });
  if (round.e2e === 'fail') {
    const tests = failedTests(`${base}.e2e.log`);
    failures.push({ gate: 'E2E tests', tests, detail: tests.length ? '' : tail(`${base}.e2e.log`) });
  }
  return failures;
}

export function collectRun(outputDirectory) {
  const out = path.resolve(outputDirectory);
  const logs = path.join(out, 'logs');
  const run = readJson(path.join(logs, 'run.json')) ?? {};
  const product = readJson(path.join(out, 'requirements/product.json'));
  let logFiles = [];
  try { logFiles = fs.readdirSync(logs); }
  catch { logFiles = []; }
  const stageNames = [...new Set(logFiles.filter((file) => /\.(allocation|result)\.json$/.test(file))
    .map((file) => file.replace(/\.(allocation|result)\.json$/, '')))];
  const stages = stageNames.map((name) => {
    const result = readJson(path.join(logs, `${name}.result.json`)) ?? {};
    const allocation = readJson(path.join(logs, `${name}.allocation.json`)) ?? {};
    const start = instant(result.started_at ?? allocation.reserved_at);
    const finished = instant(result.finished_at);
    const confirmed = result.outcome !== 'no_result' && result.cost_known !== false && Number.isFinite(result.cost_usd) && result.cost_usd >= 0;
    return {
      kind: 'agent', name, base: name.replace(/-\d+$/, ''), start,
      end: Number.isFinite(finished) ? finished : start + (result.duration_ms ?? NaN),
      model: result.model, outcome: result.outcome ?? 'unfinished', cost: confirmed ? result.cost_usd : NaN,
      budget: allocation.budget_usd, tokens: result.tokens ?? {}, turns: result.num_turns,
      toolErrors: Array.isArray(result.tool_errors) ? result.tool_errors : [],
      summary: result.final_message ?? '', files: writtenFiles(path.join(logs, `${name}.jsonl`), out),
    };
  });
  const rounds = readText(path.join(logs, 'verify-history.jsonl')).split('\n').map(parseLine)
    .filter((round) => typeof round?.round === 'string')
    .map((round) => {
      const [start, end] = roundTimes(logs, round);
      return { ...round, kind: 'verify', name: round.round, start, end, passed: roundPassed(round), failures: roundFailures(logs, round) };
    });
  const events = [...stages, ...rounds].sort((a, b) => startOrder(a) - startOrder(b));
  const incidents = events.flatMap((event, index) => {
    if (event.kind !== 'verify' || event.passed) return [];
    const later = events.slice(index + 1);
    const next = later.find((item) => item.kind === 'verify');
    const repair = later.find((item) => item.kind === 'agent' && item.base === 'fix' && (!next || startOrder(item) <= startOrder(next)));
    return [{ round: event, repair, next }];
  });
  const sum = (values) => {
    const known = values.filter(Number.isFinite);
    return known.length ? known.reduce((total, value) => total + value, 0) : NaN;
  };
  const starts = events.map((event) => event.start).filter(Number.isFinite);
  const ends = events.map((event) => event.end).filter(Number.isFinite);
  return {
    product: product?.name ?? path.basename(out), run, stages, rounds, events, incidents,
    origin: Number.isFinite(instant(run.started_at)) ? instant(run.started_at) : Math.min(...starts),
    finish: Number.isFinite(instant(run.finished_at)) ? instant(run.finished_at) : Math.max(...ends),
    cost: sum(stages.map((stage) => stage.cost)),
    tokens: Object.fromEntries(['input', 'cache_read', 'cache_write', 'output'].map((key) => [key, sum(stages.map((stage) => stage.tokens[key]))])),
  };
}

function renderNote(text) {
  const inline = (line) => escape(line).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`([^`]+)`/g, '<code>$1</code>');
  const blocks = [];
  let items = [];
  const flush = () => {
    if (items.length) blocks.push(`<ul>${items.join('')}</ul>`);
    items = [];
  };
  for (const line of String(text ?? '').split('\n')) {
    if (/^\s*[-*] /.test(line)) items.push(`<li>${inline(line.replace(/^\s*[-*] /, ''))}</li>`);
    else {
      flush();
      if (line.trim()) blocks.push(`<p>${inline(line)}</p>`);
    }
  }
  flush();
  return blocks.join('');
}

function tickStep(totalMinutes) {
  return [1, 2, 5, 10, 15, 30].find((step) => totalMinutes / step <= 8) ?? 60;
}

function renderTimeline(data) {
  const span = data.finish - data.origin;
  if (!Number.isFinite(span) || span <= 0) return '<p class="empty">No timing was recorded for this run.</p>';
  const position = (time) => Math.min(100, Math.max(0, ((time - data.origin) / span) * 100));
  const step = tickStep(span / 60000);
  const ticks = [];
  for (let minute = 0; minute * 60000 <= span; minute += step) {
    ticks.push(`<span class="tick" style="left:${position(data.origin + minute * 60000).toFixed(2)}%">${minute}m</span>`);
  }
  const lanes = data.events.filter((event) => Number.isFinite(event.start) && Number.isFinite(event.end)).map((event) => {
    const tone = event.kind === 'verify' ? (event.passed ? 'pass' : 'fail') : event.base === 'fix' ? 'fix' : 'agent';
    const left = position(event.start);
    const width = Math.max(0.8, position(event.end) - left);
    const value = event.kind === 'verify' ? (event.passed ? 'all gates green' : 'gate failed') : `${clock(event.end - event.start)} · ${money(event.cost)}`;
    const label = event.kind === 'verify' ? `verify ${event.name}` : event.name;
    return `<div class="lane"><span class="lane-label">${escape(label)}</span><div class="track"><span class="bar ${tone}" style="left:${left.toFixed(2)}%;width:${width.toFixed(2)}%" title="${escape(`${label}: ${clock(event.end - event.start)}`)}"></span></div><span class="lane-value">${escape(value)}</span></div>`;
  });
  return `<div class="timeline"><div class="lane axis"><span class="lane-label"></span><div class="track">${ticks.join('')}</div><span class="lane-value"></span></div>${lanes.join('')}</div>
<ul class="legend"><li><span class="swatch agent"></span>Agent stage</li><li><span class="swatch fix"></span>Fix agent</li><li><span class="swatch pass"></span>Verification passed</li><li><span class="swatch fail"></span>Verification failed</li></ul>`;
}

function renderFiles(files) {
  if (!files.length) return '<span class="muted">none</span>';
  const docs = files.filter((file) => /\.(md|json)$/.test(file));
  const code = files.length - docs.length;
  return `${docs.map((file) => `<code>${escape(file)}</code>`).join(' ')}${code ? ` <span class="muted">+${code} code file${code === 1 ? '' : 's'}</span>` : ''}`;
}

function renderStageTable(data) {
  const maxCost = Math.max(...data.stages.map((stage) => stage.cost).filter(Number.isFinite), 0);
  const rows = data.stages.slice().sort((a, b) => startOrder(a) - startOrder(b)).map((stage) => `<tr>
<th scope="row">${escape(stage.name)}<span class="muted block">${escape(stage.model ?? 'model not recorded')}</span></th>
<td class="num">${clock(stage.end - stage.start)}</td>
<td class="num"><span class="cost">${money(stage.cost)}</span><span class="share"><span style="width:${maxCost ? ((Number.isFinite(stage.cost) ? stage.cost : 0) / maxCost * 100).toFixed(1) : 0}%"></span></span></td>
<td class="num">${compact(stage.tokens.input)}</td><td class="num">${compact(stage.tokens.cache_read)}</td><td class="num">${compact(stage.tokens.cache_write)}</td><td class="num">${compact(stage.tokens.output)}</td>
<td class="num">${count(stage.turns)}</td>
<td class="files">${renderFiles(stage.files)}</td>
</tr>`);
  return `<div class="table-wrap"><table>
<thead><tr><th scope="col">Stage</th><th scope="col" class="num">Time</th><th scope="col" class="num">Cost</th><th scope="col" class="num">Input</th><th scope="col" class="num">Cache read</th><th scope="col" class="num">Cache write</th><th scope="col" class="num">Output</th><th scope="col" class="num">Turns</th><th scope="col">Files written</th></tr></thead>
<tbody>${rows.join('')}</tbody>
<tfoot><tr><th scope="row">Total</th><td class="num">${clock(data.finish - data.origin)}</td><td class="num">${money(data.cost)}</td><td class="num">${compact(data.tokens.input)}</td><td class="num">${compact(data.tokens.cache_read)}</td><td class="num">${compact(data.tokens.cache_write)}</td><td class="num">${compact(data.tokens.output)}</td><td class="num">${count(data.stages.reduce((total, stage) => total + (stage.turns ?? 0), 0))}</td><td></td></tr></tfoot>
</table></div>`;
}

function renderFailure(failure) {
  const tests = failure.tests?.length ? `<ul class="tests">${failure.tests.map((test) => `<li>${escape(test.title)} <span class="muted">${escape(test.location)}</span></li>`).join('')}</ul>` : '';
  const detail = failure.detail ? `<pre>${escape(failure.detail)}</pre>` : '';
  return `<p class="gate">${escape(failure.gate)} failed</p>${tests}${detail}`;
}

function renderIncidents(data) {
  if (!data.rounds.length) return '<p class="empty">No verification rounds were recorded for this run.</p>';
  if (!data.incidents.length) return '<p class="empty">Every verification round passed on the first attempt; the fix agent was not needed.</p>';
  return data.incidents.map(({ round, repair, next }) => `<article class="incident">
<div class="step fail"><h3>Round ${escape(round.name)} failed</h3>${round.e2e_counts ? `<p class="muted">E2E: ${escape(round.e2e_counts)}</p>` : ''}${round.failures.map(renderFailure).join('')}</div>
${repair ? `<div class="step fix"><h3>Fix agent <span class="muted">${escape(repair.name)} · ${clock(repair.end - repair.start)} · ${money(repair.cost)}</span></h3><div class="note">${renderNote(repair.summary) || '<p class="muted">The fix agent left no summary.</p>'}</div></div>` : '<div class="step"><p class="muted">No fix agent ran after this round: the fix-round limit or deadline was reached.</p></div>'}
${next ? `<div class="step ${next.passed ? 'pass' : 'fail'}"><h3>Round ${escape(next.name)} ${next.passed ? 'passed' : 'failed again'}</h3>${next.e2e_counts ? `<p class="muted">E2E: ${escape(next.e2e_counts)}</p>` : ''}</div>` : ''}
</article>`).join('');
}

function renderReports(data) {
  return data.stages.slice().sort((a, b) => startOrder(a) - startOrder(b)).map((stage) => `<details class="report">
<summary><span>${escape(stage.name)}</span><span class="muted">${clock(stage.end - stage.start)} · ${money(stage.cost)} · ${stage.files.length} file${stage.files.length === 1 ? '' : 's'} written${stage.toolErrors.length ? ` · ${stage.toolErrors.length} tool error${stage.toolErrors.length === 1 ? '' : 's'}` : ''}</span></summary>
${stage.files.length ? `<ul class="file-list">${stage.files.map((file) => `<li><code>${escape(file)}</code></li>`).join('')}</ul>` : ''}
${stage.toolErrors.length ? `<ul class="tool-errors">${stage.toolErrors.map((error) => `<li><strong>${escape(error.tool)}</strong> ${escape(error.message)}</li>`).join('')}</ul>` : ''}
<div class="note">${renderNote(stage.summary) || '<p class="muted">No final report was recorded.</p>'}</div>
</details>`).join('');
}

export function renderDashboard(data) {
  const budget = data.run.total_budget;
  const spentShare = Number.isFinite(budget) && budget > 0 && Number.isFinite(data.cost) ? Math.min(100, data.cost / budget * 100) : 0;
  const finalRound = data.rounds.at(-1);
  const fixes = data.stages.filter((stage) => stage.base === 'fix').length;
  const outcome = data.run.status ?? 'unfinished';
  const cached = data.tokens.cache_read + data.tokens.cache_write;
  const totalTokens = data.tokens.input + cached + data.tokens.output;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Factory Run Dashboard</title>
<style>
:root{--bg:#f6f5f2;--surface:#fff;--ink:#1b1c1f;--muted:#5d6068;--line:#e3e1dc;--track:#eceae5;--agent:#3b5bdb;--fix:#b7791f;--pass:#2f855a;--fail:#c53030;--radius:10px;color-scheme:light}
@media (prefers-color-scheme:dark){:root{--bg:#141518;--surface:#1d1f23;--ink:#ecebe8;--muted:#a3a6ad;--line:#2d3036;--track:#26292e;--agent:#7b93f0;--fix:#e0b35a;--pass:#5fbf8a;--fail:#ef6b6b;color-scheme:dark}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;font-variant-numeric:tabular-nums}
main{max-width:1200px;margin:0 auto;padding:40px 24px 64px}
h1{font-size:clamp(28px,4vw,40px);line-height:1.1;margin:4px 0 8px;letter-spacing:-.02em;text-wrap:balance}
h2{font-size:20px;margin:0 0 4px}
h3{font-size:16px;margin:0 0 6px}
p{margin:0 0 8px}
code{font:13px/1.4 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;background:var(--track);padding:1px 5px;border-radius:4px;overflow-wrap:anywhere}
pre{font:12px/1.5 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;background:var(--track);padding:10px 12px;border-radius:6px;overflow:auto;white-space:pre-wrap;margin:6px 0 0}
section{margin-top:40px}
.kicker{color:var(--muted);font-size:14px;text-transform:uppercase;letter-spacing:.08em;margin:0}
.muted{color:var(--muted)}
.block{display:block;font-size:13px;font-weight:400;white-space:nowrap}
.lede{color:var(--muted);max-width:70ch;margin-bottom:16px}
.badge{display:inline-block;padding:2px 10px;border-radius:999px;font-weight:600;font-size:14px;text-transform:capitalize;background:var(--track)}
.badge.pass{color:var(--pass)}.badge.fail,.badge.interrupted{color:var(--fail)}
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,170px),1fr));gap:12px;margin-top:24px}
.kpi{background:var(--surface);border:1px solid var(--line);border-radius:var(--radius);padding:16px}
.kpi .label{color:var(--muted);font-size:14px;margin:0}
.kpi .value{font-size:28px;font-weight:700;margin:2px 0;letter-spacing:-.01em}
.kpi .sub{color:var(--muted);font-size:13px;margin:0}
.meter{height:6px;background:var(--track);border-radius:999px;margin-top:10px;overflow:hidden}
.meter span{display:block;height:100%;background:var(--agent)}
.panel{background:var(--surface);border:1px solid var(--line);border-radius:var(--radius);padding:16px}
.timeline{display:grid;gap:6px}
.lane{display:grid;grid-template-columns:150px 1fr 150px;gap:12px;align-items:center}
.lane-label{font-size:14px;font-weight:600;overflow-wrap:anywhere}
.lane-value{font-size:13px;color:var(--muted);text-align:right}
.track{position:relative;height:18px;background:var(--track);border-radius:4px}
.axis .track{background:none;height:16px}
.tick{position:absolute;top:0;font-size:12px;color:var(--muted);transform:translateX(-50%)}
.tick:first-child{transform:none}
.bar{position:absolute;top:2px;bottom:2px;border-radius:3px}
.bar.agent,.swatch.agent{background:var(--agent)}.bar.fix,.swatch.fix{background:var(--fix)}.bar.pass,.swatch.pass{background:var(--pass)}.bar.fail,.swatch.fail{background:var(--fail)}
.legend{display:flex;flex-wrap:wrap;gap:16px;list-style:none;padding:0;margin:14px 0 0;font-size:13px;color:var(--muted)}
.swatch{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:6px;vertical-align:middle}
.table-wrap{overflow-x:auto;background:var(--surface);border:1px solid var(--line);border-radius:var(--radius)}
table{border-collapse:collapse;width:100%;min-width:860px;font-size:14px}
th,td{padding:10px 12px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}
thead th{font-size:13px;color:var(--muted);font-weight:600}
tfoot th,tfoot td{font-weight:700;border-bottom:0}
.num{text-align:right;white-space:nowrap}
.cost{display:block}
.share{display:block;height:4px;background:var(--track);border-radius:999px;margin-top:6px;min-width:60px}
.share span{display:block;height:100%;background:var(--agent);border-radius:999px}
.files code{display:inline-block;margin:0 4px 4px 0}
.incident{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));gap:12px;margin-bottom:16px}
.step{background:var(--surface);border:1px solid var(--line);border-top:4px solid var(--line);border-radius:var(--radius);padding:14px 16px;min-width:0}
.step.fail{border-top-color:var(--fail)}.step.fix{border-top-color:var(--fix)}.step.pass{border-top-color:var(--pass)}
.gate{font-weight:600;margin:8px 0 4px}
.tests{margin:0;padding-left:18px;font-size:14px}
.note{font-size:14px}.note ul{padding-left:18px;margin:0 0 8px}
.report{background:var(--surface);border:1px solid var(--line);border-radius:var(--radius);padding:12px 16px;margin-bottom:8px}
.report summary{cursor:pointer;display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;font-weight:600}
.report summary .muted{font-weight:400;font-size:14px}
.report[open] summary{margin-bottom:10px}
.file-list,.tool-errors{font-size:14px;padding-left:18px}
.empty{color:var(--muted)}
footer{margin-top:48px;color:var(--muted);font-size:14px}
footer a{color:inherit}
@media (max-width:640px){main{padding:24px 16px 48px}.lane{grid-template-columns:96px 1fr;gap:8px}.lane-value{display:none}}
</style>
</head>
<body>
<main>
<header>
<p class="kicker">Agent factory run</p>
<h1>${escape(data.product)}</h1>
<p class="muted">Started ${escape(data.run.started_at ?? 'not recorded')} · <span class="badge ${escape(outcome)}">${escape(outcome)}</span></p>
</header>
<div class="kpis">
<div class="kpi"><p class="label">Spend</p><p class="value">${money(data.cost)}</p><p class="sub">of ${money(budget)} budget</p><div class="meter" role="img" aria-label="${spentShare.toFixed(0)}% of budget used"><span style="width:${spentShare.toFixed(1)}%"></span></div></div>
<div class="kpi"><p class="label">Wall time</p><p class="value">${clock(data.finish - data.origin)}</p><p class="sub">limit ${clock((data.run.max_wall_seconds ?? NaN) * 1000)}</p></div>
<div class="kpi"><p class="label">Tokens</p><p class="value">${compact(totalTokens)}</p><p class="sub">${compact(cached)} cached · ${compact(data.tokens.output)} output</p></div>
<div class="kpi"><p class="label">Agents</p><p class="value">${data.stages.length}</p><p class="sub">${fixes} fix run${fixes === 1 ? '' : 's'} · ${data.rounds.length} verification round${data.rounds.length === 1 ? '' : 's'}</p></div>
<div class="kpi"><p class="label">Final tests</p><p class="value">${finalRound ? (finalRound.passed ? 'Green' : 'Red') : '—'}</p><p class="sub">${escape(finalRound?.e2e_counts || 'no verification recorded')}</p></div>
</div>
<section>
<h2>How the orchestrator ran</h2>
<p class="lede">Each bar is one agent or verification round on the run's clock. Bars that overlap ran in parallel; a red round hands its failure logs to the fix agent and every gate runs again.</p>
<div class="panel">${renderTimeline(data)}</div>
</section>
<section>
<h2>Time, cost and tokens per stage</h2>
<p class="lede">Confirmed provider cost for each agent, with the documents it wrote. Code files are counted; open an agent report below for the full list.</p>
${renderStageTable(data)}
</section>
<section>
<h2>Failures and how they were fixed</h2>
<p class="lede">Failed gates, the failing tests, the fix agent's own explanation and the round that followed.</p>
${renderIncidents(data)}
</section>
<section>
<h2>Agent reports</h2>
<p class="lede">What each agent wrote and reported when it finished.</p>
${renderReports(data)}
</section>
<footer><a href="REPORT.md">REPORT.md</a> has acceptance traceability and quality gates. Transcripts are in <a href="logs/">logs/</a>.</footer>
</main>
</body>
</html>
`;
}

export function generateDashboard(outputDirectory) {
  return renderDashboard(collectRun(outputDirectory));
}

if (process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href) {
  if (!process.argv[2]) {
    console.error('usage: node factory/lib/dashboard.mjs <output-directory>');
    process.exitCode = 1;
  } else {
    const target = path.join(path.resolve(process.argv[2]), 'DASHBOARD.html');
    fs.writeFileSync(target, generateDashboard(process.argv[2]));
    console.log(`Dashboard: ${target}`);
  }
}
