import express from 'express';
import cors from 'cors';
import http from 'http';
import dotenv from 'dotenv';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import path from 'path';

// Routes
import authRoutes from './api/routes/auth.js';
import sessionRoutes from './api/routes/sessions.js';
import ideaRoutes from './api/routes/ideas.js';
import voteRoutes from './api/routes/votes.js';

// Database and Socket.IO
import { initDatabase, closeDatabase } from './models/db.js';
import { initSocketIO } from './socket/io.js';
import { setupSocketServer } from './socket/index.js';

// Load environment variables
dotenv.config();

// Get directory name properly with ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize the app
const app = express();
const server = http.createServer(app);

// Set up middleware
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [process.env.CLIENT_URL || 'http://localhost:3000', 'http://localhost:5173'];
    // Allow requests with no origin (like mobile apps or curl requests)
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) !== -1){
      return callback(null, true);
    }
    return callback(null, true); // temporarily allow all origins
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Set up session
app.use(session({
  secret: process.env.SESSION_SECRET || 'jam-literaria-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize database
initDatabase();

// Set up Socket.IO
setupSocketServer(server);

// Set up API routes
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/sessions', ideaRoutes);
app.use('/api/sessions', voteRoutes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const clientPath = path.join(__dirname, '../client/build');
  app.use(express.static(clientPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientPath, 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start the server
const PORT = process.env.PORT || 5000;
const server_instance = server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle graceful shutdown
const gracefulShutdown = () => {
  console.log('Shutting down gracefully...');
  
  server_instance.close(() => {
    console.log('HTTP server closed');
    
    // Close database connection
    closeDatabase();
    
    process.exit(0);
  });
  
  // Force close after 10s
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

export default server; 