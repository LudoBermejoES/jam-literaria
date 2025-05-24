# 🚀 Jam Literaria Deployment Guide

This guide explains how to deploy Jam Literaria to a production server using GitHub Actions and automated deployment.

## 📋 Prerequisites

- Ubuntu/Debian server with root or sudo access
- Node.js 18+ (will be installed by setup script)
- GitHub repository with Actions enabled
- Domain name (optional but recommended)

## 🛠 Server Setup

### 1. Initial Server Preparation

Run this command on your production server to set up the environment:

```bash
# Download and run the setup script
curl -fsSL https://raw.githubusercontent.com/LudoBermejoES/jam-literaria/main/scripts/setup-production.sh | bash
```

Or manually:

```bash
# Clone the repository temporarily to get the setup script
git clone https://github.com/LudoBermejoES/jam-literaria.git
cd jam-literaria
chmod +x scripts/setup-production.sh
./scripts/setup-production.sh
```

This script will:
- Install Node.js 18.x
- Install PM2 process manager
- Install and configure Nginx
- Create application directories
- Set up firewall rules
- Configure basic reverse proxy

### 2. GitHub Secrets Configuration

In your GitHub repository, go to **Settings > Secrets and variables > Actions** and add these secrets:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `SSH_HOST` | Your server's IP address | `192.168.1.100` |
| `SSH_USERNAME` | Your server's username | `ubuntu` |
| `SSH_KEY` | Your private SSH key (entire content) | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `SSH_PORT` | SSH port (usually 22) | `22` |
| `SESSION_SECRET` | Secure random string for sessions | `your-super-secure-secret-here` |

#### Generating SSH Key Pair

If you don't have an SSH key pair:

```bash
# On your local machine
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"

# Copy public key to server
ssh-copy-id username@your-server-ip

# Copy private key content for GitHub secret
cat ~/.ssh/id_rsa
```

## 🚀 Deployment Process

### Automatic Deployment

The deployment is triggered automatically when you push to the `main` branch:

```bash
git add .
git commit -m "Deploy to production"
git push origin main
```

### Manual Deployment

You can also trigger deployment manually from GitHub Actions tab in your repository.

## 📁 Server Directory Structure

After deployment, your server will have this structure:

```
/var/www/
├── jam-client/          # React frontend (built)
│   ├── index.html
│   ├── assets/
│   └── ...
├── jam-server/          # Node.js backend
│   ├── app.js
│   ├── package.json
│   ├── node_modules/
│   ├── .env
│   └── ...
└── database/            # SQLite database
    └── jam_literaria.db
```

## 🌐 Nginx Configuration

The deployment automatically configures Nginx with:

- Frontend served at `/`
- API endpoints at `/api/*`
- WebSocket connections at `/socket.io/*`
- Static asset caching
- Proper proxy headers

### Custom Domain Setup

1. Point your domain to your server's IP address
2. Update Nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/jam-literaria
# Change 'server_name _;' to 'server_name yourdomain.com;'
sudo nginx -t
sudo systemctl reload nginx
```

3. Set up SSL with Let's Encrypt:

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## 🔧 Process Management

The application runs under PM2 process manager:

```bash
# Check application status
pm2 status

# View logs
pm2 logs jam-literaria

# Restart application
pm2 restart jam-literaria

# Stop application
pm2 stop jam-literaria

# View detailed info
pm2 show jam-literaria
```

## 📊 Monitoring and Logs

### Application Logs

```bash
# Real-time logs
pm2 logs jam-literaria --lines 100

# Error logs only
pm2 logs jam-literaria --err

# Output logs only
pm2 logs jam-literaria --out
```

### Nginx Logs

```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log
```

### System Monitoring

```bash
# Check disk space
df -h

# Check memory usage
free -h

# Check running processes
htop
```

## 🛡 Security Considerations

### Firewall

The setup script configures UFW with these rules:
- SSH access (port 22)
- HTTP access (port 80)
- HTTPS access (port 443)

### SSL/TLS

For production, always use HTTPS:

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal test
sudo certbot renew --dry-run
```

### Environment Variables

Ensure your `.env` file contains secure values:

```bash
# On server
cd /var/www/jam-server
nano .env
```

Update:
- `SESSION_SECRET` with a strong random string
- `ALLOWED_ORIGINS` with your actual domain
- Other security-related settings

## 🔄 Updating the Application

Updates are deployed automatically when you push to main branch. The deployment process:

1. Builds the React frontend
2. Creates deployment archives
3. Uploads to server via SCP
4. Extracts and installs dependencies
5. Restarts the application with PM2
6. Updates Nginx configuration if needed

## 🐛 Troubleshooting

### Common Issues

#### Application Won't Start

```bash
# Check PM2 status
pm2 status

# Check application logs
pm2 logs jam-literaria

# Check if port is in use
sudo lsof -i :3001

# Restart application
pm2 restart jam-literaria
```

#### Database Issues

```bash
# Check database file permissions
ls -la /var/www/database/

# Check database integrity
sqlite3 /var/www/database/jam_literaria.db ".schema"

# Reset database (CAUTION: destroys all data)
cd /var/www/jam-server
npm run reset-db
```

#### Nginx Issues

```bash
# Test Nginx configuration
sudo nginx -t

# Check Nginx status
sudo systemctl status nginx

# Restart Nginx
sudo systemctl restart nginx

# Check if Nginx is listening
sudo netstat -tlnp | grep nginx
```

#### Permission Issues

```bash
# Fix ownership
sudo chown -R $USER:$USER /var/www/jam-client
sudo chown -R $USER:$USER /var/www/jam-server
sudo chown -R $USER:$USER /var/www/database

# Fix permissions
chmod -R 755 /var/www/jam-client
chmod -R 755 /var/www/jam-server
chmod -R 755 /var/www/database
```

## 📞 Support

If you encounter issues:

1. Check the application logs: `pm2 logs jam-literaria`
2. Check the Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Verify the GitHub Actions deployment logs
4. Ensure all secrets are properly configured
5. Check server resources: `htop`, `df -h`

## 🎯 Performance Optimization

### PM2 Clustering

For better performance with multiple CPU cores:

```bash
# Stop current instance
pm2 stop jam-literaria

# Start with cluster mode
pm2 start app.js --name "jam-literaria" -i max

# Save configuration
pm2 save
```

### Database Optimization

For high-traffic scenarios:
- Consider moving to PostgreSQL
- Implement database connection pooling
- Add database backups

### Caching

- Enable Nginx caching for static assets
- Implement Redis for session storage
- Use CDN for static asset delivery

## 🔄 Backup Strategy

### Database Backups

```bash
# Create daily backup script
#!/bin/bash
DATE=$(date +%Y-%m-%d_%H-%M-%S)
cp /var/www/database/jam_literaria.db /var/www/database/backups/jam_literaria_$DATE.db

# Add to crontab for daily backups
crontab -e
# Add: 0 2 * * * /path/to/backup-script.sh
```

### Application Backups

The entire application can be restored from the GitHub repository, but consider backing up:
- Database files
- Custom configuration files
- SSL certificates
- Nginx configurations

## 🚀 Ready to Deploy!

Your deployment pipeline is now ready. Simply push to the main branch and watch your application deploy automatically!

```bash
git add .
git commit -m "🚀 Initial deployment setup"
git push origin main
```

Visit your server's IP address or domain to see Jam Literaria in action! 