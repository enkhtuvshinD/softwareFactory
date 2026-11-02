#!/usr/bin/env bash
set -o pipefail

FACTORY="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(dirname "$FACTORY")"

if [[ -f "$ROOT/.env" ]]; then set -a; source "$ROOT/.env"; set +a; fi

INPUT="${INPUT:-$ROOT/input}"
PROJECTS="$ROOT/out"

TOTAL_BUDGET="${TOTAL_BUDGET:-14}"
MAX_WALL_SECONDS="${MAX_WALL_SECONDS:-3600}"
MAX_FIX_ROUNDS="${MAX_FIX_ROUNDS:-3}"
EFFORT="${EFFORT:-medium}"
REQ_MODEL="${REQ_MODEL:-sonnet}"
REQ_BUDGET="${REQ_BUDGET:-1}"
REVIEW_MODEL="${REVIEW_MODEL:-sonnet}"
REVIEW_BUDGET="${REVIEW_BUDGET:-0.75}"
DESIGN_MODEL="${DESIGN_MODEL:-sonnet}"
DESIGN_BUDGET="${DESIGN_BUDGET:-1}"
BUILD_MODEL="${BUILD_MODEL:-sonnet}"
BUILD_BUDGET="${BUILD_BUDGET:-5.5}"
TESTS_MODEL="${TESTS_MODEL:-sonnet}"
TESTS_BUDGET="${TESTS_BUDGET:-1.5}"
FIX_MODEL="${FIX_MODEL:-sonnet}"
FIX_BUDGET="${FIX_BUDGET:-1.5}"
POLISH_MODEL="${POLISH_MODEL:-sonnet}"
POLISH_BUDGET="${POLISH_BUDGET:-1}"
VISUAL_MODEL="${VISUAL_MODEL:-sonnet}"
VISUAL_BUDGET="${VISUAL_BUDGET:-0.75}"

DOC_TOOLS=(Read Write Edit Glob Grep)
APP_TOOLS=(Read Write Edit Glob Grep
  "Bash(npm run build)" "Bash(npx vitest *)" "Bash(npx playwright test)" "Bash(npx playwright test *)"
  "Bash(npx tsc *)" "Bash(ls *)" "Bash(mkdir *)")

FROM=1
if [[ "$1" == "--from" ]]; then FROM="${2:?usage: run.sh [--from 1|2|3|4]}"; fi
[[ "$FROM" =~ ^[1-4]$ ]] || { echo 'usage: run.sh [--from 1|2|3|4]'; exit 1; }

use_output() {
  OUT=$1
  LOGS="$OUT/logs"
  APP="$OUT/app"
  export FACTORY_PROCESS_DIR="$LOGS/processes"
}

NAME_FROM_PRODUCT=no
if [[ -n "${OUT:-}" ]]; then
  use_output "$OUT"
elif (( FROM > 1 )); then
  resume_target="$PROJECTS/${PROJECT:-latest}"
  [[ -d "$resume_target" ]] || { echo "no project to resume at $resume_target (set PROJECT=<folder in out/>)"; exit 1; }
  use_output "$(cd "$resume_target" && pwd -P)"
else
  use_output "$PROJECTS/run-$(date +%Y%m%d-%H%M%S)"
  NAME_FROM_PRODUCT=yes
fi

shopt -s nullglob

clock() { printf '%02d:%02d' $((SECONDS / 60)) $((SECONDS % 60)); }
say() { printf '\033[1m[%s] ▸ %s\033[0m\n' "$(clock)" "$*"; }
warn() { printf '\033[33m[%s] ! %s\033[0m\n' "$(clock)" "$*"; }
prompt() { cat "$FACTORY/prompts/$1.md"; }
skills() {
  local name
  for name in "$@"; do
    printf '\n\n## Project skill: %s\n\nBase directory: %s\n\n' "$name" "$ROOT/.claude/skills/$name"
    cat "$ROOT/.claude/skills/$name/SKILL.md"
  done
}

limited() { node "$FACTORY/lib/limit.mjs" "$DEADLINE_MS" "$@"; }
gate() { node "$FACTORY/lib/gates.mjs" "$1" "$OUT"; }

agent() {
  local stage=$1 model=$2 want=$3 dir=$4 text=$5
  shift 5
  local name budget reservation included
  included=$(printf '%s\n' "$text" | sed -n 's/^## Project skill: //p' | paste -sd, -)
  [[ $(node -e 'console.log(Date.now() < Number(process.argv[1]) ? "yes" : "no")' "$DEADLINE_MS") == yes ]] || {
    warn "$stage skipped: run deadline reached"
    return 1
  }
  reservation=$(node "$FACTORY/lib/control.mjs" reserve "$LOGS" "$stage" "$want" "$TOTAL_BUDGET") || return 1
  IFS=$'\t' read -r name budget <<< "$reservation"
  say "$name · $model · budget \$$budget"
  printf '%s' "$text" \
    | (cd "$dir" && env -u CLAUDECODE -u CLAUDE_EFFORT -u CLAUDE_CODE_SESSION_ID -u CLAUDE_CODE_CHILD_SESSION \
        FACTORY_STAGE="$stage" FACTORY_RUN_DATE="$RUN_DATE" \
        node "$FACTORY/lib/limit.mjs" "$DEADLINE_MS" claude -p \
          --model "$model" \
          --effort "$EFFORT" \
          --max-budget-usd "$budget" \
          --setting-sources project \
          --permission-mode dontAsk \
          --add-dir "$OUT" \
          --add-dir "$ROOT/.claude/skills" \
          --append-system-prompt "$SYSTEM_PROMPT" \
          --no-session-persistence \
          --output-format stream-json --verbose \
          --allowedTools "$@") \
    | node "$FACTORY/lib/stream.mjs" "$name" "$LOGS/$name" "$dir" "$included"
}

has() {
  local file
  for file in "$@"; do [[ -s "$OUT/$file" ]] || return 1; done
}

run_requirements() { agent requirements "$REQ_MODEL" "$REQ_BUDGET" "$OUT" "$(prompt 01-requirements; skills express-api product-scope demo-data-quality)" "${DOC_TOOLS[@]}"; }
gate_requirements() {
  has requirements/requirements.md requirements/product.json requirements/seed.json requirements/acceptance.json && gate acceptance
}

run_review() { agent review "$REVIEW_MODEL" "$REVIEW_BUDGET" "$OUT" "$(prompt 01-review; skills domain-invariants demo-data-quality product-scope)" "${DOC_TOOLS[@]}"; }
gate_review() { gate review; }

run_design() { agent design "$DESIGN_MODEL" "$DESIGN_BUDGET" "$OUT" "$(prompt 02-design; skills e2e-contract frontend-design ux-writing)" "${DOC_TOOLS[@]}"; }
gate_design() {
  gate design
}

run_build() { agent build "$BUILD_MODEL" "$BUILD_BUDGET" "$APP" "$(prompt 03-build; skills e2e-contract express-api domain-invariants vercel-react-best-practices)" "${APP_TOOLS[@]}"; }

run_tests() { agent tests "$TESTS_MODEL" "$TESTS_BUDGET" "$APP" "$(prompt 04-tests; skills e2e-contract)" "${DOC_TOOLS[@]}"; }
gate_tests() {
  gate tests
}

step() {
  "run_$1" && "gate_$1" && return 0
  warn "$1 gate failed, retrying once"
  "run_$1" && "gate_$1"
}

prepare_app() {
  rm -rf "$APP"
  mkdir -p "$APP"
  rsync -a --exclude node_modules --exclude dist --exclude test-results --exclude playwright-report \
    --exclude server/data/db.json "$FACTORY/template/" "$APP/"
  cp -Rc "$FACTORY/template/node_modules" "$APP/" 2>/dev/null ||
    { rm -rf "$APP/node_modules"; cp -R "$FACTORY/template/node_modules" "$APP/"; }
  cp "$OUT/requirements/seed.json" "$APP/server/data/seed.json"
  cp "$OUT/design/tokens.css" "$APP/src/styles/tokens.css"
}

unit_test_mode() {
  node - "$OUT/requirements/product.json" "$APP" <<'NODE'
const fs = require('node:fs');
const path = require('node:path');
const [file, app] = process.argv.slice(2);
const product = JSON.parse(fs.readFileSync(file, 'utf8'));
const hasTests = (directory) => fs.existsSync(directory) && fs.readdirSync(directory, { withFileTypes: true }).some((entry) =>
  entry.isDirectory() ? hasTests(path.join(directory, entry.name)) : /\.test\.tsx?$/.test(entry.name));
// Existing tests always run, even when a static brief declares no unit logic.
console.log(product.unit_tests_required === false && !['src', 'server', 'shared'].some((dir) => hasTests(path.join(app, dir))) ? 'not_applicable' : 'required');
NODE
}

verify() {
  local base="$LOGS/verify-$1" build=fail unit=skipped e2e=skipped unit_mode e2e_counts=''
  FAILED_LOGS=()
  # A failed build must not leave previous green test results in the final report.
  rm -f "$APP/test-results/results.json" "$OUT/quality/evidence.json" "$OUT/quality/visual-review.json"
  rm -rf "$APP/visual-evidence"
  say "verify $1: type-check + build"
  if (cd "$APP" && limited npm run build) >"$base.build.log" 2>&1; then
    build=pass
    say "verify $1: unit tests"
    if ! unit_mode=$(unit_test_mode 2>"$base.unit.log"); then
      unit=fail
      FAILED_LOGS+=("$base.unit.log")
    elif [[ "$unit_mode" == required ]]; then
      if (cd "$APP" && limited npx vitest run) >"$base.unit.log" 2>&1; then unit=pass; else unit=fail; FAILED_LOGS+=("$base.unit.log"); fi
    else
      unit=not_applicable
      jq -r '.unit_test_reason' "$OUT/requirements/product.json" >"$base.unit.log"
    fi
    say "verify $1: e2e tests"
    if (cd "$APP" && limited npx playwright test) >"$base.e2e.log" 2>&1 && gate results >>"$base.e2e.log" 2>&1; then
      e2e=pass
    else
      e2e=fail
      FAILED_LOGS+=("$base.e2e.log")
    fi
    grep -E '^ +[0-9]+ (passed|failed|flaky|skipped|did not run)' "$base.e2e.log"
    e2e_counts=$(grep -E '^ +[0-9]+ (passed|failed|flaky|skipped|did not run)' "$base.e2e.log" |
      sed -e 's/^ *//' -e 's/ (.*)$//' | paste -sd ',' - | sed 's/,/, /g')
  else
    FAILED_LOGS+=("$base.build.log")
  fi
  jq -n --arg round "$1" --arg build "$build" --arg unit "$unit" --arg e2e "$e2e" \
    '{round: $round, build: $build, unit: $unit, e2e: $e2e}' >"$LOGS/verify.json"
  jq -c --arg counts "$e2e_counts" '. + {e2e_counts: $counts}' "$LOGS/verify.json" >>"$LOGS/verify-history.jsonl"
  say "verify $1: build=$build unit=$unit e2e=$e2e"
  [[ $build == pass && ( $unit == pass || $unit == not_applicable ) && $e2e == pass ]]
}

failure_context() {
  local log
  printf '\n\n## Verification round %s failed\n' "$1"
  for log in "${FAILED_LOGS[@]}"; do
    printf '\n### %s\n\n```\n' "$(basename "$log")"
    tail -n 200 "$log" | cut -c1-400
    printf '```\n'
  done
}

verify_and_fix() {
  local phase=$1 round=0
  until verify "$phase-$round"; do
    if (( round >= MAX_FIX_ROUNDS )); then
      warn "still failing after $MAX_FIX_ROUNDS fix rounds"
      return 1
    fi
    agent fix "$FIX_MODEL" "$FIX_BUDGET" "$APP" "$(prompt 05-fix; failure_context "$phase-$round"; if [[ " ${FAILED_LOGS[*]} " == *.e2e.log\ * ]]; then skills playwright-debug; fi)" "${APP_TOOLS[@]}" || return 1
    round=$((round + 1))
  done
  say "all gates green"
}

start_fresh() {
  if [[ -d "$OUT" ]]; then
    mkdir -p "$ROOT/.runs"
    mv "$OUT" "$ROOT/.runs/out-$(date +%Y%m%d-%H%M%S)"
  fi
  mkdir -p "$LOGS"
  point_latest
  cp -R "$INPUT" "$OUT/input" || return 1
  # A plain-text brief is sufficient; no domain-specific seed schema is required.
  [[ -f "$OUT/input/seed.json" ]] || printf '{}\n' >"$OUT/input/seed.json"
  jq -n --arg t "$(date -u +%FT%TZ)" --arg d "${RUN_DATE:-$(date -u +%F)}" \
    --argjson b "$TOTAL_BUDGET" --argjson seconds "$MAX_WALL_SECONDS" \
    '{started_at: $t, total_budget: $b, run_date: $d, max_wall_seconds: $seconds, resume_count: 0}' >"$LOGS/run.json"
}

point_latest() {
  [[ $NAME_FROM_PRODUCT == yes ]] || return 0
  ln -sfn "$(basename "$OUT")" "$PROJECTS/latest"
}

product_slug() {
  node - "$OUT/requirements/product.json" <<'NODE'
const fs = require('node:fs');
const [file] = process.argv.slice(2);
const { name } = JSON.parse(fs.readFileSync(file, 'utf8'));
const ascii = (typeof name === 'string' ? name : '').normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase();
console.log(ascii.replace(/[^a-z0-9]+/g, '-').slice(0, 40).replace(/^-+|-+$/g, ''));
NODE
}

name_project() {
  [[ $NAME_FROM_PRODUCT == yes ]] || return 0
  local slug target suffix=2
  slug=$(product_slug) || return 1
  [[ -n "$slug" ]] || return 0
  target="$PROJECTS/$slug"
  while [[ -e "$target" || -L "$target" ]]; do
    target="$PROJECTS/$slug-$suffix"
    suffix=$((suffix + 1))
  done
  mv "$OUT" "$target" || return 1
  use_output "$target"
  point_latest
  say "project folder: $OUT"
}

initialize_run() {
  node - "$LOGS/run.json" "$MAX_WALL_SECONDS" "$FROM" <<'NODE'
const fs = require('node:fs');
const [file, secondsText, from] = process.argv.slice(2);
const run = JSON.parse(fs.readFileSync(file, 'utf8'));
const seconds = run.max_wall_seconds ?? Number(secondsText);
if (!Number.isFinite(seconds) || seconds <= 0) throw new Error('MAX_WALL_SECONDS must be positive');
if (!Number.isFinite(run.total_budget) || run.total_budget <= 0) throw new Error('TOTAL_BUDGET must be positive');
run.max_wall_seconds = seconds;
run.run_date ??= run.started_at.slice(0, 10);
run.deadline_at ??= new Date(Date.parse(run.started_at) + seconds * 1000).toISOString();
if (!/^\d{4}-\d{2}-\d{2}$/.test(run.run_date) || !Number.isFinite(Date.parse(run.deadline_at))) throw new Error('Invalid run date/deadline');
if (from !== '1') {
  run.resume_count = (run.resume_count ?? 0) + 1;
  run.last_resumed_at = new Date().toISOString();
  delete run.finished_at;
}
fs.writeFileSync(file, JSON.stringify(run, null, 2));
NODE
}

finish() {
  [[ -f "$LOGS/run.json" ]] || echo '{}' >"$LOGS/run.json"
  jq --arg t "$(date -u +%FT%TZ)" --argjson code "$1" \
    '.finished_at = $t | .status = (if $code == 0 then "pass" elif $code == 130 then "interrupted" else "fail" end)' \
    "$LOGS/run.json" >"$LOGS/run.json.tmp" &&
    mv "$LOGS/run.json.tmp" "$LOGS/run.json"
  node "$FACTORY/lib/report.mjs" "$OUT" || true
  exit "$1"
}

abort() {
  warn "$1"
  finish 1
}

cleanup_processes() {
  local file pid
  for file in "$LOGS"/processes/*.pid; do
    pid=$(cat "$file" 2>/dev/null)
    [[ "$pid" =~ ^[0-9]+$ ]] && kill -TERM "$pid" 2>/dev/null
  done
  # limit.mjs forwards TERM and force-kills descendants after 500ms.
  if compgen -G "$LOGS/processes/*.pid" >/dev/null; then sleep 1; fi
  return 0
}

interrupted() {
  trap - INT TERM
  cleanup_processes
  finish 130
}

for bin in claude jq node rsync; do
  command -v "$bin" >/dev/null || { echo "missing required command: $bin"; exit 1; }
done
[[ -d "$FACTORY/template/node_modules" ]] || { echo "run factory/setup.sh first"; exit 1; }
SOURCE_INPUT="$INPUT"
if (( FROM > 1 )); then SOURCE_INPUT="$OUT/input"; fi
[[ -s "$SOURCE_INPUT/brief.md" ]] || { echo "input/brief.md must contain a product brief"; exit 1; }
if [[ -f "$SOURCE_INPUT/seed.json" ]]; then
  jq -e 'type == "object" or type == "array"' "$SOURCE_INPUT/seed.json" >/dev/null || { echo 'optional input/seed.json must be a JSON object or array'; exit 1; }
fi

LOCK="$ROOT/.factory.lock"
if ! mkdir "$LOCK" 2>/dev/null; then
  holder=$(cat "$LOCK/pid" 2>/dev/null)
  if [[ -n "$holder" ]] && kill -0 "$holder" 2>/dev/null; then
    echo "another factory run is active (pid $holder); wait for it or stop it first"
    exit 1
  fi
  rm -rf "$LOCK"
  mkdir "$LOCK"
fi
echo $$ >"$LOCK/pid"
trap 'cleanup_processes; rm -rf "$LOCK"' EXIT

if (( FROM <= 1 )); then start_fresh || abort 'input snapshot failed'; else mkdir -p "$LOGS"; fi
[[ -f "$LOGS/run.json" ]] || { echo 'Cannot resume without logs/run.json'; exit 1; }
initialize_run || abort 'invalid run metadata'
TOTAL_BUDGET=$(jq -r .total_budget "$LOGS/run.json")
RUN_DATE=$(jq -r .run_date "$LOGS/run.json")
DEADLINE_MS=$(node -e 'console.log(Date.parse(process.argv[1]))' "$(jq -r .deadline_at "$LOGS/run.json")")
export FACTORY_RUN_DATE="$RUN_DATE"
trap interrupted INT TERM
SYSTEM_PROMPT="$(prompt system)

Project skills directory: $ROOT/.claude/skills
Declared RUN_DATE: $RUN_DATE (UTC calendar date, persisted across resume).
Deadline: $(jq -r .deadline_at "$LOGS/run.json"). Derive examples and demo data from this run date."
SYSTEM_PROMPT=${SYSTEM_PROMPT//'<project skills directory>'/$ROOT/.claude/skills}
[[ $(node -e 'console.log(Date.now() < Number(process.argv[1]) ? "yes" : "no")' "$DEADLINE_MS") == yes ]] || abort 'original run deadline has expired; start a fresh run'
say "Factory run · budget \$$TOTAL_BUDGET · output $OUT"

if (( FROM <= 1 )); then
  step requirements || abort "requirements gate failed"
  name_project || abort 'naming the project folder failed'
fi
if (( FROM <= 2 )); then step review || abort "requirements review failed"; else gate review || abort 'approved requirements required to resume'; fi
if (( FROM <= 2 )); then step design || abort "design gate failed"; fi
gate_design || abort 'valid design and visual evidence plan required'
if (( FROM <= 3 )); then
  prepare_app || abort 'app preparation failed'
  run_build &
  build_pid=$!
  run_tests &
  tests_pid=$!
  wait "$build_pid"
  wait "$tests_pid"
  gate_tests || step tests || abort "tests gate failed"
fi
mkdir -p "$OUT/quality"
rm -f "$OUT/quality/visual-review.json" "$OUT/quality/evidence.json"
verify_and_fix functional || abort 'functional verification failed'
agent polish "$POLISH_MODEL" "$POLISH_BUDGET" "$APP" "$(prompt 06-polish; skills a11y-visual-check frontend-design ux-writing)" "${APP_TOOLS[@]}" || abort 'visual polish incomplete'
has quality/polish.md || abort 'visual polish record missing'
verify_and_fix final || abort 'final verification failed'
step_visual() {
  agent visual "$VISUAL_MODEL" "$VISUAL_BUDGET" "$OUT" "$(prompt 07-visual-review; skills a11y-visual-check)" "${DOC_TOOLS[@]}" && gate visual
}
step_visual || abort 'final visual review failed; see quality/visual-review.json'
finish 0
