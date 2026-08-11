#!/usr/bin/env bash
# После ответа агента: если код сломан — попросить починить.
set -euo pipefail
cd "$(dirname "$0")/../.."

cat >/dev/null || true

export PATH="/Users/mac/.local/node/bin:/usr/local/bin:/opt/homebrew/bin:${PATH:-}"

if ! command -v npm >/dev/null 2>&1; then
  echo '{}'
  exit 0
fi

set +e
out="$(npm run check 2>&1)"
status=$?
set -e

if [[ "$status" -eq 0 ]]; then
  echo '{}'
  exit 0
fi

node -e '
const text = String(process.argv[1] || "").slice(0, 1800);
const msg =
  "npm run check упал после правок. Почини ошибки TypeScript/импортов и снова прогони npm run check.\n\n" +
  text;
process.stdout.write(JSON.stringify({ followup_message: msg }));
' "$out"
exit 0
