# Production Deployment Configuration

This document outlines the changes made to configure the Jam Literaria client for production deployment on `https://www.ludobermejo.es`.

## Changes Made

### 1. Environment Configuration Files

Created environment-specific configuration files:

- **`.env`** - Default configuration (development)
- **`.env.development`** - Development environment
- **`.env.production`** - Production environment

Each file contains:
```bash
VITE_API_URL=<server_base_url>
VITE_API_BASE=<api_endpoint_url>
```

### 2. Service Updates

Updated the following service files to use environment variables:

- **`src/services/api.js`** - API service now uses `VITE_API_BASE`
- **`src/services/socketService.js`** - Socket service now uses `VITE_API_URL`  
- **`src/context/SocketContext.jsx`** - Already configured to use `VITE_API_URL`

### 3. Build Configuration

- **`vite.config.js`** - Enhanced with build optimization and server configuration
- **`package.json`** - Added environment-specific build scripts:
  - `npm run build:production` - Builds for production
  - `npm run build:development` - Builds for development

### 4. Deployment Pipeline

- **`.github/workflows/deploy.yml`** - Updated to use production build command
- **Server configuration** - Updated to use port 5000 for consistency

## Production URLs

- **Frontend**: `https://www.ludobermejo.es` (served via nginx)
- **Backend API**: `https://www.ludobermejo.es:5000/api`
- **Socket.IO**: `https://www.ludobermejo.es:5000`

## Deployment Commands

### For Development
```bash
npm run dev                 # Start development server
npm run build:development   # Build for development
```

### For Production
```bash
npm run build:production    # Build for production deployment
```

### Deployment Process

1. GitHub Actions automatically triggers on push to main branch
2. Builds the frontend using `npm run build:production`
3. Creates deployment archives
4. Uploads and deploys to the production server
5. Configures nginx to serve the frontend and proxy API/Socket.IO requests

## Environment Variables in Production

The production build will automatically use the URLs configured in `.env.production`:
- API calls will go to `https://www.ludobermejo.es:5000/api`
- Socket.IO connections will go to `https://www.ludobermejo.es:5000`

## Testing

Both development and production builds have been tested and compile successfully:
- Development build: Uses `localhost:5000`
- Production build: Uses `www.ludobermejo.es:5000`

The configuration is now ready for production deployment! 