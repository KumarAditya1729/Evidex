# EVIDEX Multi-Chain Evidence Platform

A revolutionary blockchain-based evidence anchoring platform that enables users to upload digital files and permanently anchor their cryptographic proofs across 80+ blockchain networks.

## 🚀 Features

- **Multi-Chain Support**: Ethereum, Polygon, Bitcoin, Polkadot, and 80+ networks
- **Evidence Type Routing**: Financial documents → Ethereum/Polygon, Legal → Bitcoin/Polkadot
- **IPFS Integration**: Decentralized file storage with Pinata
- **Real-Time Verification**: Cross-chain verification via multiple explorers
- **Admin Dashboard**: Complete system analytics and user management
- **Enterprise Security**: JWT authentication, rate limiting, encryption

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express.js, Prisma ORM
- **Database**: PostgreSQL with Redis caching
- **Blockchain**: Ethers.js, Polkadot.js, Bitcoin.js
- **Infrastructure**: Docker, Docker Compose
- **Storage**: IPFS with Pinata integration

## 🎯 Use Cases

- **Legal**: Tamper-proof evidence for court submissions
- **Financial**: Immutable financial records and audit trails
- **Academic**: Plagiarism prevention and degree verification
- **Business**: Contract timestamping and intellectual property protection

## 🌐 Multi-Chain Architecture

```
Upload → IPFS → [ETHEREUM + POLYGON + POLKADOT + BITCOIN]
                    ↓                    ↓               ↓
          Financial Proof     Backup Proof      Audit Log      Maximum Security
```

## 🔧 Installation & Deployment

```bash
# Clone repository
git clone https://github.com/KumarAditya1729/Evidex.git
cd Evidex

# Start infrastructure
docker-compose -f docker-compose.production.yml up -d postgres redis

# Start application
./scripts/host-evidex.sh
```

## 📊 Current Status

- ✅ **Development**: Complete with all features
- ✅ **Testing**: Admin and user workflows tested
- ✅ **Production**: Ready for deployment
- ✅ **Documentation**: Complete project report and guides
- ✅ **Multi-Chain**: 80+ blockchain networks supported

## 🎓 Academic Project

This is a KIIT School of Computer Engineering project demonstrating:
- Enterprise-grade blockchain application development
- Multi-chain architecture and optimization
- Production-ready deployment practices
- Comprehensive documentation and testing

## 🚀 Getting Started

1. **Access Application**: http://localhost:3000
2. **Admin Login**: Use wallet `0x7014B1Ed9825905Ce8FD0D8744896Eab2C6DB6F3`
3. **User Registration**: Create account with any wallet
4. **Upload Evidence**: Test multi-chain anchoring
5. **Verify Evidence**: Cross-chain verification

---

**🎉 EVIDEX: Universal Multi-Chain Evidence Anchoring Platform**
