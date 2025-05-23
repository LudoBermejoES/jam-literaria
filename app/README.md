# Jam Literaria - Client

This is the React client for Jam Literaria, a collaborative writing platform that enables real-time brainstorming, idea sharing, and voting.

## Features

- User registration and authentication
- Create and join writing sessions
- Real-time collaboration
- Idea submission and voting

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
- `npm run build` - Build the app for production
- `npm run lint` - Run ESLint to check for code issues
- `npm run preview` - Preview the production build locally

## Project Structure

- `src/components` - Reusable UI components
- `src/pages` - Page components
- `src/context` - React context providers (e.g., authentication)
- `src/services` - API communication services
- `src/styles` - CSS files for components and pages

## API Connection

The app connects to a Node.js/Express backend running on `http://localhost:5000` by default. Make sure the server is running before using the app.

## Tech Stack

- React
- React Router
- Axios for API requests
- CSS for styling (no additional UI libraries)
