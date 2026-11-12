#!/usr/bin/env bash
# Guardrail: fail if raw hex colors appear outside the palette token file.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ALLOWLIST="$ROOT/constants/tokens/palette.ts"

matches=$(grep -RInE '#[0-9A-Fa-f]{3,8}\b' \
  "$ROOT/app" "$ROOT/components" \
  --include='*.tsx' --include='*.ts' \
  | grep -v "$ALLOWLIST" || true)

if [ -n "$matches" ]; then
  echo "Design token violation: raw hex found outside constants/tokens/palette.ts"
  echo "$matches"
  exit 1
fi

echo "OK: no raw hex outside palette token file."
