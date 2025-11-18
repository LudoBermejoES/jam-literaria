import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import request from 'supertest';

// Routes
import authRoutes from '../../api/routes/auth.js';
import sessionRoutes from '../../api/routes/sessions.js';
import ideaRoutes from '../../api/routes/ideas.js';
import voteRoutes from '../../api/routes/votes.js';

// Models
import { Session } from '../../models/Session.js';
import { Vote } from '../../models/Vote.js';
import { Idea } from '../../models/Idea.js';
import { User } from '../../models/User.js';

/**
 * Create a test Express app instance
 * This mirrors the main app.js setup but without Socket.IO
 */
export function createTestApp() {
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Session middleware for tests
  app.use(session({
    secret: 'test-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // HTTP for tests
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000
    }
  }));

  // Make models available to controllers via app.locals
  app.locals.Session = Session;
  app.locals.Vote = Vote;
  app.locals.Idea = Idea;
  app.locals.User = User;

  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/sessions', sessionRoutes);
  app.use('/api/sessions', ideaRoutes);
  app.use('/api/sessions', voteRoutes);

  // Error handling
  app.use((err, req, res, next) => {
    console.error('Test server error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Internal server error'
    });
  });

  return app;
}

/**
 * Helper to create a user and login
 * Returns agent with session cookie set
 */
export async function loginUser(app, userName = 'Test User') {
  const agent = request.agent(app);

  // Register user
  await agent
    .post('/api/auth/register')
    .send({ name: userName })
    .expect(201);

  return agent;
}
