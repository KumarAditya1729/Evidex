#!/bin/bash

# 🔒 SSL Certificate Setup with Let's Encrypt
# ========================================

DOMAIN="your-domain.com"
EMAIL="admin@your-domain.com"

echo "🔒 Setting up SSL certificate for $DOMAIN..."

# Install Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --email $EMAIL --agree-tos --non-interactive

# Setup auto-renewal
sudo crontab -l | { cat; echo "0 12 * * * /usr/bin/certbot renew --quiet"; } | sudo crontab -

echo "✅ SSL certificate installed and auto-renewal configured!"
echo "📍 Certificate location: /etc/letsencrypt/live/$DOMAIN/"
echo "🔄 Auto-renewal: Daily at 12:00 PM"
