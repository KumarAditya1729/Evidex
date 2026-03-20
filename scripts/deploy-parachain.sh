#!/bin/bash

# Evidex Parachain Deployment Script
# This script deploys the Evidex parachain to a production environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PARACHAIN_ID=${PARACHAIN_ID:-2000}
RELAY_WS_URL=${RELAY_WS_URL:-"wss://rpc.polkadot.io"}
BOOT_NODES=${BOOT_NODES:-""}

echo -e "${YELLOW}🚀 Deploying Evidex Parachain...${NC}"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

# Build Docker images
echo -e "${YELLOW}Building Docker images...${NC}"
docker build -t evidex/parachain:latest ./parachain

# Generate production chainspec
echo -e "${YELLOW}Generating production chain specification...${NC}"
cat > ./parachain/chainspec/evidex-parachain-prod.json << EOF
{
  "name": "Evidex Parachain",
  "id": "evidex",
  "chainType": "Parachain",
  "bootNodes": [${BOOT_NODES}],
  "telemetryEndpoints": [
    "wss://telemetry.polkadot.io/submit/"
  ],
  "protocolId": "evidex-parachain",
  "properties": {
    "ss58Format": 42,
    "tokenDecimals": 12,
    "tokenSymbol": "EVID"
  },
  "genesis": {
    "runtime": {
      "system": {
        "code": "0x3a636f6d706163742d686561702d747261696c6572"
      },
      "balances": {
        "balances": [
          [
            "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
            "1000000000000000000000"
          ]
        ]
      },
      "sudo": {
        "key": "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
      },
      "evidence": {
        "adminKey": "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
        "evidenceRegistry": {},
        "verificationFee": "1000000000000"
      },
      "parachainInfo": {
        "parachainId": ${PARACHAIN_ID}
      },
      "polkadotXcm": {
        "safeXcmVersion": 2
      }
    }
  },
  "parachain": {
    "id": ${PARACHAIN_ID},
    "chainType": "Parachain",
    "relayChain": "polkadot",
    "cumulusBased": true
  }
}
EOF

# Create production docker-compose
echo -e "${YELLOW}Creating production docker-compose...${NC}"
cat > docker-compose.parachain.prod.yml << EOF
version: '3.8'

services:
  evidex-collator-1:
    image: evidex/parachain:latest
    container_name: evidex-collator-1
    ports:
      - "30333:30333"
      - "9933:9933"
      - "4033:4033"
    command: >
      /usr/local/bin/evidex-parachain
      --chain /chainspec/evidex-parachain-prod.json
      --collator
      --validator
      --unsafe-ws-external
      --unsafe-rpc-external
      --rpc-cors all
      --rpc-methods=unsafe
      --prometheus-external
      --relay-chain-rpc-urls ${RELAY_WS_URL}
      --parachain-id ${PARACHAIN_ID}
    volumes:
      - ./parachain/chainspec:/chainspec:ro
      - evidex-data:/data
    restart: unless-stopped
    environment:
      - RUST_LOG=info

  evidex-explorer:
    image: subscan/subscan:latest
    container_name: evidex-explorer
    ports:
      - "8080:8080"
    environment:
      - DATABASE_URL=postgresql://subscan:subscan@postgres:5432/subscan
      - REDIS_URL=redis://redis:6379
      - CHAIN_NAME=evidex
      - CHAIN_WS_URL=ws://evidex-collator-1:9933
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  postgres:
    image: postgres:15
    container_name: evidex-postgres
    environment:
      - POSTGRES_USER=subscan
      - POSTGRES_PASSWORD=subscan
      - POSTGRES_DB=subscan
    volumes:
      - postgres-data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: evidex-redis
    volumes:
      - redis-data:/data
    restart: unless-stopped

volumes:
  evidex-data:
  postgres-data:
  redis-data:

networks:
  default:
    driver: bridge
EOF

# Start production services
echo -e "${YELLOW}Starting production services...${NC}"
docker-compose -f docker-compose.parachain.prod.yml up -d

# Wait for services to be ready
echo -e "${YELLOW}Waiting for services to be ready...${NC}"
sleep 30

# Health check
echo -e "${YELLOW}Performing health check...${NC}"
if curl -s http://localhost:9933/health > /dev/null; then
    echo -e "${GREEN}✓ Parachain is healthy${NC}"
else
    echo -e "${RED}✗ Parachain health check failed${NC}"
    exit 1
fi

if curl -s http://localhost:8080 > /dev/null; then
    echo -e "${GREEN}✓ Explorer is healthy${NC}"
else
    echo -e "${RED}✗ Explorer health check failed${NC}"
    exit 1
fi

echo -e "${GREEN}🎉 Evidex Parachain deployed successfully!${NC}"
echo -e "${YELLOW}Services:${NC}"
echo "- Parachain RPC: http://localhost:9933"
echo "- Explorer: http://localhost:8080"
echo "- Metrics: http://localhost:4033"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Update your .env file with the new RPC URL"
echo "2. Register your parachain with the relay chain"
echo "3. Configure HRMP channels for cross-chain messaging"
