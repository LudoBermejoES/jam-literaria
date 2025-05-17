import request from 'supertest';
import express from 'express';
// import { PrismaClient } from '@prisma/client'; // Remove this
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Define mock types to match what our middleware expects
interface MockUser {
  id: string;
  name: string;
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: MockUser;
    }
  }
}

// Create mock objects first
const mockUserObj = {
  create: jest.fn(),
  findUnique: jest.fn(),
  update: jest.fn()
};

// Create the mock Prisma client
const mockPrisma = {
  user: mockUserObj
};

// Mock Prisma from lib/prisma
jest.mock('../../../lib/prisma', () => ({
  __esModule: true,
  default: mockPrisma
}));

// Mock auth middleware
jest.mock('../../../middleware/auth', () => {
  return {
    authMiddleware: jest.fn((req: any, res: any, next: any) => {
      const userId = req.headers['x-user-id'];
      
      if (userId === 'valid-user-id') {
        req.user = { 
          id: 'valid-user-id', 
          name: 'Test User'
        };
        next();
      } else {
        res.status(401).json({
          success: false,
          message: 'Invalid authentication'
        });
      }
    })
  };
});

// Import after mocking
import authRouter from '../../../routes/auth';

describe('Auth API Routes', () => {
  let app: express.Application;
  let prismaMock: any;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create Express app
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRouter);
    
    // Get Prisma instance
    prismaMock = require('../../../lib/prisma').default;
  });
  
  describe('POST /api/auth/register', () => {
    it('should return 400 if name is not provided', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({});
      
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: 'Valid name is required'
      });
    });
    
    it('should return 400 if name is empty', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ name: '' });
      
      expect(response.status).toBe(400);
    });
    
    it('should create a user and return 201 if name is provided', async () => {
      const mockUser = {
        id: 'user123',
        name: 'Test User'
      };
      
      prismaMock.user.create.mockResolvedValue(mockUser);
      
      const response = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test User' });
      
      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: { name: 'Test User' }
      });
      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        data: mockUser
      });
    });
    
    it('should handle database errors', async () => {
      prismaMock.user.create.mockRejectedValue(new Error('Database error'));
      
      // Mock console.error
      console.error = jest.fn();
      
      const response = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test User' });
      
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        message: 'Internal server error'
      });
      expect(console.error).toHaveBeenCalled();
    });
  });
  
  describe('GET /api/auth/validate', () => {
    it('should return 401 if user ID is invalid', async () => {
      const response = await request(app)
        .get('/api/auth/validate')
        .set('x-user-id', 'invalid-user-id');
      
      expect(response.status).toBe(401);
    });
    
    it('should return user data if user ID is valid', async () => {
      const response = await request(app)
        .get('/api/auth/validate')
        .set('x-user-id', 'valid-user-id');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: {
          id: 'valid-user-id',
          name: 'Test User'
        }
      });
    });
  });
}); 