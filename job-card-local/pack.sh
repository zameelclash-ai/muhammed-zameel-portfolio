#!/bin/bash
# Builds "Optimex Job Cards.zip": a ready-to-run copy for Windows, Mac and Linux (no install step).
# Usage: ./pack.sh [output-directory]    (needs Node.js, npm and zip)
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
OUT="${1:-$HERE/dist}"
WORK="$(mktemp -d)"
APP="$WORK/Optimex Job Cards"
mkdir -p "$APP" "$OUT"
cp -r "$HERE"/{package.json,package-lock.json,server.js,ocr,public,start.bat,start.command,README.md} "$APP/"
cd "$APP"
npm ci --omit=dev --no-audit --no-fund
npm install --no-save --no-audit --no-fund "@img/sharp-wasm32@$(node -p "require('sharp/package.json').version")"
N="$APP/node_modules"
# sharp: use the WebAssembly build on every platform instead of a per-platform binary
find "$N/@img" -mindepth 1 -maxdepth 1 ! -name sharp-wasm32 ! -name colour -exec rm -rf {} +
# onnxruntime-web: Node only loads ort.node.min.* and the plain simd-threaded WebAssembly build
find "$N/onnxruntime-web/dist" -type f ! -name 'ort.node.min.mjs' ! -name 'ort.node.min.js' ! -name 'ort-wasm-simd-threaded.mjs' ! -name 'ort-wasm-simd-threaded.wasm' -delete
# fonts: only the faces the card screen uses
find "$N/@fontsource" -path '*/files/*' -type f ! -name '*-latin-400-normal.woff2' ! -name '*-latin-700-normal.woff2' ! -name '*-latin-700-italic.woff2' -delete
find "$N/@fontsource" -maxdepth 2 -type f \( -name '*.css' -o -name '*.scss' \) -delete
# the text-orientation model and sources are not used
rm -f "$N/@gutenye/ocr-models/assets/ch_ppocr_mobile_v2.0_cls_infer.onnx"
find "$N" -type d -name src -path '*@gutenye*' -prune -exec rm -rf {} +
find "$N" -type d -name src -path '*@techstark*' -prune -exec rm -rf {} +
find "$N" -type f \( -name '*.map' -o -name '*.d.ts' -o -name '*.d.mts' -o -name '*.d.cts' -o -name 'README*' -o -name 'CHANGELOG*' -o -name 'HISTORY*' \) -delete
rm -rf "$N/@types"
cd "$WORK"
rm -f "$OUT/Optimex Job Cards.zip"
zip -qr -9 "$OUT/Optimex Job Cards.zip" "Optimex Job Cards"
rm -rf "$WORK"
echo "Built $OUT/Optimex Job Cards.zip"
