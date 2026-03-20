#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

# Ensure stale Next chunks don't break local dev hot reload.
rm -rf apps/web/.next

# Export root .env values so Next.js app routes and Prisma get runtime vars.
if [ -f ".env" ]; then
  set -a
  # shellcheck disable=SC1091
  source ".env"
  set +a
fi

pnpm --filter @evidex/web dev
