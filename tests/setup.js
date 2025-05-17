// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DB_PATH = ':memory:';

// Silence console logs during tests unless needed
if (!process.env.DEBUG) {
  global.console = {
    ...console,
    log: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

// Add global test helpers if needed
global.testHelpers = {
  // Helper functions can be added here
}; 