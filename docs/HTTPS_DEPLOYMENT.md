# HTTPS Deployment Guide - Jam Literaria

## Changes Made for HTTPS Support

Your nginx configuration has been updated to support the Jam Literaria application with HTTPS on `jam.ludobermejo.es`.

### ✅ What's Been Updated

1. **Nginx Configuration** (`example.nginx`)
   - Added API proxying to `localhost:5000`
   - Added Socket.IO WebSocket support
   - Added security headers (HSTS, X-Frame-Options, etc.)
   - Added CORS headers for API endpoints
   - Added caching for static assets
   - Changed frontend location to serve SPA with fallback

2. **Frontend Environment** (`app/.env.production`)
   - Updated to use `https://jam.ludobermejo.es`
   - Removed port number (handled by nginx)

3. **Server Configuration** (`server/app.js` & `server/.env.production`)
   - Updated CORS to allow `jam.ludobermejo.es`
   - Set to not serve static files (nginx handles them)
   - Configured for HTTPS proxy environment

## 🚀 Deployment Steps

### 1. Apply the Configuration

SSH into your server and apply the updated nginx configuration:

```bash
# Backup current config
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup

# Copy the new configuration (you'll need to upload the updated example.nginx file)
sudo cp /path/to/your/updated/example.nginx /etc/nginx/sites-available/default

# Test the configuration
sudo nginx -t

# If test passes, reload nginx
sudo systemctl reload nginx
```

### 2. Deploy the Application

Push your changes to trigger the GitHub Actions deployment, or manually deploy:

```bash
# If deploying manually, ensure you're in the /var/www/jam-server directory
cd /var/www/jam-server

# Create the production environment file
cat > .env << EOF
NODE_ENV=production
PORT=5000
SESSION_SECRET=your-session-secret-here
DATABASE_PATH=../database/jam_literaria.db
CLIENT_PATH=/var/www/jam-client
CLIENT_URL=https://jam.ludobermejo.es
SERVE_STATIC=false
EOF

# Restart your Node.js application
pm2 restart jam-literaria
# or if not using PM2:
# npm start
```

### 3. Verify the Setup

Test that everything is working:

```bash
# Test nginx configuration
sudo nginx -t

# Check if the API is accessible
curl -I https://jam.ludobermejo.es/api/

# Check frontend
curl -I https://jam.ludobermejo.es/

# Check PM2 status
pm2 status
```

## 🔧 Key Configuration Features

### Security Headers
- **HSTS**: Forces HTTPS for 1 year
- **X-Frame-Options**: Prevents clickjacking
- **X-Content-Type-Options**: Prevents MIME sniffing
- **X-XSS-Protection**: XSS protection
- **Referrer-Policy**: Controls referrer information

### API Proxying
- All `/api/*` requests are proxied to `localhost:5000`
- Proper headers for reverse proxy setup
- CORS headers for cross-origin requests

### WebSocket Support
- `/socket.io/*` requests proxied for real-time features
- Upgrade headers for WebSocket connections
- Long timeout for persistent connections

### Static Asset Optimization
- 1-year cache for static assets (JS, CSS, images)
- SPA fallback (`try_files $uri $uri/ /index.html`)

## 🐛 Troubleshooting

### Common Issues

1. **502 Bad Gateway**
   - Check if Node.js server is running on port 5000
   - Verify the server can be reached: `curl http://localhost:5000/api/`

2. **CORS Errors**
   - Ensure `CLIENT_URL=https://jam.ludobermejo.es` in server `.env`
   - Check nginx CORS headers in the configuration

3. **Socket.IO Connection Issues**
   - Verify WebSocket proxying in nginx
   - Check that client connects to `https://jam.ludobermejo.es`

4. **Static Files Not Loading**
   - Ensure files are in `/var/www/jam-client`
   - Check file permissions: `ls -la /var/www/jam-client`

### Debug Commands

```bash
# Check nginx error logs
sudo tail -f /var/log/nginx/error.log

# Check Node.js application logs
pm2 logs jam-literaria

# Test API directly
curl -v https://jam.ludobermejo.es/api/sessions

# Test WebSocket connection
curl -v -H "Connection: Upgrade" -H "Upgrade: websocket" https://jam.ludobermejo.es/socket.io/
```

## 📝 Next Steps

After deployment:

1. **Test All Features**
   - User authentication
   - Session creation/joining
   - Real-time Socket.IO features
   - API endpoints

2. **Monitor Performance**
   - Check response times
   - Monitor SSL certificate status
   - Verify security headers are present

3. **Set Up Monitoring** (Optional)
   - SSL certificate expiration alerts
   - Application uptime monitoring
   - Log monitoring for errors

Your Jam Literaria application is now configured for secure HTTPS deployment! 🎉 