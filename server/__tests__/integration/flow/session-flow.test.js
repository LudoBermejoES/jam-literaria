const request = require('supertest');
const express = require('express');

// Create mocked objects directly
const mockSessionObj = {
  create: jest.fn(),
  findUnique: jest.fn(),
  update: jest.fn()
};

const mockUserObj = {
  findUnique: jest.fn()
};

const mockIdeaObj = {
  create: jest.fn(),
  findMany: jest.fn()
};

const mockVoteObj = {
  createMany: jest.fn(),
  findMany: jest.fn()
};

// Create the mock Prisma client
const mockPrisma = {
  session: mockSessionObj,
  user: mockUserObj,
  idea: mockIdeaObj,
  vote: mockVoteObj
};

// Mock prisma from lib/prisma
jest.mock('../../../lib/prisma', () => ({
  __esModule: true,
  default: mockPrisma
}));

jest.mock('../../../index', () => ({
  io: {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn()
  }
}));

// Import after mocks are set up
const sessionRoutesModule = require('../../../routes/sessions');
const sessionRoutes = sessionRoutesModule.default || sessionRoutesModule;

// Use a shorter test timeout to prevent hanging
jest.setTimeout(5000);

describe('Session Flow Tests (JS)', () => {
  let app;
  const testSessionId = 'test-session-id';
  const testSessionCode = 'ABCDEF';
  const ownerUserId = 'owner-user-id';
  const testDate = new Date().toISOString();
  
  beforeAll(() => {
    // Setup express app for testing
    app = express();
    app.use(express.json());
    app.use('/api/sessions', sessionRoutes);
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should create a session successfully', async () => {
    // Setup mock session
    const mockSession = {
      id: testSessionId,
      code: testSessionCode,
      ownerId: ownerUserId,
      status: 'WAITING',
      currentRound: 0,
      createdAt: testDate, 
      updatedAt: testDate,
      participants: [{ 
        id: ownerUserId, 
        name: 'Owner',
        createdAt: testDate,
        lastActive: testDate
      }]
    };
    
    mockSessionObj.create.mockResolvedValue(mockSession);
    
    const response = await request(app)
      .post('/api/sessions/create')
      .send({ userId: ownerUserId });
    
    expect(response.status).toBe(201);
    
    // Use expect.objectContaining instead of strict equality
    expect(response.body).toMatchObject({
      id: expect.any(String),
      code: expect.any(String),
      ownerId: ownerUserId,
      status: 'WAITING'
    });
  });
}); 