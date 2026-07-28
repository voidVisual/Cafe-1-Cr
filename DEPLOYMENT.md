# Cafe-1-Cr — DigitalOcean Deployment Guide

This guide walks you through deploying the full Cafe-1-Cr application stack on a DigitalOcean Droplet from scratch.

## Architecture Overview

```
Internet (Port 80/443)
        │
    [ Nginx ]  ← Single entry point
   /          \
[Frontend]  [Admin Dashboard :3000]
(static)       │
               └── /api/*  → backend :3001
               └── Socket.IO → backend :3001

Frontend /api/* → backend :3001

[PostgreSQL :5432] ← Single unified database (Orders, Menu)
```

---

## Step 1: Provision DigitalOcean Droplet

- **Image:** Ubuntu 22.04 LTS
- **Size:** 4GB RAM / 2 vCPU (~$24/mo) minimum
- **Add SSH key** during creation

---

## Step 2: Initial Server Setup

```bash
# SSH into your droplet
ssh root@YOUR_DROPLET_IP

# Update packages
apt update && apt upgrade -y

# Install Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs

# Install PM2 (process manager)
npm install -g pm2

# Install Nginx
apt install -y nginx

# Install Docker & Docker Compose
curl -fsSL https://get.docker.com | bash -
```

---

## Step 3: Clone the Repository

```bash
cd /root
git clone https://github.com/RudranshCortex/Cafe-1-Cr-v2.git Cafe-1-Cr
cd Cafe-1-Cr
```

---

## Step 4: Configure Environment Variables

```bash
cp .env.example .env
nano .env
```

Fill in:
- `HOST_IP` → Your droplet's public IP (e.g., `64.227.x.x`)
- `POSTGRES_PASSWORD` → A strong password
- `VITE_ADMIN_URL` → `http://YOUR_IP:3000/login`
- `NEXT_PUBLIC_API_URL` → `http://YOUR_IP:3001`

---

## Step 5: Start Infrastructure (Docker)

```bash
# Start PostgreSQL
docker compose -f docker-compose.prod.yml up -d

# Verify:
docker ps
```

---

## Step 6: Build & Run All Services with PM2

```bash
# Install root dependencies
npm install

# ── Backend Monolith ───────────────────────────────────────────────
cd /root/Cafe-1-Cr/services/backend
npm install
npm run build
DATABASE_URL="postgresql://cafe_user:YOUR_PASSWORD@localhost:5432/cafe_db" \
pm2 start dist/main.js --name backend

# ── Admin Dashboard (Next.js) ──────────────────────────────────────
cd /root/Cafe-1-Cr/apps/admin-dashboard
npm install
NEXT_PUBLIC_API_URL="http://localhost:3001" \
npm run build
NEXT_PUBLIC_API_URL="http://localhost:3001" \
pm2 start npm --name admin-dashboard -- start

# ── Frontend (Build static files) ─────────────────────────────────
cd /root/Cafe-1-Cr/frontend
npm install
VITE_ADMIN_URL="http://YOUR_DROPLET_IP:3000/login" \
npm run build

# Copy static build to web root
mkdir -p /var/www/cafe
cp -r dist /var/www/cafe/frontend

# Save PM2 process list so it survives reboots
pm2 save
pm2 startup
# ↑ Run the command it outputs (starts with: sudo env PATH=...)
```

---

## Step 7: Configure Nginx

```bash
# Copy the production Nginx config
cp /root/Cafe-1-Cr/nginx-production.conf /etc/nginx/nginx.conf
cp /root/Cafe-1-Cr/proxy_params /etc/nginx/proxy_params

# Update the root path in nginx.conf to match where you put the frontend
# It should already point to /var/www/cafe/frontend/dist

# Test and restart Nginx
nginx -t
systemctl restart nginx
systemctl enable nginx
```

---

## Step 8: Seed the Database

```bash
cd /root/Cafe-1-Cr/db-seed
node seed.js
```

---

## Step 9: Verify Everything Works

```bash
# Check all PM2 processes are running
pm2 status

# Test each service directly
curl http://localhost:3001/api/admin/orders    # Orders API
curl http://localhost:3001/api/menu            # Menu API
curl http://localhost:3001/api/analytics       # Analytics

# Test via Nginx (public access)
curl http://YOUR_DROPLET_IP/api/menu
curl http://YOUR_DROPLET_IP/api/analytics
```

Open in your browser:
- `http://YOUR_DROPLET_IP` → Cafe storefront
- `http://YOUR_DROPLET_IP:3000` → Admin Dashboard

---

## Step 10: (Optional) Set Up SSL with Let's Encrypt

```bash
apt install -y certbot python3-certbot-nginx

# Replace with your actual domain
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renew
systemctl enable certbot.timer
```

Then update `nginx-production.conf` to uncomment the HTTPS server block.

---

## Firewall Configuration (UFW)

```bash
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw allow 3000  # Admin Dashboard (direct access)
# Block database ports from public access:
ufw deny 5432   # Postgres
ufw enable
```

---

## Updating the Application

```bash
cd /root/Cafe-1-Cr
git pull origin main

# Rebuild backend
cd services/backend && npm run build && pm2 restart backend

# Rebuild frontend
cd /root/Cafe-1-Cr/frontend
npm run build
cp -r dist /var/www/cafe/frontend
```

---

## Service Port Reference

| Service | Port | Purpose |
|---------|------|---------|
| Frontend (Nginx static) | 80 | Public cafe storefront |
| Admin Dashboard (Next.js) | 3000 | Admin UI |
| Backend API (NestJS) | 3001 | Orders, Menu CRUD, Socket.IO |
| PostgreSQL | 5432 | Unified DB (internal only) |
