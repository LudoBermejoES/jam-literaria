import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import authRoutes from '../../../../routes/auth';

// Mock the Prisma client
jest.mock('../../../../lib/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      create: jest.fn(),
      findUnique: jest.fn()
    }
  }
}));

// Mock the auth middleware
jest.mock('../../../../middleware/auth', () => ({
  authMiddleware: jest.fn((req, res, next) => {
    // For successful auth, add user to request
    req.user = {
      id: 'test-user-id',
      name: 'Test User'
    };
    next();
  })
}));

describe('Auth Routes', () => {
  let app: express.Application;
  let prisma: any;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);
    
    // Get mocked prisma
    prisma = require('../../../../lib/prisma').default;
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('POST /register', () => {
    it('should register a new user with valid name', async () => {
      const mockUser = {
        id: 'test-id',
        name: 'John Doe',
        createdAt: new Date(),
        lastActive: new Date()
      };
      
      prisma.user.create.mockResolvedValue(mockUser);
      
      const response = await request(app)
        .post('/api/auth/register')
        .send({ name: 'John Doe' });
      
      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        data: {
          id: 'test-id',
          name: 'John Doe'
        }
      });
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: { name: 'John Doe' }
      });
    });

    it('should return 400 for missing name', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({});
      
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: 'Valid name is required'
      });
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should return 400 for empty name', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ name: '' });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      prisma.user.create.mockRejectedValue(new Error('Database error'));
      
      const response = await request(app)
        .post('/api/auth/register')
        .send({ name: 'John Doe' });
      
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        message: 'Internal server error'
      });
    });
  });

  describe('GET /validate', () => {
    it('should validate an authenticated user', async () => {
      const response = await request(app)
        .get('/api/auth/validate');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: {
          id: 'test-user-id',
          name: 'Test User'
        }
      });
    });
  });
}); 