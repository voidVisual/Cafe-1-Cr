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
               ├── /api/menu     → admin-gateway   :3002
               ├── /api/admin    → admin-gateway   :3002
               └── Socket.IO     → admin-gateway   :3002

Frontend /api/* → order-service :3001
                → admin-gateway :3002

[Postgres :5432] ← Orders, Payments
[MongoDB :27017] ← Menu Items
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
- `NEXT_PUBLIC_GATEWAY_URL` → `http://YOUR_IP:3002`

---

## Step 5: Start Infrastructure (Docker)

```bash
# Start Postgres, MongoDB
docker compose -f docker-compose.prod.yml up -d

# Verify:
docker ps
```

---

## Step 6: Build & Run All Services with PM2

```bash
# Install root dependencies
npm install

# ── Order Service ──────────────────────────────────────────────────
cd /root/Cafe-1-Cr/services/order-service
npm install
npm run build
DATABASE_URL="postgresql://cafe_user:YOUR_PASSWORD@localhost:5432/cafe_db" \
pm2 start dist/main.js --name order-service


# ── Admin Gateway ──────────────────────────────────────────────────
cd /root/Cafe-1-Cr/services/admin-gateway
npm install
npm run build
MONGODB_URI="mongodb://localhost:27017/cafe_db" \
ORDER_SERVICE_HOST="localhost" \
pm2 start dist/main.js --name admin-gateway

# ── Admin Dashboard (Next.js) ──────────────────────────────────────
cd /root/Cafe-1-Cr/apps/admin-dashboard
npm install
ADMIN_GATEWAY_URL="http://localhost:3002" \
ORDER_SERVICE_URL="http://localhost:3001" \
npm run build
ADMIN_GATEWAY_URL="http://localhost:3002" \
ORDER_SERVICE_URL="http://localhost:3001" \
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
curl http://localhost:3001/api/admin/orders    # Order service
curl http://localhost:3002/api/menu            # Admin gateway (menu)
curl http://localhost:3004/api/analytics       # Analytics

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
ufw allow 3002  # Admin Gateway WebSocket (Socket.IO)
# Block database ports from public access:
ufw deny 5432   # Postgres
ufw deny 27017  # MongoDB
ufw deny 9092   # Kafka
ufw enable
```

---

## Updating the Application

```bash
cd /root/Cafe-1-Cr
git pull origin main

# Rebuild services as needed
cd services/order-service && npm run build && pm2 restart order-service
cd ../admin-gateway && npm run build && pm2 restart admin-gateway
# ... etc

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
| Order Service (NestJS) | 3001 | Orders, payments |
| Admin Gateway (NestJS) | 3002 | Menu CRUD, orders proxy, Socket.IO |
| PostgreSQL | 5432 | Orders DB (internal only) |
| MongoDB | 27017 | Menu DB (internal only) |
