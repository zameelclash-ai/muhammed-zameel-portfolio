#!/bin/bash
# Mac: double-click to start Optimex Job Cards.
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is not installed. Download the LTS version from https://nodejs.org, install it, then open this file again."
  open https://nodejs.org
  read -r -p "Press Enter to close."
  exit 1
fi
[ -d node_modules ] || npm install --omit=dev --no-audit --no-fund
node server.js
