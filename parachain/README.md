# Evidex Parachain Network Setup

This guide will help you create and deploy a personalized parachain network for the Evidex evidence platform using Polkadot/Substrate.

## Overview

The Evidex parachain is a specialized blockchain designed for digital evidence anchoring and verification. It includes:

- **Evidence Pallet**: Custom pallet for registering and verifying digital evidence
- **IPFS Integration**: Stores evidence metadata with IPFS CIDs
- **Fee System**: Registration fees for evidence anchoring
- **Admin Controls**: Administrative functions for evidence management
- **Cross-chain Messaging**: XCM support for interoperability

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Relay Chain   │    │ Evidex Para-    │    │   Evidex App    │
│   (Polkadot)    │◄──►│ chain Collator  │◄──►│   (Next.js)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   IPFS Storage  │
                       │   (Pinata)      │
                       └─────────────────┘
```

## Quick Start

### 1. Setup Environment

```bash
# Clone the repository
git clone <your-repo-url>
cd evidex-platform

# Run the setup script
./scripts/setup-parachain.sh
```

### 2. Start Local Network

```bash
# Start the parachain network
docker-compose -f docker-compose.parachain.yml up -d

# Check logs
docker-compose -f docker-compose.parachain.yml logs -f evidex-collator-1
```

### 3. Configure Evidex App

Update your `.env` file:

```env
# Polkadot (custom chain - required)
POLKADOT_WS_URL=ws://localhost:9955
POLKADOT_MNEMONIC="bottom drive obey lake curtain smoke basket hold race lonely fit walk"
POLKADOT_SCAN_API_URL=http://localhost:8080/api/v2/scan/extrinsic
POLKADOT_EXPLORER_BASE_URL=http://localhost:8080/extrinsic/
POLKADOT_REMARK_PREFIX=EVIDEX
POLKADOT_USE_PALLET=true
POLKADOT_PALLET_NAME=evidence
POLKADOT_SUBMIT_EXTRINSIC=submitEvidence
POLKADOT_ENABLE_REMARK_FALLBACK=true
SUBSCAN_API_KEY=your-subscan-api-key
```

### 4. Start Evidex Application

```bash
# Start infrastructure
docker compose up -d postgres redis rabbitmq

# Start the Evidex app
pnpm dev
```

## Network Components

### Relay Chain
- **Purpose**: Security and consensus for parachains
- **Nodes**: Alice (validator), Bob (validator)
- **Port**: 9933 (Alice), 9944 (Bob)

### Evidex Parachain
- **Purpose**: Evidence anchoring and verification
- **Nodes**: Collator 1, Collator 2
- **Port**: 9955 (Collator 1), 9966 (Collator 2)
- **Parachain ID**: 2000

### Subscan Explorer
- **Purpose**: Block explorer and API
- **Port**: 8080
- **Database**: PostgreSQL

## Evidence Pallet Functions

### `submit_evidence(file_hash, ipfs_cid)` / `register_evidence(file_hash, ipfs_cid)`
- **Purpose**: Register new evidence on-chain
- **Fee**: 0.001 EVID tokens
- **Requirements**: 64-char SHA256 hex, valid CID, unique hash

### `verify_evidence(evidence_id)` (Admin only)
- **Purpose**: Mark evidence as verified

### `challenge_evidence(evidence_id, reason)`
- **Purpose**: Move evidence to challenged status
- **Requirements**: owner or admin

### `resolve_challenge(evidence_id, accept)` (Admin only)
- **Purpose**: Resolve challenge and mark `Verified`/`Rejected`
- **Requirements**: Admin privileges

## Development

### Building the Parachain

```bash
cd parachain

# Build native binary
cargo build --release

# Build WebAssembly runtime
cargo build --release --target wasm32-unknown-unknown
```

### Running Tests

```bash
cd parachain

# Run unit tests
cargo test

# Run benchmarks
cargo test --features runtime-benchmarks
```

### Chain Specification

The chain specification is located at `parachain/chainspec/evidex-parachain.json`. Key parameters:

- **SS58 Format**: 42
- **Token Symbol**: EVID
- **Token Decimals**: 12
- **Parachain ID**: 2000

## Deployment

### Local Deployment

```bash
# Start all services
docker-compose -f docker-compose.parachain.yml up -d

# Check service status
docker-compose -f docker-compose.parachain.yml ps
```

### Production Deployment

1. **Build Docker Images**
```bash
docker build -t evidex/parachain:latest ./parachain
```

2. **Configure Environment**
```bash
# Update chainspec for production
# Set proper boot nodes
# Configure validator keys
```

3. **Deploy to Cloud**
```bash
# Use Docker Swarm or Kubernetes
# Configure persistent volumes
# Set up monitoring and logging
```

## Monitoring

### Health Checks

```bash
# Check parachain status
curl -X POST -H "Content-Type: application/json" \
  -d '{"id":1,"jsonrpc":"2.0","method":"system_health","params":[]}' \
  http://localhost:9955/

# Check connected peers
curl -X POST -H "Content-Type: application/json" \
  -d '{"id":1,"jsonrpc":"2.0","method":"system_peers","params":[]}' \
  http://localhost:9955/
```

### Logs

```bash
# View collator logs
docker-compose -f docker-compose.parachain.yml logs -f evidex-collator-1

# View relay chain logs
docker-compose -f docker-compose.parachain.yml logs -f relay-chain-alice
```

## Troubleshooting

### Common Issues

1. **Collator won't start**
   - Check relay chain is running
   - Verify parachain ID configuration
   - Check boot nodes configuration

2. **Evidence registration fails**
   - Verify account has sufficient balance
   - Check IPFS CID format
   - Ensure evidence hash is unique

3. **XCM transfer issues**
   - Verify parachain is registered with relay chain
   - Check HRMP channels are open
   - Validate destination format

### Debug Commands

```bash
# Check parachain block production
curl -X POST -H "Content-Type: application/json" \
  -d '{"id":1,"jsonrpc":"2.0","method":"chain_getBlock","params":["latest"]}' \
  http://localhost:9955/

# Check evidence storage
curl -X POST -H "Content-Type: application/json" \
  -d '{"id":1,"jsonrpc":"2.0","method":"state_getStorage","params":["0x..."]}' \
  http://localhost:9955/
```

## Security Considerations

- **Validator Keys**: Keep secure and offline
- **Admin Keys**: Use multi-sig for production
- **Network Access**: Restrict RPC endpoints
- **Rate Limiting**: Implement on public endpoints
- **Monitoring**: Set up alerts for suspicious activity

## Integration with Evidex App

The parachain integrates with the Evidex application through the Polkadot adapter:

```typescript
// Example integration
const adapter = new PolkadotEvidenceAdapter({
  wsUrl: 'ws://localhost:9955',
  mnemonic: process.env.POLKADOT_MNEMONIC,
  scanApiUrl: 'http://localhost:8080/api/v2/scan/extrinsic',
  explorerBaseUrl: 'http://localhost:8080/extrinsic/',
  remarkPrefix: 'EVIDEX',
  usePallet: true,
  palletName: 'evidence',
  submitExtrinsic: 'submitEvidence',
  enableRemarkFallback: true
});
```

## Next Steps

1. **Custom Runtime**: Add additional pallets as needed
2. **Governance**: Implement DAO features
3. **Cross-chain**: Enable bridging to other networks
4. **Scaling**: Optimize for high throughput
5. **Security**: Audit and penetration testing

## Support

For support and questions:

- Check the [Substrate documentation](https://docs.substrate.io/)
- Review [Polkadot Wiki](https://wiki.polkadot.network/)
- Join the [Evidex Discord](https://discord.gg/evidex)
- Create an issue in the repository
