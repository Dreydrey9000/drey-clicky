#!/usr/bin/env bash
# One reproducible pass. Fix code between passes; this never rewrites code or grants permissions.
set -euo pipefail
repo_root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$repo_root"
case "$repo_root" in "$HOME/Desktop/"*|"$HOME/Documents/"*) echo 'Use a checkout outside iCloud.' >&2; exit 1;; esac
mkdir -p .build/gauntlet
report_path=".build/gauntlet/$(date -u +%Y%m%dT%H%M%SZ).txt"
exec > >(tee "$report_path") 2>&1
echo 'Drey Clicky gauntlet: typecheck, lint, source rules, tests, build, MCP handshake'
npm run typecheck
npm run lint -- --quiet
npm run lint:source
npm run check:skills
npm test -w agent -- --maxWorkers=2
npm test -w backend -- --maxWorkers=2
npm run build
node agent/dist/cli.js doctor --json
node scripts/check-drey-clicky.mjs
echo 'PASS: automated gauntlet. Native permission, microphone and live-provider tests are separate.'
