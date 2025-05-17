import { Request, Response } from 'express';
// import { PrismaClient } from '@prisma/client'; // Remove this
import { 
  generateSessionCode,
  createSession,
  joinSession,
  getSessionStatus,
  startSession,
  startVoting,
  getSessionResults
} from '../../../../routes/sessions/index';
import { jest, describe, it, expect, beforeEach, test } from '@jest/globals';

// Mock PrismaClient from lib/prisma directly
jest.mock('../../../../lib/prisma', () => ({
  __esModule: true,
  default: {
    session: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn()
    },
    user: {
      findUnique: jest.fn()
    }
  }
}));

// Mock Socket.io
jest.mock('../../../../index', () => ({
  io: {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn()
  }
}));

describe('Session Handlers', () => {
  // Mock express request and response
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let prismaMock: any;
  const testDate = new Date().toISOString();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Initialize mocks for each test
    mockReq = {
      body: {},
      params: {}
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    // Get Prisma instance
    prismaMock = require('../../../../lib/prisma').default;
  });
  
  test('should successfully generate a unique session code', async () => {
    // First call, no existing session with this code
    prismaMock.session.findUnique.mockResolvedValueOnce(null);
    
    const code = await generateSessionCode();
    
    // Code should be 6 characters
    expect(code).toHaveLength(6);
    expect(prismaMock.session.findUnique).toHaveBeenCalled();
  });
  
  test('should regenerate code if a collision occurs', async () => {
    // First code exists, second doesn't
    prismaMock.session.findUnique.mockResolvedValueOnce({ id: 'existing' });
    prismaMock.session.findUnique.mockResolvedValueOnce(null);
    
    const code = await generateSessionCode();
    
    // Code should have been regenerated
    expect(code).toHaveLength(6);
    expect(prismaMock.session.findUnique).toHaveBeenCalledTimes(2);
  });
  
  test('should create a session with user as owner and participant', async () => {
    mockReq.body = { userId: 'test-user' };
    
    // Make user findable in database
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'test-user',
      name: 'Test User',
      createdAt: testDate,
      lastActive: testDate
    });
    
    const mockSession = {
      id: 'session-id',
      code: 'ABCDEF',
      ownerId: 'test-user',
      status: 'WAITING',
      currentRound: 0,
      createdAt: testDate,
      updatedAt: testDate,
      participants: [{
        id: 'test-user',
        name: 'Test User',
        createdAt: testDate,
        lastActive: testDate
      }]
    };
    
    prismaMock.session.create.mockResolvedValue(mockSession);
    
    await createSession(mockReq as Request, mockRes as Response);
    
    expect(prismaMock.session.create).toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith(mockSession);
  });
  
  test('should join an existing session', async () => {
    mockReq.body = { userId: 'test-user', code: 'ABCDEF' };
    
    // Setup mock user data
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'test-user',
      name: 'Test User',
      createdAt: testDate,
      lastActive: testDate
    });
    
    const mockSession = {
      id: 'session-id',
      code: 'ABCDEF',
      ownerId: 'owner-id',
      status: 'WAITING',
      currentRound: 0,
      createdAt: testDate,
      updatedAt: testDate,
      participants: [{
        id: 'owner-id',
        name: 'Owner',
        createdAt: testDate,
        lastActive: testDate
      }]
    };
    
    const updatedSession = {
      ...mockSession,
      participants: [
        ...mockSession.participants,
        {
          id: 'test-user',
          name: 'Test User',
          createdAt: testDate,
          lastActive: testDate
        }
      ]
    };
    
    prismaMock.session.findUnique.mockResolvedValue(mockSession);
    prismaMock.session.update.mockResolvedValue(updatedSession);
    
    await joinSession(mockReq as Request, mockRes as Response);
    
    expect(prismaMock.session.findUnique).toHaveBeenCalledWith({
      where: { code: 'ABCDEF' },
      include: { participants: true }
    });
    expect(prismaMock.session.update).toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(updatedSession);
  });
}); 