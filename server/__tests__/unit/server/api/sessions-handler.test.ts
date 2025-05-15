import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { 
  generateSessionCode,
  createSession,
  joinSession,
  getSessionStatus,
  startSession,
  startVoting,
  getSessionResults
} from '../../../../routes/sessions/index';

// Mock PrismaClient
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    session: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn()
    },
    user: {
      findUnique: jest.fn()
    }
  };
  
  return {
    PrismaClient: jest.fn(() => mockPrismaClient)
  };
});

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
  let prisma: any;
  
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
    const { PrismaClient } = require('@prisma/client');
    prisma = new PrismaClient();
  });
  
  test('should successfully generate a unique session code', async () => {
    // First call, no existing session with this code
    prisma.session.findUnique.mockResolvedValueOnce(null);
    
    const code = await generateSessionCode();
    
    // Code should be 6 characters
    expect(code).toHaveLength(6);
    expect(prisma.session.findUnique).toHaveBeenCalled();
  });
  
  test('should regenerate code if a collision occurs', async () => {
    // First code exists, second doesn't
    prisma.session.findUnique.mockResolvedValueOnce({ id: 'existing' });
    prisma.session.findUnique.mockResolvedValueOnce(null);
    
    const code = await generateSessionCode();
    
    // Code should have been regenerated
    expect(code).toHaveLength(6);
    expect(prisma.session.findUnique).toHaveBeenCalledTimes(2);
  });
  
  test('should create a session with user as owner and participant', async () => {
    mockReq.body = { userId: 'test-user' };
    
    const mockSession = {
      id: 'session-id',
      code: 'ABCDEF',
      ownerId: 'test-user',
      participants: [{ id: 'test-user' }]
    };
    
    prisma.session.create.mockResolvedValue(mockSession);
    
    await createSession(mockReq as Request, mockRes as Response);
    
    expect(prisma.session.create).toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith(mockSession);
  });
  
  test('should join an existing session', async () => {
    mockReq.body = { userId: 'test-user', code: 'ABCDEF' };
    
    const mockSession = {
      id: 'session-id',
      code: 'ABCDEF',
      ownerId: 'owner-id',
      participants: [{ id: 'owner-id' }]
    };
    
    const updatedSession = {
      ...mockSession,
      participants: [...mockSession.participants, { id: 'test-user' }]
    };
    
    prisma.session.findUnique.mockResolvedValue(mockSession);
    prisma.session.update.mockResolvedValue(updatedSession);
    
    await joinSession(mockReq as Request, mockRes as Response);
    
    expect(prisma.session.findUnique).toHaveBeenCalledWith({
      where: { code: 'ABCDEF' },
      include: { participants: true }
    });
    expect(prisma.session.update).toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(updatedSession);
  });
}); 