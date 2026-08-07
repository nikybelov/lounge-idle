#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIR="$ROOT/.tools/omniroute"
PORT="${OMNIROUTE_PORT:-20128}"

if [[ ! -d "$DIR/node_modules/omniroute" ]]; then
  echo "OmniRoute not installed. Run: npm install --prefix \"$DIR\""
  exit 1
fi

export PATH="${HOME}/.local/node/bin:${PATH}"
cd "$DIR"
echo "Starting OmniRoute on http://127.0.0.1:${PORT}"
exec npx omniroute --port "$PORT"
