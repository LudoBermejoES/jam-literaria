import express from 'express';

// Mock express and its router
jest.mock('express', () => {
  const mockRouter = {
    use: jest.fn().mockReturnThis(),
  };
  
  return {
    Router: jest.fn(() => mockRouter)
  };
});

// Mock the route modules
jest.mock('../../../../routes/auth', () => 'mockAuthRoutes');
jest.mock('../../../../routes/sessions', () => 'mockSessionRoutes');

describe('API Routes Configuration', () => {
  it('should mount all route modules correctly', () => {
    // Import the router to test
    const router = require('../../../../routes/index').default;
    
    // Get the mocked router
    const mockRouter = express.Router();
    
    // Verify that both auth and session routes are mounted
    expect(mockRouter.use).toHaveBeenCalledWith('/auth', 'mockAuthRoutes');
    expect(mockRouter.use).toHaveBeenCalledWith('/sessions', 'mockSessionRoutes');
  });
}); 