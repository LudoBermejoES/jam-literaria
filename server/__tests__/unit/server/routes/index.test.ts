import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import router from '../../../../routes/index';

// Mock the auth and session routes
jest.mock('../../../../routes/auth', () => {
  const mockRouter = express.Router();
  mockRouter.get('/test', (req, res) => {
    res.status(200).json({ route: 'auth-test' });
  });
  return mockRouter;
});

jest.mock('../../../../routes/sessions', () => {
  const mockRouter = express.Router();
  mockRouter.get('/test', (req, res) => {
    res.status(200).json({ route: 'sessions-test' });
  });
  return mockRouter;
});

describe('Main Router', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use('/api', router);
  });

  it('should route to auth correctly', async () => {
    const response = await request(app).get('/api/auth/test');
    
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ route: 'auth-test' });
  });

  it('should route to sessions correctly', async () => {
    const response = await request(app).get('/api/sessions/test');
    
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ route: 'sessions-test' });
  });

  it('should return 404 for unknown routes', async () => {
    const response = await request(app).get('/api/unknown');
    
    expect(response.status).toBe(404);
  });
}); 