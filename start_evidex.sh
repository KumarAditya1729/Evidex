#!/bin/bash

# EVIDEX ORCHESTRATION BOOT SCRIPT
# This script boots the entire multi-chain architecture for local demonstration.

# Color constants
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}"
echo "======================================================"
echo "    ███████╗██╗   ██╗██╗██████╗ ███████╗██╗  ██╗      "
echo "    ██╔════╝██║   ██║██║██╔══██╗██╔════╝╚██╗██╔╝      "
echo "    █████╗  ██║   ██║██║██║  ██║█████╗   ╚███╔╝       "
echo "    ██╔══╝  ╚██╗ ██╔╝██║██║  ██║██╔══╝   ██╔██╗       "
echo "    ███████╗ ╚████╔╝ ██║██████╔╝███████╗██╔╝ ██╗      "
echo "    ╚══════╝  ╚═══╝  ╚═╝╚═════╝ ╚══════╝╚═╝  ╚═╝      "
echo "======================================================"
echo -e "${NC}"
echo "Initiating Evidex Universal Trust Infrastructure..."
echo "Please wait while the services boot in the background."
echo "------------------------------------------------------"

# 1. Kill any existing instances to prevent port collisions
echo -e "${BLUE}[*] Cleaning up orphaned processes...${NC}"
./stop_evidex.sh 2>/dev/null

# Create a logs directory
LOG_DIR="$PWD/.evidex_logs"
mkdir -p "$LOG_DIR"
rm -f "$LOG_DIR"/*.log

# 2. Boot Substrate Parachain (Layer 0)
echo -e "${BLUE}[*] Booting Polkadot/Substrate Parachain (Port 9944)...${NC}"
cd parachain || exit
cargo run --release -- --dev --unsafe-rpc-external --rpc-cors all > "$LOG_DIR/substrate.log" 2>&1 &
SUBSTRATE_PID=$!
cd ..

# Wait a moment for Substrate to initialize
sleep 5

# 3. Boot Ethereum Local Node (Layer 1)
echo -e "${BLUE}[*] Booting Ethereum Hardhat EVM (Port 8545)...${NC}"
cd contracts || exit
npx hardhat node > "$LOG_DIR/ethereum.log" 2>&1 &
ETH_PID=$!
cd ..

# Wait for RPC to be healthy
sleep 3

# 4. Boot Next.js Web Portals (Gateway)
echo -e "${BLUE}[*] Booting Universal Next.js Portals (Port 3000)...${NC}"
cd apps/web || exit
npm run dev > "$LOG_DIR/nextjs.log" 2>&1 &
NEXT_PID=$!
cd ../..

echo "------------------------------------------------------"
echo -e "${GREEN}✅ EVIDEX ARCHITECTURE IS ONLINE${NC}"
echo "------------------------------------------------------"
echo -e "Access the system via the following endpoints:"
echo -e ""
echo -e "${CYAN}▶ Master Landing Page:${NC}   http://localhost:3000"
echo -e "${CYAN}▶ Submit Anchor Portal:${NC}  http://localhost:3000/evidence/submit"
echo -e "${CYAN}▶ Verify Audit Portal:${NC}   http://localhost:3000/evidence/verify"
echo -e "${CYAN}▶ WSS Explorer Feed:${NC}     http://localhost:3000/explorer"
echo -e ""
echo -e "${BLUE}[!] Substrate WSS RPC:${NC}   ws://127.0.0.1:9944"
echo -e "${BLUE}[!] Ethereum HTTP RPC:${NC}   http://127.0.0.1:8545"
echo "------------------------------------------------------"
echo -e "To view live logs in another terminal:"
echo "tail -f .evidex_logs/substrate.log"
echo "tail -f .evidex_logs/ethereum.log"
echo "tail -f .evidex_logs/nextjs.log"
echo ""
echo -e "${RED}To shut down the entire backend, run: ./stop_evidex.sh${NC}"
echo "------------------------------------------------------"
