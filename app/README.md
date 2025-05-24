# Jam Literaria - Client

This is the React client for Jam Literaria, a collaborative writing platform that enables real-time brainstorming, idea sharing, and voting.

## Features

- User registration and authentication
- Create and join writing sessions
- Real-time collaboration
- Idea submission and voting

## Environment Configuration

The application supports different environments with specific configurations:

### Development
Uses `.env.development` or `.env` for local development:
```
VITE_API_URL=http://localhost:5000
VITE_API_BASE=http://localhost:5000/api
```

### Production
Uses `.env.production` for production deployment:
```
VITE_API_URL=https://www.ludobermejo.es:5000
VITE_API_BASE=https://www.ludobermejo.es:5000/api
```

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm (v7 or later)

### Installation

1. Clone the repository
2. Navigate to the app directory
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the app for production (auto-detects environment)
- `npm run build:development` - Build for development environment
- `npm run build:production` - Build for production environment
- `npm run lint` - Run ESLint to check for code issues
- `npm run preview` - Preview the production build locally

## Project Structure

- `src/components` - Reusable UI components
- `src/pages` - Page components
- `src/context` - React context providers (e.g., authentication)
- `src/services` - API communication services
- `src/styles` - CSS files for components and pages

## API Connection

The app connects to a Node.js/Express backend. The connection URL is determined by environment variables:

- **Development**: `http://localhost:5000` (default)
- **Production**: `https://www.ludobermejo.es:5000`

Make sure the server is running before using the app.

## Tech Stack

- React
- React Router
- Axios for API requests
- Socket.IO for real-time communication
- CSS for styling (no additional UI libraries)
