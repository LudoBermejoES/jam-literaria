const request = require('supertest');
const express = require('express');

// Mock modules before importing the routes
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    session: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn()
    },
    user: {
      findUnique: jest.fn()
    },
    idea: {
      create: jest.fn(),
      findMany: jest.fn()
    },
    vote: {
      createMany: jest.fn(),
      findMany: jest.fn()
    }
  };
  
  return {
    PrismaClient: jest.fn(() => mockPrismaClient)
  };
});

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
  let prisma;
  const testSessionId = 'test-session-id';
  const testSessionCode = 'ABCDEF';
  const ownerUserId = 'owner-user-id';
  
  beforeAll(() => {
    // Setup express app for testing
    app = express();
    app.use(express.json());
    app.use('/api/sessions', sessionRoutes);
    
    // Get mock prisma instance
    const { PrismaClient } = require('@prisma/client');
    prisma = new PrismaClient();
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
      participants: [{ id: ownerUserId, name: 'Owner' }],
      ideas: []
    };
    
    prisma.session.create.mockResolvedValue(mockSession);
    
    const response = await request(app)
      .post('/api/sessions/create')
      .send({ userId: ownerUserId });
    
    expect(response.status).toBe(201);
    expect(response.body).toEqual(mockSession);
  });
}); 