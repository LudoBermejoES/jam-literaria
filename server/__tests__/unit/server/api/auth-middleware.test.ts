import { Request, Response, NextFunction } from 'express';
import { authMiddleware, sessionMemberMiddleware, sessionOwnerMiddleware } from '../../../../middleware/auth';
import { PrismaClient } from '../../../../generated/prisma';

// Mock PrismaClient
jest.mock('../../../../server/generated/prisma', () => {
  // Create mock implementation
  const mockPrismaClient = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn()
    },
    session: {
      findFirst: jest.fn()
    }
  };
  
  return {
    PrismaClient: jest.fn(() => mockPrismaClient)
  };
});

describe('Auth Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let nextFunction: jest.Mock;
  let prisma: any;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Get Prisma instance
    prisma = new PrismaClient();
    
    // Setup request and response mocks
    mockReq = {
      headers: {},
      params: {}
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    nextFunction = jest.fn();
  });
  
  describe('authMiddleware', () => {
    it('should return 401 if no user ID is provided', async () => {
      // Execute
      await authMiddleware(mockReq as Request, mockRes as Response, nextFunction);
      
      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required'
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });
    
    it('should return 401 if user is not found', async () => {
      // Setup
      mockReq.headers = { 'x-user-id': 'non-existent-id' };
      prisma.user.findUnique.mockResolvedValue(null);
      
      // Execute
      await authMiddleware(mockReq as Request, mockRes as Response, nextFunction);
      
      // Assert
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'non-existent-id' }
      });
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid authentication'
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });
    
    it('should call next() and add user to request if user is valid', async () => {
      // Setup
      const mockUser = { id: 'valid-user-id', name: 'Test User' };
      mockReq.headers = { 'x-user-id': 'valid-user-id' };
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue(mockUser);
      
      // Execute
      await authMiddleware(mockReq as Request, mockRes as Response, nextFunction);
      
      // Assert
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'valid-user-id' }
      });
      expect(prisma.user.update).toHaveBeenCalled();
      expect(mockReq.user).toEqual(mockUser);
      expect(nextFunction).toHaveBeenCalled();
    });
    
    it('should handle database errors', async () => {
      // Setup
      mockReq.headers = { 'x-user-id': 'valid-user-id' };
      prisma.user.findUnique.mockRejectedValue(new Error('Database error'));
      
      // Mock console.error
      console.error = jest.fn();
      
      // Execute
      await authMiddleware(mockReq as Request, mockRes as Response, nextFunction);
      
      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error'
      });
      expect(console.error).toHaveBeenCalled();
    });
  });
  
  describe('sessionMemberMiddleware', () => {
    it('should return 400 if user ID or session ID is missing', async () => {
      // Setup
      mockReq.headers = { 'x-user-id': 'user-id' };
      // No sessionId in params
      
      // Execute
      await sessionMemberMiddleware(mockReq as Request, mockRes as Response, nextFunction);
      
      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'User ID and session ID are required'
      });
    });
    
    it('should return 403 if user is not a member of the session', async () => {
      // Setup
      mockReq.headers = { 'x-user-id': 'user-id' };
      mockReq.params = { sessionId: 'session-id' };
      prisma.session.findFirst.mockResolvedValue(null);
      
      // Execute
      await sessionMemberMiddleware(mockReq as Request, mockRes as Response, nextFunction);
      
      // Assert
      expect(prisma.session.findFirst).toHaveBeenCalledWith({
        where: { 
          id: 'session-id',
          OR: [
            { ownerId: 'user-id' },
            { participants: { some: { id: 'user-id' } } }
          ]
        }
      });
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'User is not a member of this session'
      });
    });
    
    it('should call next() and add session to request if user is a member', async () => {
      // Setup
      const mockSession = { id: 'session-id', ownerId: 'other-user', name: 'Test Session' };
      mockReq.headers = { 'x-user-id': 'user-id' };
      mockReq.params = { sessionId: 'session-id' };
      prisma.session.findFirst.mockResolvedValue(mockSession);
      
      // Execute
      await sessionMemberMiddleware(mockReq as Request, mockRes as Response, nextFunction);
      
      // Assert
      expect(mockReq.session).toEqual(mockSession);
      expect(nextFunction).toHaveBeenCalled();
    });
  });
  
  describe('sessionOwnerMiddleware', () => {
    it('should return 400 if user ID or session ID is missing', async () => {
      // Setup
      mockReq.headers = { 'x-user-id': 'user-id' };
      // No sessionId in params
      
      // Execute
      await sessionOwnerMiddleware(mockReq as Request, mockRes as Response, nextFunction);
      
      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
    
    it('should return 403 if user is not the owner of the session', async () => {
      // Setup
      mockReq.headers = { 'x-user-id': 'user-id' };
      mockReq.params = { sessionId: 'session-id' };
      prisma.session.findFirst.mockResolvedValue(null);
      
      // Execute
      await sessionOwnerMiddleware(mockReq as Request, mockRes as Response, nextFunction);
      
      // Assert
      expect(prisma.session.findFirst).toHaveBeenCalledWith({
        where: { 
          id: 'session-id',
          ownerId: 'user-id'
        }
      });
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'User is not the owner of this session'
      });
    });
    
    it('should call next() and add session to request if user is the owner', async () => {
      // Setup
      const mockSession = { id: 'session-id', ownerId: 'user-id', name: 'Test Session' };
      mockReq.headers = { 'x-user-id': 'user-id' };
      mockReq.params = { sessionId: 'session-id' };
      prisma.session.findFirst.mockResolvedValue(mockSession);
      
      // Execute
      await sessionOwnerMiddleware(mockReq as Request, mockRes as Response, nextFunction);
      
      // Assert
      expect(mockReq.session).toEqual(mockSession);
      expect(nextFunction).toHaveBeenCalled();
    });
  });
}); 