import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp, loginUser } from './setup.js';
import { SESSION_STATUS } from '../../models/Session.js';

describe('Sessions API Integration Tests', () => {
  let app;

  beforeEach(() => {
    app = createTestApp();
  });

  describe('POST /api/sessions', () => {
    it('should create a new session when authenticated', async () => {
      const agent = await loginUser(app, 'Session Owner');

      const response = await agent
        .post('/api/sessions')
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.session).toBeDefined();
      expect(response.body.data.session.id).toBeDefined();
      expect(response.body.data.session.code).toBeDefined();
      expect(response.body.data.session.code).toHaveLength(6);
      expect(response.body.data.session.status).toBe(SESSION_STATUS.WAITING);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .post('/api/sessions')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/sessions/:id', () => {
    it('should return session details when authenticated', async () => {
      const agent = await loginUser(app, 'User');

      // Create session
      const createResponse = await agent.post('/api/sessions').expect(201);
      const sessionId = createResponse.body.data.session.id;

      // Get session
      const response = await agent
        .get(`/api/sessions/${sessionId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.session).toBeDefined();
      expect(response.body.data.session.id).toBe(sessionId);
      expect(response.body.data.session.participants).toBeDefined();
      expect(response.body.data.session.metadata).toBeDefined();
    });

    it('should return 404 for non-existent session', async () => {
      const agent = await loginUser(app);

      const response = await agent
        .get('/api/sessions/non-existent-id')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app)
        .get('/api/sessions/some-id')
        .expect(401);
    });
  });

  describe('POST /api/sessions/join', () => {
    it('should allow user to join session by code', async () => {
      const ownerAgent = await loginUser(app, 'Owner');
      const participantAgent = await loginUser(app, 'Participant');

      // Owner creates session
      const createResponse = await ownerAgent.post('/api/sessions').expect(201);
      const sessionCode = createResponse.body.data.session.code;

      // Participant joins
      const joinResponse = await participantAgent
        .post('/api/sessions/join')
        .send({ code: sessionCode })
        .expect(200);

      expect(joinResponse.body.success).toBe(true);
      expect(joinResponse.body.data.session).toBeDefined();
      expect(joinResponse.body.data.session.participants).toBeDefined();
      expect(joinResponse.body.data.session.participants.length).toBe(2);
    });

    it('should reject join with invalid code', async () => {
      const agent = await loginUser(app);

      const response = await agent
        .post('/api/sessions/join')
        .send({ code: 'XXXXXX' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should reject join without code', async () => {
      const agent = await loginUser(app);

      const response = await agent
        .post('/api/sessions/join')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject join when not authenticated', async () => {
      await request(app)
        .post('/api/sessions/join')
        .send({ code: 'ABC123' })
        .expect(401);
    });
  });

  describe('POST /api/sessions/:id/start', () => {
    it('should allow owner to start session', async () => {
      const ownerAgent = await loginUser(app, 'Owner');
      const participantAgent = await loginUser(app, 'Participant');

      // Create session
      const createResponse = await ownerAgent.post('/api/sessions').expect(201);
      const sessionId = createResponse.body.data.session.id;
      const sessionCode = createResponse.body.data.session.code;

      // Add participant
      await participantAgent.post('/api/sessions/join').send({ code: sessionCode });

      // Start session
      const startResponse = await ownerAgent
        .post(`/api/sessions/${sessionId}/start`)
        .expect(200);

      expect(startResponse.body.success).toBe(true);
      expect(startResponse.body.data.session.status).toBe(SESSION_STATUS.SUBMITTING_IDEAS);
    });

    it('should reject start when not owner', async () => {
      const ownerAgent = await loginUser(app, 'Owner');
      const otherAgent = await loginUser(app, 'Other User');

      // Create session
      const createResponse = await ownerAgent.post('/api/sessions').expect(201);
      const sessionId = createResponse.body.data.session.id;
      const sessionCode = createResponse.body.data.session.code;

      // Other user joins
      await otherAgent.post('/api/sessions/join').send({ code: sessionCode });

      // Other user tries to start
      const response = await otherAgent
        .post(`/api/sessions/${sessionId}/start`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should reject start with less than 2 participants', async () => {
      const agent = await loginUser(app, 'Solo Owner');

      // Create session
      const createResponse = await agent.post('/api/sessions').expect(201);
      const sessionId = createResponse.body.data.session.id;

      // Try to start
      const response = await agent
        .post(`/api/sessions/${sessionId}/start`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('at least 2 participants');
    });
  });

  describe('POST /api/sessions/:id/start-voting', () => {
    it('should start voting phase when session has ideas', async () => {
      const ownerAgent = await loginUser(app, 'Owner');
      const participantAgent = await loginUser(app, 'Participant');

      // Create and start session
      const createResponse = await ownerAgent.post('/api/sessions').expect(201);
      const sessionId = createResponse.body.data.session.id;
      const sessionCode = createResponse.body.data.session.code;

      await participantAgent.post('/api/sessions/join').send({ code: sessionCode });
      await ownerAgent.post(`/api/sessions/${sessionId}/start`);

      // Submit ideas
      await ownerAgent.post(`/api/sessions/${sessionId}/ideas`).send({ content: 'Idea 1' });
      await participantAgent.post(`/api/sessions/${sessionId}/ideas`).send({ content: 'Idea 2' });

      // Start voting
      const response = await ownerAgent
        .post(`/api/sessions/${sessionId}/start-voting`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.session.status).toBe(SESSION_STATUS.VOTING);
    });

    it('should reject when not owner', async () => {
      const ownerAgent = await loginUser(app, 'Owner');
      const participantAgent = await loginUser(app, 'Participant');

      const createResponse = await ownerAgent.post('/api/sessions').expect(201);
      const sessionId = createResponse.body.data.session.id;
      const sessionCode = createResponse.body.data.session.code;

      await participantAgent.post('/api/sessions/join').send({ code: sessionCode });
      await ownerAgent.post(`/api/sessions/${sessionId}/start`);

      const response = await participantAgent
        .post(`/api/sessions/${sessionId}/start-voting`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/sessions/:id/participants', () => {
    it('should return list of participants', async () => {
      const ownerAgent = await loginUser(app, 'Owner');
      const participant1Agent = await loginUser(app, 'Participant 1');
      const participant2Agent = await loginUser(app, 'Participant 2');

      // Create session
      const createResponse = await ownerAgent.post('/api/sessions').expect(201);
      const sessionId = createResponse.body.data.session.id;
      const sessionCode = createResponse.body.data.session.code;

      // Add participants
      await participant1Agent.post('/api/sessions/join').send({ code: sessionCode });
      await participant2Agent.post('/api/sessions/join').send({ code: sessionCode });

      // Get participants
      const response = await ownerAgent
        .get(`/api/sessions/${sessionId}/participants`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.participants).toBeDefined();
      expect(response.body.data.participants.length).toBe(3);
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/sessions/some-id/participants')
        .expect(401);
    });
  });

  describe('DELETE /api/sessions/:id', () => {
    it('should allow owner to delete session', async () => {
      const agent = await loginUser(app, 'Owner');

      // Create session
      const createResponse = await agent.post('/api/sessions').expect(201);
      const sessionId = createResponse.body.data.session.id;

      // Delete session
      const deleteResponse = await agent
        .delete(`/api/sessions/${sessionId}`)
        .expect(200);

      expect(deleteResponse.body.success).toBe(true);

      // Verify deleted
      await agent.get(`/api/sessions/${sessionId}`).expect(404);
    });

    it('should reject delete when not owner', async () => {
      const ownerAgent = await loginUser(app, 'Owner');
      const otherAgent = await loginUser(app, 'Other User');

      // Create session
      const createResponse = await ownerAgent.post('/api/sessions').expect(201);
      const sessionId = createResponse.body.data.session.id;

      // Other user tries to delete
      const response = await otherAgent
        .delete(`/api/sessions/${sessionId}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });
});
