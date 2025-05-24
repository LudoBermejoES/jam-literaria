#!/bin/bash

# Jam Literaria Production Server Setup Script
# Run this script on your production server to prepare it for deployment

set -e

echo "🚀 Setting up Jam Literaria production environment..."

# Update system packages
echo "📦 Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install Node.js 18.x
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Install Nginx
echo "📦 Installing Nginx..."
sudo apt-get install -y nginx

# Create application directories
echo "📁 Creating application directories..."
sudo mkdir -p /var/www/jam-client
sudo mkdir -p /var/www/jam-server
sudo mkdir -p /var/www/database

# Set proper ownership
echo "🔐 Setting proper ownership..."
sudo chown -R $USER:$USER /var/www/jam-client
sudo chown -R $USER:$USER /var/www/jam-server
sudo chown -R $USER:$USER /var/www/database

# Install SQLite (if not already installed)
echo "📦 Installing SQLite..."
sudo apt-get install -y sqlite3

# Setup firewall (allow SSH, HTTP, HTTPS)
echo "🔥 Configuring firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# Enable Nginx
echo "🌐 Enabling Nginx..."
sudo systemctl enable nginx
sudo systemctl start nginx

# Setup PM2 startup
echo "🔄 Setting up PM2 startup..."
pm2 startup systemd -u $USER --hp /home/$USER
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp /home/$USER

# Create basic Nginx configuration
echo "🌐 Creating basic Nginx configuration..."
sudo tee /etc/nginx/sites-available/default > /dev/null <<EOF
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    root /var/www/jam-client;
    index index.html index.htm;

    server_name _;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Reload Nginx
sudo nginx -t
sudo systemctl reload nginx

echo "✅ Production environment setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Set up GitHub Secrets in your repository:"
echo "   - SSH_HOST: Your server's IP address"
echo "   - SSH_USERNAME: Your server's username"
echo "   - SSH_KEY: Your private SSH key"
echo "   - SSH_PORT: SSH port (usually 22)"
echo "   - SESSION_SECRET: A secure random string for sessions"
echo ""
echo "2. Update the server_name in Nginx config with your actual domain"
echo "3. Consider setting up SSL with Let's Encrypt:"
echo "   sudo apt-get install certbot python3-certbot-nginx"
echo "   sudo certbot --nginx -d yourdomain.com"
echo ""
echo "4. Push to main branch to trigger deployment!"
echo ""
echo "🎉 Your server is ready for Jam Literaria deployment!" 