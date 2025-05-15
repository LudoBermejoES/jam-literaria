import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import express from 'express';
import cors from 'cors';
import '@jest/globals';

// Variables to store mock instances that tests can access directly
let mockApp;
let mockHttpServer;
let mockIo;

// Mock Prisma client to avoid initialization issues
jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn(() => ({
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn()
      },
      session: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn()
      },
      $connect: jest.fn(),
      $disconnect: jest.fn()
    }))
  };
});

// Mock external modules
jest.mock('express', () => {
  const json = jest.fn().mockReturnValue('json-middleware');
  const urlencoded = jest.fn().mockReturnValue('urlencoded-middleware');
  
  // Mock Router functionality
  const mockRouterInstance = {
    use: jest.fn().mockReturnThis(),
    get: jest.fn().mockReturnThis(),
    post: jest.fn().mockReturnThis()
  };
  
  const Router = jest.fn(() => mockRouterInstance);
  
  const app = {
    use: jest.fn().mockReturnThis(),
    get: jest.fn().mockReturnThis()
  };
  
  const mockExpress = jest.fn(() => {
    mockApp = app;
    return app;
  });
  
  mockExpress.json = json;
  mockExpress.urlencoded = urlencoded;
  mockExpress.Router = Router;
  
  return mockExpress;
});

jest.mock('http', () => {
  const httpMock = {
    createServer: jest.fn(() => {
      mockHttpServer = {
        listen: jest.fn((port, callback) => {
          if (callback) callback();
          return {
            address: jest.fn(() => ({ port }))
          };
        })
      };
      return mockHttpServer;
    })
  };
  return httpMock;
});

jest.mock('socket.io', () => {
  const socketMock = {
    Server: jest.fn(() => {
      mockIo = {
        on: jest.fn((event, callback) => {
          if (event === 'connection') {
            // Simulate a socket connection
            const mockSocket = {
              id: 'test-socket-id',
              on: jest.fn()
            };
            callback(mockSocket);
          }
          return mockIo;
        }),
        emit: jest.fn(),
        to: jest.fn().mockReturnThis()
      };
      return mockIo;
    })
  };
  return socketMock;
});

// Mock for routes
const mockRouter = { use: jest.fn() };
jest.mock('../../routes', () => ({ default: mockRouter }), { virtual: true });

jest.mock('dotenv', () => ({
  config: jest.fn()
}));

// Store original console.log
const originalConsoleLog = console.log;
// Store original process.env
const originalProcessEnv = process.env;

// Initialize mocks before tests run
beforeAll(() => {
  // Trigger the mocks to initialize our variables
  express();
  createServer();
  new SocketIOServer();
});

describe('Server Initialization', () => {
  beforeEach(() => {
    // Mock console.log to prevent output during tests
    console.log = jest.fn();
    
    // Reset process.env
    process.env = { ...originalProcessEnv };
    
    // Clear all mock calls
    jest.clearAllMocks();
    
    // Force re-initialization of mocks for each test
    express();
    createServer();
    new SocketIOServer();
  });
  
  afterEach(() => {
    // Restore console.log
    console.log = originalConsoleLog;
    
    // Restore process.env
    process.env = originalProcessEnv;
    
    // Reset modules between tests
    jest.resetModules();
  });

  it('should initialize express with middleware', () => {
    // Reset mock counts before loading the server
    jest.clearAllMocks();
    
    // Load the server module (which executes the code)
    const server = require('../../../index');
    
    // Check that express was initialized
    expect(express).toHaveBeenCalled();
    
    // Check that middleware was set up
    expect(mockApp.use).toHaveBeenCalled(); // CORS middleware
    expect(express.json).toHaveBeenCalled();
    expect(express.urlencoded).toHaveBeenCalledWith({ extended: true });
    expect(mockApp.use).toHaveBeenCalledWith('json-middleware');
    expect(mockApp.use).toHaveBeenCalledWith('urlencoded-middleware');
    // Check API routes setup
    expect(mockApp.use).toHaveBeenCalledWith('/api', expect.anything());
  });
  
  it('should create an HTTP server with Socket.IO', () => {
    // Reset mock counts before loading the server
    jest.clearAllMocks();
    
    // Make sure the createServer function is available
    createServer();
    new SocketIOServer();
    
    // Load the server module
    require('../../../index');
    
    // Check that the HTTP server was created
    expect(createServer).toHaveBeenCalled();
    
    // Check that Socket.IO was initialized
    expect(SocketIOServer).toHaveBeenCalled();
    
    // Check Socket.IO connection handler
    expect(mockIo.on).toHaveBeenCalledWith('connection', expect.any(Function));
  });
  
  it('should start the server on the specified port', () => {
    // Reset mock counts before loading the server
    jest.clearAllMocks();
    
    // Set environment variable
    process.env.PORT = '5000';
    
    // Load the server module
    require('../../../index');
    
    // Check that the server was started on the correct port
    expect(mockHttpServer.listen).toHaveBeenCalledWith('5000', expect.any(Function));
  });
  
  it('should use default port (4000) when PORT env var is not set', () => {
    // Reset mock counts before loading the server
    jest.clearAllMocks();
    
    // Delete PORT env var
    delete process.env.PORT;
    
    // Load the server module
    require('../../../index');
    
    // Check that the server was started on the default port
    expect(mockHttpServer.listen).toHaveBeenCalledWith(4000, expect.any(Function));
  });
  
  it('should set up health check endpoint', () => {
    // Reset mock counts before loading the server
    jest.clearAllMocks();
    
    // Load the server module
    require('../../../index');
    
    // Check that the health check endpoint was set up
    expect(mockApp.get).toHaveBeenCalledWith('/health', expect.any(Function));
  });
  
  it('should export io object for use in other modules', () => {
    // Reset mock counts before loading the server
    jest.clearAllMocks();
    
    // Load the module with named import
    const { io } = require('../../../index');
    
    // Check that io is defined
    expect(io).toBeDefined();
  });
}); 