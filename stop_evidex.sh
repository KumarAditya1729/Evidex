#!/bin/bash

# EVIDEX ORCHESTRATION TEARDOWN SCRIPT

echo "Shutting down Evidex Architecture..."

# Kill Node.js processes (Next.js, Hardhat) running on our specific ports
echo "[-] Terminating Next.js (Port 3000)..."
lsof -ti:3000 | xargs kill -9 2>/dev/null

echo "[-] Terminating Ethereum Node (Port 8545)..."
lsof -ti:8545 | xargs kill -9 2>/dev/null

# Kill Substrate node running on its WSS port
echo "[-] Terminating Substrate Parachain (Port 9944)..."
lsof -ti:9944 | xargs kill -9 2>/dev/null
lsof -ti:9933 | xargs kill -9 2>/dev/null

# Backup catch-all for cargo and hardhat
pkill -f "cargo run" 2>/dev/null
pkill -f "hardhat node" 2>/dev/null
pkill -f "next dev" 2>/dev/null

echo "✅ All Evidex background processes have been securely terminated."
