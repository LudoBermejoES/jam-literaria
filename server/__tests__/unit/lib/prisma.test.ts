import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Mock the generated prisma client
jest.mock('../../../generated/prisma', () => {
  const mockPrismaClient = jest.fn().mockImplementation(() => ({
    // Mock the methods you need
    user: {
      findMany: jest.fn(),
      create: jest.fn()
    },
    session: {
      findUnique: jest.fn(),
      create: jest.fn()
    }
  }));

  return {
    PrismaClient: mockPrismaClient
  };
});

// Mock console.log to avoid noise in tests
const originalConsoleLog = console.log;
beforeEach(() => {
  console.log = jest.fn();
});

afterEach(() => {
  console.log = originalConsoleLog;
  // Clear the mocked prisma global
  if (global.prisma) {
    delete global.prisma;
  }
});

describe('Prisma Client Singleton', () => {
  it('should create a singleton instance of PrismaClient', () => {
    // First import should create a new instance
    const prisma1 = require('../../../lib/prisma').default;
    
    // Second import should reuse the same instance
    const prisma2 = require('../../../lib/prisma').default;
    
    // Both imports should return the same instance
    expect(prisma1).toBe(prisma2);
  });

  it('should log the database URL', () => {
    // Force re-import to trigger the console.log
    jest.isolateModules(() => {
      require('../../../lib/prisma');
      expect(console.log).toHaveBeenCalledWith(
        'Database URL from env:', 
        expect.any(String)
      );
    });
  });
}); 