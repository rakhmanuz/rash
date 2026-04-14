#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
OUT="$ROOT/android-twa"
mkdir -p "$OUT"
cd "$OUT"
echo ""
echo "rash.uz TWA — interaktiv Bubblewrap init — $OUT"
echo "Tavsiya: repoda npm run twa:sync-manifest && npm run twa:update && npm run twa:build"
echo "Server .env: ANDROID_TWA_PACKAGE_NAME, ANDROID_TWA_SHA256_CERT_FINGERPRINTS"
echo ""
cd "$ROOT"
exec npx --yes @bubblewrap/cli@latest init --manifest "https://rash.uz/manifest.json" --directory "$OUT"
