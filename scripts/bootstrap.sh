#!/usr/bin/env bash
set -euo pipefail

pnpm install
cp -n .env.example .env || true

docker compose up -d postgres redis rabbitmq

pnpm db:generate
pnpm db:migrate
pnpm db:seed

echo "Bootstrap complete. Run: pnpm dev"
