# 🚀 EVIDEX PRODUCTION HOSTING & DEPLOYMENT GUIDE
# ===================================

## 📋 HOSTING OPTIONS

### 🌟 **Option 1: Vercel (Recommended for Start)**
- **Free tier** available
- **Automatic deployments**
- **Global CDN**
- **SSL certificates**
- **Easy setup**

### 🏢 **Option 2: AWS/Google Cloud (Enterprise)**
- **Full control**
- **Scalable infrastructure**
- **Custom configuration**
- **Higher cost**

### 🐳 **Option 3: DigitalOcean/Vultr (Balanced)**
- **Affordable pricing**
- **Good performance**
- **Developer-friendly**
- **Moderate setup complexity**

---

## 🚀 **VERCEL DEPLOYMENT (QUICK START)**

### Step 1: Install Vercel CLI
```bash
npm i -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Deploy Project
```bash
cd /Users/adityashrivastava/Desktop/BLOCKCHAIN
vercel --prod
```

### Step 4: Configure Environment Variables
Go to Vercel Dashboard → Project Settings → Environment Variables and add:

```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
JWT_SECRET=your-super-secure-jwt-secret-key-256-bits-long-random-string
DATABASE_URL=your-production-database-url
REDIS_URL=your-production-redis-url
PINATA_JWT=your-production-pinata-jwt
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID
ETHEREUM_PRIVATE_KEY=your-production-ethereum-private-key
POLYGON_RPC_URL=https://polygon-rpc.com
POLYGON_PRIVATE_KEY=your-production-polygon-private-key
BITCOIN_RPC_URL=https://blockstream.info/api
BITCOIN_WIF=your-production-bitcoin-wif
POLKADOT_WS_URL=wss://rpc.polkadot.io
POLKADOT_MNEMONIC="your production polkadot mnemonic"
ADMIN_WALLET_ADDRESS=0x7014B1Ed9825905Ce8FD0D8744896Eab2C6DB6F3
```

---

## 🏢 **AWS DEPLOYMENT (ENTERPRISE)**

### Step 1: Create AWS Account
1. Go to https://aws.amazon.com
2. Create account (free tier available)
3. Set up billing

### Step 2: Launch EC2 Instance
```bash
# Using AWS CLI
aws ec2 run-instances \
  --image-id ami-0c02fb55956c7d316 \
  --instance-type t3.micro \
  --key-name your-key-pair \
  --security-group-ids sg-xxxxxxxxx \
  --subnet-id subnet-xxxxxxxxx \
  --user-data file://setup-script.sh
```

### Step 3: Setup Script (save as setup-script.sh)
```bash
#!/bin/bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Docker
sudo apt-get install -y docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker

# Install PM2
sudo npm install -g pm2

# Clone your project
git clone https://github.com/your-username/evidex.git /home/ubuntu/evidex
cd /home/ubuntu/evidex

# Install dependencies
npm install
npm run build

# Start with PM2
pm2 start npm --name "evidex" -- start
pm2 save
pm2 startup
```

### Step 4: Configure Domain
1. Go to Route 53 in AWS Console
2. Create hosted zone
3. Add A record pointing to EC2 instance
4. Configure SSL certificate with AWS Certificate Manager

---

## 🐳 **DOCKER DEPLOYMENT (PORTABLE)**

### Step 1: Create Production Dockerfile
```dockerfile
# apps/web/Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

### Step 2: Create Docker Compose
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    restart: unless-stopped
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: evidex
      POSTGRES_USER: evidex_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### Step 3: Deploy with Docker
```bash
# Build and start
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Scale if needed
docker-compose -f docker-compose.prod.yml up -d --scale app=3
```

---

## 🌐 **DOMAIN & SSL SETUP**

### Step 1: Buy Domain
- GoDaddy, Namecheap, or Google Domains
- Purchase your domain (e.g., evidex.com)

### Step 2: Configure DNS
```bash
# A Record
@ -> YOUR_SERVER_IP

# CNAME Record
www -> evidex.com

# Optional: Subdomains
api -> YOUR_SERVER_IP
admin -> YOUR_SERVER_IP
```

### Step 3: Setup SSL Certificate
```bash
# Using Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d evidex.com -d www.evidex.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 📊 **DATABASE SETUP**

### Option 1: PostgreSQL on Server
```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE evidex;
CREATE USER evidex_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE evidex TO evidex_user;
\q
```

### Option 2: Cloud Database (Recommended)
- **AWS RDS**: https://aws.amazon.com/rds/
- **Google Cloud SQL**: https://cloud.google.com/sql
- **Neon**: https://neon.tech (PostgreSQL, free tier)
- **Supabase**: https://supabase.com (PostgreSQL, free tier)

### Option 3: Managed Database Services
```bash
# Example: Neon Database Setup
DATABASE_URL=postgresql://user:password@epoxy-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require
```

---

## 🔒 **SECURITY CONFIGURATION**

### Step 1: Firewall Setup
```bash
# UFW Firewall
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw deny 3000  # Don't expose Node.js directly
```

### Step 2: Nginx Reverse Proxy
```nginx
# /etc/nginx/sites-available/evidex
server {
    listen 80;
    server_name evidex.com www.evidex.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name evidex.com www.evidex.com;

    ssl_certificate /etc/letsencrypt/live/evidex.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/evidex.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Step 3: Environment Security
```bash
# Secure .env file
chmod 600 .env
chown $USER:$USER .env

# Backup .env
cp .env .env.backup.$(date +%Y%m%d)

# Add to .gitignore
echo ".env" >> .gitignore
echo ".env.*" >> .gitignore
```

---

## 📈 **MONITORING & LOGGING**

### Step 1: Setup Monitoring
```bash
# Install PM2 monitoring
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30

# Monitor application
pm2 monit
```

### Step 2: Health Check Endpoint
```bash
# Add to your app
curl https://evidex.com/api/health
```

### Step 3: Error Tracking (Optional)
```bash
# Sentry for error tracking
npm install @sentry/nextjs
# Add to next.config.js
```

---

## 🚀 **DEPLOYMENT COMMANDS**

### Quick Deploy (Vercel)
```bash
vercel --prod
```

### Full Deploy (Docker)
```bash
# Build and deploy
docker-compose -f docker-compose.prod.yml up -d --build

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f app
```

### Update Deploy
```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build
```

---

## 📋 **PRODUCTION CHECKLIST**

### Pre-Deployment ✅
- [ ] Environment variables configured
- [ ] Database created and accessible
- [ ] SSL certificates obtained
- [ ] Domain DNS configured
- [ ] Firewall rules set
- [ ] Backup procedures in place
- [ ] Monitoring configured
- [ ] Error tracking setup

### Post-Deployment ✅
- [ ] Application accessible via HTTPS
- [ ] All pages loading correctly
- [ ] Database connections working
- [ ] Blockchain connections functional
- [ ] User registration/login working
- [ ] Evidence upload/verify working
- [ ] Admin dashboard accessible
- [ ] Analytics showing data

---

## 🆘 **TROUBLESHOOTING**

### Common Issues
1. **Port already in use**: Kill existing processes
2. **Database connection failed**: Check credentials and network
3. **SSL certificate errors**: Verify certificate paths
4. **Environment variables not loading**: Check file permissions
5. **Build failures**: Check Node.js version and dependencies

### Recovery Commands
```bash
# Restart services
pm2 restart all
docker-compose restart

# Check logs
pm2 logs
docker-compose logs

# Clear cache
npm run build
rm -rf .next
npm run build
```

---

## 🎯 **RECOMMENDED HOSTING PROVIDERS**

### For Beginners
1. **Vercel** - Easiest, free tier available
2. **Netlify** - Simple static hosting
3. **GitHub Pages** - Free for static sites

### For Production
1. **DigitalOcean** - $5/month start, good performance
2. **Vultr** - $6/month start, developer-friendly
3. **Linode** - $5/month start, reliable

### For Enterprise
1. **AWS** - Scalable, feature-rich
2. **Google Cloud** - Modern infrastructure
3. **Microsoft Azure** - Enterprise features

---

## 🎉 **NEXT STEPS**

1. **Choose hosting provider** based on your needs
2. **Setup domain and SSL** 
3. **Configure database** (Neon/Supabase recommended)
4. **Deploy application** using preferred method
5. **Test all functionality**
6. **Setup monitoring and backups**
7. **Launch to users!**

---

**🚀 Your Evidex platform is ready for production deployment! Choose the hosting option that best fits your needs and budget.**
