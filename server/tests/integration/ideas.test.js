import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp, loginUser } from './setup.js';

describe('Ideas API Integration Tests', () => {
  let app;

  beforeEach(() => {
    app = createTestApp();
  });

  async function setupSession(ownerName = 'Owner', participantName = 'Participant') {
    const ownerAgent = await loginUser(app, ownerName);
    const participantAgent = await loginUser(app, participantName);

    const createResponse = await ownerAgent.post('/api/sessions').expect(201);
    const sessionId = createResponse.body.data.session.id;
    const sessionCode = createResponse.body.data.session.code;

    await participantAgent.post('/api/sessions/join').send({ code: sessionCode });
    await ownerAgent.post(`/api/sessions/${sessionId}/start`);

    return { ownerAgent, participantAgent, sessionId };
  }

  describe('POST /api/sessions/:id/ideas', () => {
    it('should create idea when session is in SUBMITTING_IDEAS state', async () => {
      const { ownerAgent, sessionId } = await setupSession();

      const response = await ownerAgent
        .post(`/api/sessions/${sessionId}/ideas`)
        .send({ content: 'Test idea content' })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.idea).toBeDefined();
      expect(response.body.data.idea.content).toBe('Test idea content');
      expect(response.body.data.idea.id).toBeDefined();
    });

    it('should enforce minimum content length (3 characters)', async () => {
      const { ownerAgent, sessionId } = await setupSession();

      const response = await ownerAgent
        .post(`/api/sessions/${sessionId}/ideas`)
        .send({ content: 'AB' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('at least 3 characters');
    });

    it('should enforce maximum content length (200 characters)', async () => {
      const { ownerAgent, sessionId } = await setupSession();

      const longContent = 'A'.repeat(201);
      const response = await ownerAgent
        .post(`/api/sessions/${sessionId}/ideas`)
        .send({ content: longContent })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('at most 200 characters');
    });

    it('should allow maximum ideas per user (4 for 2 participants)', async () => {
      const { ownerAgent, sessionId } = await setupSession();

      // Submit 4 ideas (max for 2 participants)
      await ownerAgent.post(`/api/sessions/${sessionId}/ideas`).send({ content: 'Idea 1' }).expect(201);
      await ownerAgent.post(`/api/sessions/${sessionId}/ideas`).send({ content: 'Idea 2' }).expect(201);
      await ownerAgent.post(`/api/sessions/${sessionId}/ideas`).send({ content: 'Idea 3' }).expect(201);
      await ownerAgent.post(`/api/sessions/${sessionId}/ideas`).send({ content: 'Idea 4' }).expect(201);

      // 5th idea should be rejected
      const response = await ownerAgent
        .post(`/api/sessions/${sessionId}/ideas`)
        .send({ content: 'Idea 5' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('can only submit up to 4 ideas');
    });

    it('should allow different users to submit ideas independently', async () => {
      const { ownerAgent, participantAgent, sessionId } = await setupSession();

      await ownerAgent.post(`/api/sessions/${sessionId}/ideas`).send({ content: 'Owner idea' }).expect(201);
      await participantAgent.post(`/api/sessions/${sessionId}/ideas`).send({ content: 'Participant idea' }).expect(201);

      // Both should succeed
      const response = await ownerAgent.get(`/api/sessions/${sessionId}/ideas`).expect(200);
      expect(response.body.data.ideas.length).toBe(2);
    });

    it('should require authentication', async () => {
      const { sessionId } = await setupSession();

      await request(app)
        .post(`/api/sessions/${sessionId}/ideas`)
        .send({ content: 'Test idea' })
        .expect(401);
    });

    it('should reject when session not in SUBMITTING_IDEAS state', async () => {
      const ownerAgent = await loginUser(app, 'Owner');
      const createResponse = await ownerAgent.post('/api/sessions').expect(201);
      const sessionId = createResponse.body.data.session.id;

      // Session is in WAITING state
      const response = await ownerAgent
        .post(`/api/sessions/${sessionId}/ideas`)
        .send({ content: 'Test idea' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not in the idea submission phase');
    });

    it('should reject empty content', async () => {
      const { ownerAgent, sessionId } = await setupSession();

      const response = await ownerAgent
        .post(`/api/sessions/${sessionId}/ideas`)
        .send({ content: '' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/sessions/:id/ideas', () => {
    it('should return all ideas for session', async () => {
      const { ownerAgent, participantAgent, sessionId } = await setupSession();

      // Submit ideas
      await ownerAgent.post(`/api/sessions/${sessionId}/ideas`).send({ content: 'Idea 1' });
      await ownerAgent.post(`/api/sessions/${sessionId}/ideas`).send({ content: 'Idea 2' });
      await participantAgent.post(`/api/sessions/${sessionId}/ideas`).send({ content: 'Idea 3' });

      const response = await ownerAgent
        .get(`/api/sessions/${sessionId}/ideas`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.ideas).toBeDefined();
      expect(response.body.data.ideas.length).toBe(3);
      expect(response.body.data.ideas[0].author_name).toBeDefined();
    });

    it('should return empty array when no ideas', async () => {
      const { ownerAgent, sessionId } = await setupSession();

      const response = await ownerAgent
        .get(`/api/sessions/${sessionId}/ideas`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.ideas).toEqual([]);
    });

    it('should require authentication', async () => {
      const { sessionId } = await setupSession();

      await request(app)
        .get(`/api/sessions/${sessionId}/ideas`)
        .expect(401);
    });

    it('should return 500 for non-existent session', async () => {
      const agent = await loginUser(app);

      await agent
        .get('/api/sessions/non-existent/ideas')
        .expect(500);
    });
  });

  describe('GET /api/sessions/:id/ideas/mine', () => {
    it('should return only current user\'s ideas', async () => {
      const { ownerAgent, participantAgent, sessionId } = await setupSession();

      // Submit ideas
      await ownerAgent.post(`/api/sessions/${sessionId}/ideas`).send({ content: 'Owner Idea 1' });
      await ownerAgent.post(`/api/sessions/${sessionId}/ideas`).send({ content: 'Owner Idea 2' });
      await participantAgent.post(`/api/sessions/${sessionId}/ideas`).send({ content: 'Participant Idea' });

      const response = await ownerAgent
        .get(`/api/sessions/${sessionId}/ideas/mine`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.ideas.length).toBe(2);
      expect(response.body.data.ideas.every(idea => idea.content.startsWith('Owner'))).toBe(true);
    });

    it('should return empty array if user has no ideas', async () => {
      const { ownerAgent, sessionId } = await setupSession();

      const response = await ownerAgent
        .get(`/api/sessions/${sessionId}/ideas/mine`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.ideas).toEqual([]);
    });

    it('should require authentication', async () => {
      const { sessionId } = await setupSession();

      await request(app)
        .get(`/api/sessions/${sessionId}/ideas/mine`)
        .expect(401);
    });
  });

  describe('Idea count endpoint', () => {
    it('should return correct idea count', async () => {
      const { ownerAgent, participantAgent, sessionId } = await setupSession();

      // Submit 3 ideas
      await ownerAgent.post(`/api/sessions/${sessionId}/ideas`).send({ content: 'Idea 1' });
      await participantAgent.post(`/api/sessions/${sessionId}/ideas`).send({ content: 'Idea 2' });
      await ownerAgent.post(`/api/sessions/${sessionId}/ideas`).send({ content: 'Idea 3' });

      const response = await ownerAgent.get(`/api/sessions/${sessionId}/ideas`).expect(200);
      expect(response.body.data.ideas.length).toBe(3);
    });
  });

  describe('Max ideas per user', () => {
    it('should adjust max ideas when participants are added', async () => {
      const ownerAgent = await loginUser(app, 'Owner');
      const participant1Agent = await loginUser(app, 'Participant 1');
      const participant2Agent = await loginUser(app, 'Participant 2');
      const participant3Agent = await loginUser(app, 'Participant 3');
      const participant4Agent = await loginUser(app, 'Participant 4');

      const createResponse = await ownerAgent.post('/api/sessions').expect(201);
      const sessionId = createResponse.body.data.session.id;
      const sessionCode = createResponse.body.data.session.code;

      // Add participants (total 5)
      await participant1Agent.post('/api/sessions/join').send({ code: sessionCode });
      await participant2Agent.post('/api/sessions/join').send({ code: sessionCode });
      await participant3Agent.post('/api/sessions/join').send({ code: sessionCode });
      await participant4Agent.post('/api/sessions/join').send({ code: sessionCode });

      await ownerAgent.post(`/api/sessions/${sessionId}/start`);

      // With 5 participants, max is 2 ideas
      await ownerAgent.post(`/api/sessions/${sessionId}/ideas`).send({ content: 'Idea 1' }).expect(201);
      await ownerAgent.post(`/api/sessions/${sessionId}/ideas`).send({ content: 'Idea 2' }).expect(201);

      // 3rd idea should fail
      const response = await ownerAgent
        .post(`/api/sessions/${sessionId}/ideas`)
        .send({ content: 'Idea 3' })
        .expect(400);

      expect(response.body.error).toContain('can only submit up to 2 ideas');
    });
  });
});
