# HTTPS Setup Guide for Jam Literaria

This guide explains how to configure Jam Literaria to run securely over HTTPS in production.

## Overview

Our HTTPS setup uses **nginx as a reverse proxy** to handle SSL termination, which is the recommended approach for Node.js applications. The architecture looks like this:

```
Internet → nginx (HTTPS/SSL) → Node.js Server (HTTP on localhost:5000)
```

## Quick Setup

### 1. Deploy the Application

First, deploy your application normally using the GitHub Actions workflow. This will set up the basic infrastructure.

### 2. Set Up SSL Certificates

SSH into your server and run the SSL setup script:

```bash
sudo /var/www/jam-server/scripts/setup-ssl.sh
```

**Important**: Before running this script, make sure to:
- Edit the script to replace `your-email@example.com` with your actual email address
- Ensure your domain `www.ludobermejo.es` is pointing to your server's IP address

### 3. Verify HTTPS Setup

After the script completes, verify that HTTPS is working:

```bash
# Check certificate status
sudo certbot certificates

# Test nginx configuration
sudo nginx -t

# Check if site is accessible
curl -I https://www.ludobermejo.es
```

## Manual Setup (Alternative)

If you prefer to set up SSL manually:

### 1. Install Certbot

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# CentOS/RHEL
sudo yum install epel-release
sudo yum install certbot python3-certbot-nginx
```

### 2. Obtain SSL Certificate

```bash
sudo certbot certonly --standalone -d www.ludobermejo.es
```

### 3. Configure Nginx

Copy the HTTPS nginx configuration:

```bash
sudo cp /var/www/jam-server/scripts/nginx-https.conf /etc/nginx/sites-available/jam-literaria
sudo ln -sf /etc/nginx/sites-available/jam-literaria /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

## Configuration Details

### Server Changes for HTTPS

The Node.js server has been configured to work behind an HTTPS proxy:

1. **Trust Proxy**: `app.set('trust proxy', 1)` enables Express to trust nginx headers
2. **Secure Cookies**: Session cookies are marked as secure in production
3. **CORS Configuration**: Updated to handle HTTPS origins
4. **Static File Serving**: Disabled when nginx handles static files

### Nginx Configuration Features

Our nginx configuration includes:

- **HTTP to HTTPS Redirect**: All HTTP traffic is redirected to HTTPS
- **Security Headers**: HSTS, X-Frame-Options, X-Content-Type-Options, etc.
- **SSL Optimization**: Modern TLS protocols and ciphers
- **CORS Headers**: Proper CORS configuration for API endpoints
- **Caching**: Optimized caching for static assets
- **WebSocket Support**: Proper proxying for Socket.IO connections

### Environment Variables

The following environment variables are set for HTTPS support:

```bash
NODE_ENV=production
CLIENT_URL=https://www.ludobermejo.es
TRUST_PROXY=1
SERVE_STATIC=false  # nginx serves static files
```

## Certificate Renewal

SSL certificates are automatically renewed using a cron job:

```bash
# Check current cron jobs
crontab -l

# Manual renewal test
sudo certbot renew --dry-run
```

The certificate will automatically renew every 3 months.

## Troubleshooting

### Common Issues

1. **Certificate Not Found Error**
   ```bash
   # Check if certificates exist
   sudo ls -la /etc/letsencrypt/live/www.ludobermejo.es/
   
   # Re-run the SSL setup
   sudo /var/www/jam-server/scripts/setup-ssl.sh
   ```

2. **CORS Errors in Browser**
   - Ensure `CLIENT_URL` is set to `https://www.ludobermejo.es`
   - Check that nginx CORS headers are configured correctly

3. **Socket.IO Connection Issues**
   - Verify WebSocket proxying is configured in nginx
   - Check that the client connects to the HTTPS endpoint

4. **Mixed Content Warnings**
   - Ensure all resources are loaded over HTTPS
   - Update any hardcoded HTTP URLs in your application

### Debug Commands

```bash
# Check nginx status and configuration
sudo nginx -t
sudo systemctl status nginx

# Check SSL certificate
openssl s_client -connect www.ludobermejo.es:443 -servername www.ludobermejo.es

# Check application logs
sudo journalctl -u nginx -f
pm2 logs jam-literaria

# Test API endpoints
curl -k https://www.ludobermejo.es/api/sessions
```

## Security Considerations

1. **Strong SSL Configuration**: We use TLS 1.2+ with secure ciphers
2. **Security Headers**: Multiple security headers are set by nginx
3. **HSTS**: HTTP Strict Transport Security prevents downgrade attacks
4. **Secure Cookies**: Session cookies are marked as secure and httpOnly
5. **Regular Updates**: Keep certbot and nginx updated

## Performance Optimization

1. **HTTP/2**: Enabled for better performance
2. **SSL Session Caching**: Configured for faster handshakes
3. **Static Asset Caching**: Long-term caching for static files
4. **Gzip Compression**: Enabled in nginx (add if needed)

## Monitoring

Consider setting up monitoring for:
- SSL certificate expiration
- HTTPS response times
- Security header compliance
- Certificate transparency logs

## Next Steps

After HTTPS is set up:

1. **Update DNS**: Ensure your domain points to the server
2. **Update Application URLs**: Change any hardcoded HTTP URLs to HTTPS
3. **Test All Features**: Verify authentication, Socket.IO, and API calls work
4. **Set Up Monitoring**: Monitor SSL certificate health and renewal
5. **Consider CDN**: Use a CDN like Cloudflare for additional performance and security 