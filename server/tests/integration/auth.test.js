import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp } from './setup.js';

describe('Auth API Integration Tests', () => {
  let app;

  beforeEach(() => {
    app = createTestApp();
  });

  describe('POST /api/auth/register', () => {
    it('should create a new user and return session', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ name: 'John Doe' })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.name).toBe('John Doe');
      expect(response.body.data.user.id).toBeDefined();
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should return existing user if name already exists', async () => {
      // First registration
      const response1 = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Jane Doe' })
        .expect(201);

      const userId1 = response1.body.data.user.id;

      // Second registration with same name
      const response2 = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Jane Doe' })
        .expect(201);

      const userId2 = response2.body.data.user.id;

      // Should return same user
      expect(userId1).toBe(userId2);
    });

    it('should reject registration without name', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('obligatorio');
    });

    it('should reject registration with empty name', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ name: '' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('obligatorio');
    });

    it('should reject registration with whitespace-only name', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ name: '   ' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should trim whitespace from name', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ name: '  Trimmed Name  ' })
        .expect(201);

      expect(response.body.data.user.name).toBe('Trimmed Name');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user when authenticated', async () => {
      const agent = request.agent(app);

      // Register first
      await agent
        .post('/api/auth/register')
        .send({ name: 'Current User' })
        .expect(201);

      // Get current user
      const response = await agent
        .get('/api/auth/me')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.name).toBe('Current User');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Unauthorized');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout user and clear session', async () => {
      const agent = request.agent(app);

      // Register first
      await agent
        .post('/api/auth/register')
        .send({ name: 'Logout User' })
        .expect(201);

      // Logout
      const logoutResponse = await agent
        .post('/api/auth/logout')
        .expect(200);

      expect(logoutResponse.body.success).toBe(true);

      // Verify session is cleared
      const meResponse = await agent
        .get('/api/auth/me')
        .expect(401);

      expect(meResponse.body.success).toBe(false);
    });

    it('should handle logout when not logged in', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Session persistence', () => {
    it('should maintain session across requests', async () => {
      const agent = request.agent(app);

      // Register
      await agent
        .post('/api/auth/register')
        .send({ name: 'Session User' })
        .expect(201);

      // Multiple requests should work
      await agent.get('/api/auth/me').expect(200);
      await agent.get('/api/auth/me').expect(200);
      await agent.get('/api/auth/me').expect(200);
    });

    it('should not share sessions between different agents', async () => {
      const agent1 = request.agent(app);
      const agent2 = request.agent(app);

      // Agent 1 registers
      await agent1
        .post('/api/auth/register')
        .send({ name: 'User 1' })
        .expect(201);

      // Agent 2 should not be authenticated
      await agent2.get('/api/auth/me').expect(401);
    });
  });
});
