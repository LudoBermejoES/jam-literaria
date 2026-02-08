# Deployment and Configuration Documentation

## Overview

This document provides comprehensive deployment instructions for Jam Literaria in both development and production environments.

**Production URL**: https://www.ludobermejo.es
**Technology**: Node.js, React, SQLite, PM2, Nginx

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Development Setup](#development-setup)
4. [Production Deployment](#production-deployment)
5. [Nginx Configuration](#nginx-configuration)
6. [SSL/TLS Setup](#ssltls-setup)
7. [Process Management (PM2)](#process-management-pm2)
8. [Database Management](#database-management)
9. [Monitoring and Logging](#monitoring-and-logging)
10. [Backup and Recovery](#backup-and-recovery)
11. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements

**Development**:
- Node.js 22+ (with npm)
- Git
- Any modern OS (macOS, Linux, Windows)

**Production**:
- Ubuntu 20.04+ (or similar Linux distribution)
- Node.js 22+
- Nginx
- PM2
- SSL certificate (Let's Encrypt recommended)

### Installation

```bash
# Install Node.js 22 (Ubuntu)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should be v22.x.x
npm --version

# Install PM2 globally
sudo npm install -g pm2

# Install Nginx
sudo apt-get install -y nginx
```

---

## Environment Configuration

### Environment Variables

The application uses environment-specific configuration files:

**Backend** (`.env` in `server/` directory):

```bash
# Server Configuration
PORT=5000
NODE_ENV=production  # or development

# Client URL (for CORS)
CLIENT_URL=https://www.ludobermejo.es

# Session Secret (CHANGE THIS!)
SESSION_SECRET=your-super-secret-random-string-here-min-32-chars

# Database Path
DATABASE_PATH=../database/jam_literaria.db

# Static File Serving (if nginx not handling)
SERVE_STATIC=false
CLIENT_PATH=/var/www/jam-client
```

**Frontend** (`.env` files in `app/` directory):

**.env.development**:
```bash
VITE_API_URL=http://localhost:5000
VITE_API_BASE=http://localhost:5000/api
```

**.env.production**:
```bash
VITE_API_URL=https://www.ludobermejo.es:5000
VITE_API_BASE=https://www.ludobermejo.es:5000/api
```

### Generating Session Secret

```bash
# Generate strong random secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Development Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd jam-literaria
```

### 2. Install Dependencies

```bash
# Backend dependencies
cd server
npm install

# Frontend dependencies
cd ../app
npm install
```

### 3. Configure Environment

```bash
# Backend
cd server
cp .env.example .env
# Edit .env with your settings

# Frontend (uses .env.development by default)
cd ../app
# .env.development already configured for localhost
```

### 4. Initialize Database

```bash
cd server
npm run reset-db  # Creates fresh database from schema
```

### 5. Start Development Servers

**Terminal 1 - Backend**:
```bash
cd server
npm run dev  # Starts with PM2 in watch mode
```

**Terminal 2 - Frontend**:
```bash
cd app
npm run dev  # Starts Vite dev server on port 5173
```

### 6. Access Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api
- Socket.IO: http://localhost:5000

---

## Production Deployment

### Architecture Overview

```
Internet
   ↓
Nginx (Port 80/443)
   ├─→ Static Files (/var/www/jam-client)
   └─→ Reverse Proxy (Port 5000)
        ↓
   PM2 (Process Manager)
        ↓
   Node.js Server (Express + Socket.IO)
        ↓
   SQLite Database
```

### 1. Prepare Server

```bash
# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Install dependencies
sudo apt-get install -y git nodejs npm nginx certbot python3-certbot-nginx

# Install PM2
sudo npm install -g pm2
```

### 2. Clone and Setup Application

```bash
# Create application directory
sudo mkdir -p /var/www
cd /var/www

# Clone repository
sudo git clone <repository-url> jam-literaria
cd jam-literaria

# Set permissions
sudo chown -R $USER:$USER /var/www/jam-literaria
```

### 3. Build Backend

```bash
cd /var/www/jam-literaria/server

# Install production dependencies
npm install --production

# Configure environment
cp .env.example .env
nano .env  # Edit with production values

# Initialize database
npm run reset-db
```

### 4. Build Frontend

```bash
cd /var/www/jam-literaria/app

# Install dependencies
npm install

# Build for production
npm run build:production
# or: npm run build -- --mode production

# Copy build to web directory
sudo mkdir -p /var/www/jam-client
sudo cp -r dist/* /var/www/jam-client/
```

### 5. Configure PM2

**Create PM2 Ecosystem File**:

```bash
# /var/www/jam-literaria/server/ecosystem.config.cjs
module.exports = {
  apps: [{
    name: 'jam-literaria',
    script: './app.js',
    cwd: '/var/www/jam-literaria/server',
    instances: 1,  // or 'max' for cluster mode
    exec_mode: 'fork',  // or 'cluster'
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: '/var/log/pm2/jam-literaria-error.log',
    out_file: '/var/log/pm2/jam-literaria-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    autorestart: true,
    max_memory_restart: '500M',
    watch: false
  }]
};
```

**Start Application**:

```bash
cd /var/www/jam-literaria/server

# Start with PM2
pm2 start ecosystem.config.cjs

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd
# Run the command PM2 outputs

# Check status
pm2 status
pm2 logs jam-literaria
```

---

## Nginx Configuration

### Main Configuration

**File**: `/etc/nginx/sites-available/jam-literaria`

```nginx
# Upstream for Node.js server
upstream jam_backend {
    server localhost:5000;
    keepalive 64;
}

# HTTP server (redirect to HTTPS)
server {
    listen 80;
    listen [::]:80;
    server_name www.ludobermejo.es ludobermejo.es;

    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Redirect to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name www.ludobermejo.es ludobermejo.es;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/www.ludobermejo.es/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/www.ludobermejo.es/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Static Files (Frontend)
    location / {
        root /var/www/jam-client;
        try_files $uri $uri/ /index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API Proxy (Backend)
    location /api/ {
        proxy_pass http://jam_backend;
        proxy_http_version 1.1;

        # Proxy headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Buffering
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;

        # Disable cache
        proxy_cache_bypass $http_upgrade;
    }

    # Socket.IO WebSocket Proxy
    location /socket.io/ {
        proxy_pass http://jam_backend;
        proxy_http_version 1.1;

        # WebSocket headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket timeouts (longer for persistent connections)
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;

        # Disable buffering for WebSockets
        proxy_buffering off;
    }

    # Logging
    access_log /var/log/nginx/jam-literaria-access.log;
    error_log /var/log/nginx/jam-literaria-error.log;
}
```

### Enable Site

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/jam-literaria /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Check status
sudo systemctl status nginx
```

---

## SSL/TLS Setup

### Let's Encrypt (Certbot)

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Obtain certificate (interactive)
sudo certbot --nginx -d www.ludobermejo.es -d ludobermejo.es

# Or non-interactive
sudo certbot --nginx --non-interactive --agree-tos \
  --email your-email@example.com \
  -d www.ludobermejo.es -d ludobermejo.es

# Test renewal
sudo certbot renew --dry-run

# Auto-renewal is configured via cron/systemd timer automatically
```

### Manual SSL Certificate

If using a custom certificate:

```bash
# Copy certificate files
sudo cp your-cert.crt /etc/ssl/certs/jam-literaria.crt
sudo cp your-key.key /etc/ssl/private/jam-literaria.key

# Update nginx config
ssl_certificate /etc/ssl/certs/jam-literaria.crt;
ssl_certificate_key /etc/ssl/private/jam-literaria.key;
```

---

## Process Management (PM2)

### Common PM2 Commands

```bash
# Start application
pm2 start ecosystem.config.cjs

# Stop application
pm2 stop jam-literaria

# Restart application
pm2 restart jam-literaria

# Reload (zero-downtime restart)
pm2 reload jam-literaria

# Delete from PM2
pm2 delete jam-literaria

# View logs
pm2 logs jam-literaria
pm2 logs jam-literaria --lines 100

# Monitor
pm2 monit

# Status
pm2 status
pm2 info jam-literaria

# Flush logs
pm2 flush
```

### PM2 Cluster Mode

For better performance on multi-core servers:

```javascript
// ecosystem.config.cjs
module.exports = {
  apps: [{
    name: 'jam-literaria',
    script: './app.js',
    instances: 'max',  // Use all CPU cores
    exec_mode: 'cluster',  // Enable cluster mode
    // ... other settings
  }]
};
```

**Note**: Requires Socket.IO Redis adapter for WebSocket synchronization across instances.

### PM2 with Redis (for clustering)

```bash
# Install Redis
sudo apt-get install -y redis-server

# Install Redis adapter
cd /var/www/jam-literaria/server
npm install --save @socket.io/redis-adapter redis
```

```javascript
// server/socket/io.js
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const pubClient = createClient({ url: 'redis://localhost:6379' });
const subClient = pubClient.duplicate();

await pubClient.connect();
await subClient.connect();

io.adapter(createAdapter(pubClient, subClient));
```

---

## Database Management

### Database Location

**Production**: `/var/www/jam-literaria/database/jam_literaria.db`

### Backup Database

```bash
# Manual backup
cp /var/www/jam-literaria/database/jam_literaria.db \
   /var/backups/jam_literaria_$(date +%Y%m%d_%H%M%S).db

# Automated daily backup (crontab)
# Add to crontab: crontab -e
0 2 * * * cp /var/www/jam-literaria/database/jam_literaria.db \
          /var/backups/jam_literaria_$(date +\%Y\%m\%d).db
```

### Restore Database

```bash
# Stop application
pm2 stop jam-literaria

# Restore from backup
cp /var/backups/jam_literaria_20240115.db \
   /var/www/jam-literaria/database/jam_literaria.db

# Start application
pm2 start jam-literaria
```

### Database Migrations

```bash
cd /var/www/jam-literaria/server

# Run migration script
node scripts/migrate-add-required-votes.js

# Reset database (DESTRUCTIVE - dev only!)
npm run reset-db
```

---

## Monitoring and Logging

### Application Logs

**PM2 Logs**:
```bash
# View logs
pm2 logs jam-literaria

# Real-time logs
pm2 logs jam-literaria --lines 0

# Error logs only
pm2 logs jam-literaria --err

# Location
/var/log/pm2/jam-literaria-out.log
/var/log/pm2/jam-literaria-error.log
```

**Nginx Logs**:
```bash
# Access log
tail -f /var/log/nginx/jam-literaria-access.log

# Error log
tail -f /var/log/nginx/jam-literaria-error.log
```

### System Monitoring

**PM2 Monitoring**:
```bash
# Built-in monitoring
pm2 monit

# Web dashboard (PM2 Plus)
pm2 link <secret> <public>  # Register at pm2.io
```

**System Resources**:
```bash
# CPU and memory
htop

# Disk usage
df -h

# Network connections
netstat -tuln | grep 5000
```

### Health Checks

**Create health check endpoint**:

```javascript
// server/app.js
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: Date.now()
  });
});
```

**Monitor with cron**:
```bash
# Add to crontab
*/5 * * * * curl -f http://localhost:5000/health || systemctl restart jam-literaria
```

---

## Backup and Recovery

### Automated Backup Script

```bash
#!/bin/bash
# /usr/local/bin/backup-jam.sh

BACKUP_DIR="/var/backups/jam-literaria"
DB_PATH="/var/www/jam-literaria/database/jam_literaria.db"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
cp $DB_PATH $BACKUP_DIR/db_$DATE.db

# Backup uploaded files (if any)
# tar -czf $BACKUP_DIR/files_$DATE.tar.gz /var/www/jam-uploads

# Keep only last 30 days of backups
find $BACKUP_DIR -name "*.db" -mtime +30 -delete

echo "Backup completed: $DATE"
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/backup-jam.sh

# Add to crontab (daily at 2 AM)
0 2 * * * /usr/local/bin/backup-jam.sh >> /var/log/backup-jam.log 2>&1
```

---

## Deployment Updates

### Zero-Downtime Update Process

```bash
#!/bin/bash
# update-jam.sh

echo "Starting update process..."

# Navigate to project
cd /var/www/jam-literaria

# Backup database
cp database/jam_literaria.db database/jam_literaria_backup_$(date +%Y%m%d).db

# Pull latest code
git pull origin main

# Update backend
cd server
npm install --production

# Build frontend
cd ../app
npm install
npm run build:production

# Update static files
sudo rm -rf /var/www/jam-client/*
sudo cp -r dist/* /var/www/jam-client/

# Reload PM2 (zero-downtime)
pm2 reload jam-literaria

echo "Update completed!"
```

### Rollback Procedure

```bash
# Rollback to previous Git commit
cd /var/www/jam-literaria
git reset --hard HEAD~1

# Restore database
pm2 stop jam-literaria
cp database/jam_literaria_backup_20240115.db database/jam_literaria.db
pm2 start jam-literaria

# Rebuild and redeploy
cd app
npm run build:production
sudo cp -r dist/* /var/www/jam-client/
```

---

## Troubleshooting

### Application Won't Start

**Check PM2 logs**:
```bash
pm2 logs jam-literaria --lines 50
```

**Common issues**:
- Port 5000 already in use: `lsof -i :5000`
- Database file permissions: `ls -la database/`
- Missing environment variables: Check `.env` file

### WebSocket Connection Failed

**Check Nginx config**:
```bash
sudo nginx -t
```

**Verify WebSocket headers**:
```bash
curl -i -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  http://localhost:5000/socket.io/
```

**Common issues**:
- Nginx not proxying upgrade header
- Firewall blocking WebSocket connections
- SSL certificate issues

### High Memory Usage

**Check PM2 metrics**:
```bash
pm2 info jam-literaria
```

**Increase memory limit**:
```javascript
// ecosystem.config.cjs
max_memory_restart: '1G'
```

**Enable cluster mode** to distribute load.

### Database Locked

**SQLite write conflicts**:
```
Error: database is locked
```

**Solutions**:
- Check for long-running transactions
- Increase `busy_timeout` in database.js
- Consider migrating to PostgreSQL for production

---

## Performance Optimization

### Frontend Optimization

**Vite Build**:
```javascript
// vite.config.js
export default {
  build: {
    target: 'es2015',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true  // Remove console.logs in production
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          socket: ['socket.io-client']
        }
      }
    }
  }
};
```

### Backend Optimization

**Node.js flags**:
```javascript
// ecosystem.config.cjs
node_args: '--max-old-space-size=1024'
```

**Database indexes**:
```sql
CREATE INDEX idx_votes_session_round ON votes(session_id, round);
CREATE INDEX idx_ideas_session ON ideas(session_id);
```

### Nginx Caching

```nginx
# Cache zone
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=jam_cache:10m max_size=100m;

# In server block
location /api/ {
    proxy_cache jam_cache;
    proxy_cache_valid 200 1m;
    proxy_cache_bypass $http_cache_control;
}
```

---

## Security Hardening

### Firewall (UFW)

```bash
# Enable firewall
sudo ufw enable

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Deny direct access to Node.js (only via nginx)
sudo ufw deny 5000/tcp

# Check status
sudo ufw status
```

### Fail2ban

```bash
# Install
sudo apt-get install -y fail2ban

# Configure for nginx
sudo nano /etc/fail2ban/jail.local
```

```ini
[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/jam-literaria-error.log

[nginx-limit-req]
enabled = true
port = http,https
logpath = /var/log/nginx/jam-literaria-error.log
```

---

## Continuous Integration/Deployment

### GitHub Actions Example

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '22'

    - name: Build Frontend
      run: |
        cd app
        npm ci
        npm run build:production

    - name: Deploy to Server
      uses: appleboy/scp-action@master
      with:
        host: ${{ secrets.SERVER_HOST }}
        username: ${{ secrets.SERVER_USER }}
        key: ${{ secrets.SERVER_SSH_KEY }}
        source: "app/dist/*"
        target: "/var/www/jam-client"

    - name: Restart PM2
      uses: appleboy/ssh-action@master
      with:
        host: ${{ secrets.SERVER_HOST }}
        username: ${{ secrets.SERVER_USER }}
        key: ${{ secrets.SERVER_SSH_KEY }}
        script: |
          cd /var/www/jam-literaria/server
          git pull
          npm install --production
          pm2 reload jam-literaria
```

---

## Checklist

### Pre-Deployment
- [ ] Environment variables configured
- [ ] Session secret generated (strong random value)
- [ ] Database initialized
- [ ] SSL certificate obtained
- [ ] Firewall configured
- [ ] Backup strategy in place

### Deployment
- [ ] Code pulled from repository
- [ ] Dependencies installed (`npm install --production`)
- [ ] Frontend built (`npm run build:production`)
- [ ] Static files copied to web directory
- [ ] PM2 configured and started
- [ ] Nginx configured and tested
- [ ] SSL working correctly

### Post-Deployment
- [ ] Application accessible via HTTPS
- [ ] WebSockets functioning
- [ ] All features tested (login, sessions, voting)
- [ ] Logs configured and rotating
- [ ] Monitoring set up
- [ ] Backups tested
- [ ] Auto-renewal for SSL configured

---

## Support and Resources

**Documentation**: See other docs in `/docs` folder
**Issues**: GitHub Issues
**Contact**: support@jam-literaria.com
