#!/usr/bin/env bash
set -euo pipefail

if [[ ! -f .env ]]; then
  echo ".env file not found. Copy .env.example to .env and configure values first."
  exit 1
fi

echo "Compiling contracts..."
pnpm --filter @evidex/contracts compile

echo "Deploying EvidenceRegistry to Polygon Amoy..."
pnpm --filter @evidex/contracts deploy:polygon

echo "Deployment finished. Update EVIDENCE_REGISTRY_POLYGON_ADDRESS in .env with the deployed address."
