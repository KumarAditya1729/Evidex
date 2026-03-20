#!/bin/bash

# 🔐 EVIDEX Production Secrets Generator
# =====================================

echo "🔐 Generating EVIDEX Production Secrets..."

# Generate JWT Secret (256 bits)
JWT_SECRET=$(openssl rand -hex 32)
echo "JWT_SECRET=$JWT_SECRET"

# Generate Private Key Encryption Key (256 bits)
ENCRYPTION_KEY=$(openssl rand -hex 32)
echo "PRIVATE_KEY_ENCRYPTION_KEY=$ENCRYPTION_KEY"

# Generate Webhook Secret (256 bits)
WEBHOOK_SECRET=$(openssl rand -hex 32)
echo "WEBHOOK_SECRET=$WEBHOOK_SECRET"

# Generate Database Password
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
echo "DATABASE_PASSWORD=$DB_PASSWORD"

echo ""
echo "✅ Secrets generated! Update your .env.production file with these values."
echo ""
echo "⚠️  IMPORTANT: Store these secrets securely in a password manager!"
