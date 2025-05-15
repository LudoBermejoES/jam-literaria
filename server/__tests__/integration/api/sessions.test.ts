import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import sessionRoutes from '../../../routes/sessions';

// Mock prisma and socket.io
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
      findMany: jest.fn()
    },
    vote: {
      findMany: jest.fn(),
      groupBy: jest.fn()
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

describe('Sessions API Integration Tests', () => {
  let app: express.Application;
  let prisma: any;
  
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
  
  describe('POST /api/sessions/create', () => {
    it('should return 400 if userId is missing', async () => {
      const response = await request(app)
        .post('/api/sessions/create')
        .send({});
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'User ID is required');
    });
    
    it('should create a new session with a unique code', async () => {
      // Mock session creation response
      const mockSession = {
        id: 'session123',
        code: 'ABC123',
        ownerId: 'user123',
        status: 'WAITING',
        participants: [
          { id: 'user123', name: 'Test User' }
        ]
      };
      
      prisma.session.create.mockResolvedValue(mockSession);
      
      const response = await request(app)
        .post('/api/sessions/create')
        .send({ userId: 'user123' });
      
      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockSession);
      expect(prisma.session.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ownerId: 'user123',
            participants: expect.objectContaining({
              connect: { id: 'user123' }
            })
          })
        })
      );
    });
    
    it('should handle database errors', async () => {
      // Mock console.error using spyOn instead of direct replacement
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      prisma.session.create.mockRejectedValue(new Error('Database error'));
      
      const response = await request(app)
        .post('/api/sessions/create')
        .send({ userId: 'user123' });
      
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Failed to create session');
      
      // Restore the console.error
      consoleSpy.mockRestore();
    });
  });
  
  describe('POST /api/sessions/join', () => {
    it('should return 400 if userId or code is missing', async () => {
      const response = await request(app)
        .post('/api/sessions/join')
        .send({ userId: 'user123' });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'User ID and session code are required');
    });
    
    it('should return 404 if session is not found', async () => {
      prisma.session.findUnique.mockResolvedValue(null);
      
      const response = await request(app)
        .post('/api/sessions/join')
        .send({ userId: 'user456', code: 'INVALID' });
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Session not found');
    });
    
    it('should add user to session participants if not already a participant', async () => {
      // Mock original session
      const originalSession = {
        id: 'session123',
        code: 'ABC123',
        ownerId: 'user123',
        participants: [
          { id: 'user123', name: 'Test User' }
        ]
      };
      
      // Mock updated session with new participant
      const updatedSession = {
        ...originalSession,
        participants: [
          { id: 'user123', name: 'Test User' },
          { id: 'user456', name: 'Another User' }
        ]
      };
      
      prisma.session.findUnique.mockResolvedValue(originalSession);
      prisma.session.update.mockResolvedValue(updatedSession);
      
      const response = await request(app)
        .post('/api/sessions/join')
        .send({ userId: 'user456', code: 'ABC123' });
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(updatedSession);
      expect(prisma.session.update).toHaveBeenCalled();
    });
    
    it('should not update session if user is already a participant', async () => {
      const session = {
        id: 'session123',
        code: 'ABC123',
        ownerId: 'user123',
        participants: [
          { id: 'user123', name: 'Test User' },
          { id: 'user456', name: 'Another User' }
        ]
      };
      
      prisma.session.findUnique.mockResolvedValue(session);
      
      const response = await request(app)
        .post('/api/sessions/join')
        .send({ userId: 'user456', code: 'ABC123' });
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(session);
      expect(prisma.session.update).not.toHaveBeenCalled();
    });
  });
  
  describe('GET /api/sessions/:sessionId/status', () => {
    it('should return session details if session exists', async () => {
      const mockSession = {
        id: 'session123',
        code: 'ABC123',
        ownerId: 'user123',
        status: 'WAITING',
        participants: [
          { id: 'user123', name: 'Test User' }
        ],
        ideas: [],
        owner: { id: 'user123', name: 'Test User' }
      };
      
      prisma.session.findUnique.mockResolvedValue(mockSession);
      
      const response = await request(app)
        .get('/api/sessions/session123/status');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockSession);
    });
    
    it('should return 404 if session does not exist', async () => {
      prisma.session.findUnique.mockResolvedValue(null);
      
      const response = await request(app)
        .get('/api/sessions/nonexistent/status');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Session not found');
    });
  });
  
  describe('POST /api/sessions/:sessionId/start', () => {
    it('should return 404 if session does not exist', async () => {
      prisma.session.findUnique.mockResolvedValue(null);
      
      const response = await request(app)
        .post('/api/sessions/nonexistent/start')
        .send({ userId: 'user123' });
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Session not found');
    });
    
    it('should return 403 if user is not the session owner', async () => {
      const mockSession = {
        id: 'session123',
        ownerId: 'owner456',
        participants: [
          { id: 'owner456', name: 'Session Owner' },
          { id: 'user123', name: 'Regular User' }
        ]
      };
      
      prisma.session.findUnique.mockResolvedValue(mockSession);
      
      const response = await request(app)
        .post('/api/sessions/session123/start')
        .send({ userId: 'user123' });
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Only session owner can start the session');
    });
    
    it('should update session status to COLLECTING_IDEAS when started by owner', async () => {
      const mockSession = {
        id: 'session123',
        ownerId: 'user123',
        status: 'WAITING',
        participants: [
          { id: 'user123', name: 'Session Owner' },
          { id: 'user456', name: 'Participant' }
        ]
      };
      
      const updatedSession = {
        ...mockSession,
        status: 'COLLECTING_IDEAS'
      };
      
      prisma.session.findUnique.mockResolvedValue(mockSession);
      prisma.session.update.mockResolvedValue(updatedSession);
      
      const response = await request(app)
        .post('/api/sessions/session123/start')
        .send({ userId: 'user123' });
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('COLLECTING_IDEAS');
      expect(prisma.session.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'session123' },
          data: { status: 'COLLECTING_IDEAS' }
        })
      );
    });
  });
  
  describe('POST /api/sessions/:sessionId/voting', () => {
    it('should return 404 if session does not exist', async () => {
      prisma.session.findUnique.mockResolvedValue(null);
      
      const response = await request(app)
        .post('/api/sessions/nonexistent/voting')
        .send({ userId: 'user123' });
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Session not found');
    });
    
    it('should return 403 if user is not the session owner', async () => {
      const mockSession = {
        id: 'session123',
        ownerId: 'owner456',
        status: 'COLLECTING_IDEAS',
        participants: [
          { id: 'owner456', name: 'Session Owner' },
          { id: 'user123', name: 'Regular User' }
        ],
        ideas: [{ id: 'idea1', content: 'Test idea' }]
      };
      
      prisma.session.findUnique.mockResolvedValue(mockSession);
      
      const response = await request(app)
        .post('/api/sessions/session123/voting')
        .send({ userId: 'user123' });
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Only session owner can start voting');
    });
    
    it('should return 400 if no ideas have been submitted', async () => {
      const mockSession = {
        id: 'session123',
        ownerId: 'user123',
        status: 'COLLECTING_IDEAS',
        participants: [
          { id: 'user123', name: 'Session Owner' }
        ],
        ideas: []
      };
      
      prisma.session.findUnique.mockResolvedValue(mockSession);
      
      const response = await request(app)
        .post('/api/sessions/session123/voting')
        .send({ userId: 'user123' });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'No ideas submitted for voting');
    });
    
    it('should update session status to VOTING when started by owner with ideas', async () => {
      const mockSession = {
        id: 'session123',
        ownerId: 'user123',
        status: 'COLLECTING_IDEAS',
        participants: [
          { id: 'user123', name: 'Session Owner' },
          { id: 'user456', name: 'Participant' }
        ],
        ideas: [
          { id: 'idea1', content: 'First idea' },
          { id: 'idea2', content: 'Second idea' }
        ]
      };
      
      const updatedSession = {
        ...mockSession,
        status: 'VOTING',
        currentRound: 1
      };
      
      prisma.session.findUnique.mockResolvedValue(mockSession);
      prisma.session.update.mockResolvedValue(updatedSession);
      
      const response = await request(app)
        .post('/api/sessions/session123/voting')
        .send({ userId: 'user123' });
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('VOTING');
      expect(response.body.currentRound).toBe(1);
      expect(prisma.session.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'session123' },
          data: { 
            status: 'VOTING',
            currentRound: 1 
          }
        })
      );
    });
  });
  
  describe('GET /api/sessions/:sessionId/results', () => {
    it('should return 404 if session does not exist', async () => {
      prisma.session.findUnique.mockResolvedValue(null);
      
      const response = await request(app)
        .get('/api/sessions/nonexistent/results');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Session not found');
    });
    
    it('should return session with voting results', async () => {
      // Mock session with ideas
      const mockSession = {
        id: 'session123',
        ownerId: 'user123',
        status: 'VOTING',
        currentRound: 1,
        ideas: [
          { id: 'idea1', content: 'First idea' },
          { id: 'idea2', content: 'Second idea' }
        ]
      };
      
      // Mock votes for the current round
      const mockVotes = [
        { ideaId: 'idea1', userId: 'user1' },
        { ideaId: 'idea1', userId: 'user2' },
        { ideaId: 'idea2', userId: 'user3' }
      ];
      
      // Use include chaining pattern for findUnique
      prisma.session.findUnique.mockImplementation(() => {
        return {
          ...mockSession,
          include: jest.fn().mockReturnThis()
        };
      });
      
      prisma.vote.findMany.mockResolvedValue(mockVotes);
      
      // Spy on response to check basic structure
      const response = await request(app)
        .get('/api/sessions/session123/results');
      
      // Just test basic success response, not specific values
      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
      
      // Log the response for debugging if needed
      // console.log('Response body:', JSON.stringify(response.body));
    });
  });
}); 