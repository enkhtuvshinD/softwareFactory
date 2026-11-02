#!/usr/bin/env bash
set -euo pipefail

FACTORY="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(dirname "$FACTORY")"

if [[ -f "$ROOT/.env" ]]; then set -a; source "$ROOT/.env"; set +a; fi

for bin in claude node npm jq rsync; do
  command -v "$bin" >/dev/null || { echo "missing required command: $bin"; exit 1; }
done

(cd "$FACTORY/template" && npm install --no-audit --no-fund)
(cd "$FACTORY/template" && npx playwright install chromium)
claude --version

if [[ -z "${ANTHROPIC_API_KEY:-}" ]]; then
  echo "ANTHROPIC_API_KEY is not set (cp .env.example .env and fill it in): agents will bill your logged-in Claude account."
fi
echo "Ready. Run ./factory/run.sh"
