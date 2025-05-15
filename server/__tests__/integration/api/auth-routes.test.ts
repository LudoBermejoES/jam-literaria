import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import authRouter from '../../../routes/auth';

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

// Mock PrismaClient
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn()
    }
  };
  
  return {
    PrismaClient: jest.fn(() => mockPrismaClient)
  };
});

// Mock auth middleware
jest.mock('../../../middleware/auth', () => {
  return {
    authMiddleware: jest.fn((req, res, next) => {
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

describe('Auth API Routes', () => {
  let app: express.Application;
  let prisma: any;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create Express app
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRouter);
    
    // Get Prisma instance
    prisma = new PrismaClient();
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
      
      prisma.user.create.mockResolvedValue(mockUser);
      
      const response = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test User' });
      
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: { name: 'Test User' }
      });
      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        data: mockUser
      });
    });
    
    it('should handle database errors', async () => {
      prisma.user.create.mockRejectedValue(new Error('Database error'));
      
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