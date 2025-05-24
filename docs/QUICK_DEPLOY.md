# 🚀 Quick Deployment Guide

## 1. Server Setup (One-time)

```bash
# On your Ubuntu/Debian server
curl -fsSL https://raw.githubusercontent.com/LudoBermejoES/jam-literaria/main/scripts/setup-production.sh | bash
```

## 2. GitHub Secrets

Add these secrets in **GitHub Repository > Settings > Secrets and variables > Actions**:

- `SSH_HOST` - Your server IP
- `SSH_USERNAME` - Your server username 
- `SSH_KEY` - Your private SSH key (full content)
- `SSH_PORT` - SSH port (usually 22)
- `SESSION_SECRET` - Random secure string

## 3. Deploy

```bash
git push origin main
```

## 4. Check Deployment

```bash
# On server - Check if running
pm2 status

# Check logs
pm2 logs jam-literaria

# Check in browser
http://your-server-ip
```

## 🛠 Common Commands

```bash
# Server management
pm2 restart jam-literaria
pm2 logs jam-literaria
sudo systemctl reload nginx

# Check status
pm2 status
sudo systemctl status nginx
```

## 📁 File Locations

- Frontend: `/var/www/jam-client/`
- Backend: `/var/www/jam-server/`
- Database: `/var/www/database/jam_literaria.db`
- Logs: `pm2 logs jam-literaria`

That's it! Your Jam Literaria is now deployed and auto-updating on every push to main. 