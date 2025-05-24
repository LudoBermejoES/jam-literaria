#!/bin/bash

# SSL Setup Script for Jam Literaria
# This script sets up SSL certificates using Let's Encrypt (Certbot)

set -e

echo "🔒 Setting up SSL certificates for Jam Literaria..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Please run this script as root (use sudo)"
    exit 1
fi

# Domain configuration
DOMAIN="www.ludobermejo.es"
EMAIL="your-email@example.com"  # Replace with your email

echo "📋 Domain: $DOMAIN"
echo "📧 Email: $EMAIL"

# Install certbot if not already installed
if ! command -v certbot &> /dev/null; then
    echo "📦 Installing Certbot..."
    
    # For Ubuntu/Debian
    if command -v apt-get &> /dev/null; then
        apt-get update
        apt-get install -y certbot python3-certbot-nginx
    
    # For CentOS/RHEL
    elif command -v yum &> /dev/null; then
        yum install -y epel-release
        yum install -y certbot python3-certbot-nginx
    
    # For Amazon Linux
    elif command -v amazon-linux-extras &> /dev/null; then
        amazon-linux-extras install -y epel
        yum install -y certbot python3-certbot-nginx
    
    else
        echo "❌ Unsupported operating system. Please install certbot manually."
        exit 1
    fi
else
    echo "✅ Certbot already installed"
fi

# Stop nginx temporarily for standalone certificate generation
echo "🛑 Stopping nginx temporarily..."
systemctl stop nginx || true

# Obtain SSL certificate
echo "🔐 Obtaining SSL certificate for $DOMAIN..."
certbot certonly \
    --standalone \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    --domains "$DOMAIN" \
    --non-interactive

# Update nginx configuration with correct certificate paths
echo "📝 Updating nginx configuration..."
sed -i "s|/etc/ssl/certs/ludobermejo.es.crt|/etc/letsencrypt/live/$DOMAIN/fullchain.pem|g" /etc/nginx/sites-available/jam-literaria
sed -i "s|/etc/ssl/private/ludobermejo.es.key|/etc/letsencrypt/live/$DOMAIN/privkey.pem|g" /etc/nginx/sites-available/jam-literaria

# Test nginx configuration
echo "🧪 Testing nginx configuration..."
nginx -t

# Start nginx
echo "🚀 Starting nginx..."
systemctl start nginx
systemctl enable nginx

# Set up automatic certificate renewal
echo "🔄 Setting up automatic certificate renewal..."
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet --deploy-hook 'systemctl reload nginx'") | crontab -

# Check certificate status
echo "📋 Certificate status:"
certbot certificates

echo ""
echo "✅ SSL setup completed successfully!"
echo ""
echo "🌐 Your site should now be accessible at: https://$DOMAIN"
echo "🔒 SSL certificate will automatically renew every 3 months"
echo ""
echo "📝 Next steps:"
echo "1. Update your DNS settings to point $DOMAIN to this server"
echo "2. Test the HTTPS connection"
echo "3. Update any hardcoded HTTP URLs in your application"
echo "" 