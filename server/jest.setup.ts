// This file is used to set up the Jest environment for TypeScript
// It ensures that TypeScript types for Jest are properly recognized

// Global augmentation to avoid TS errors with Jest globals
declare global {
  namespace NodeJS {
    interface Global {
      expect: typeof import('expect');
      jest: typeof import('@jest/globals')['jest'];
      describe: typeof import('@jest/globals')['describe'];
      it: typeof import('@jest/globals')['it'];
      beforeEach: typeof import('@jest/globals')['beforeEach'];
      afterEach: typeof import('@jest/globals')['afterEach'];
      beforeAll: typeof import('@jest/globals')['beforeAll'];
      afterAll: typeof import('@jest/globals')['afterAll'];
    }
  }
}

export {};

// Load environment variables for testing
import dotenv from 'dotenv';
dotenv.config();

// Import prisma client 
import prisma from './lib/prisma';

// Set the NODE_ENV to test by default
process.env.NODE_ENV = process.env.NODE_ENV || 'test';

// Helper for mocking Prisma in tests
export const getMockPrismaClient = () => {
  return {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
    },
    session: {
      findUnique: jest.fn((params) => {
        // Default find implementation for unit tests that need a session
        if (params?.where?.id === 'test-session') {
          return Promise.resolve({
            id: 'test-session',
            code: 'TEST123',
            ownerId: 'owner-id',
            status: 'WAITING',
            participants: [{ id: 'owner-id', name: 'Owner' }],
            ideas: [] // Empty by default, tests can override this
          });
        }
        return Promise.resolve(null);
      }),
      findFirst: jest.fn((params) => {
        // Match the session ID for easier testing
        if (params?.where?.id === 'session-id' && params?.where?.ownerId === 'user-id') {
          return Promise.resolve({
            id: 'session-id',
            ownerId: 'user-id',
            name: 'Test Session'
          });
        }
        return Promise.resolve(null);
      }),
      create: jest.fn(),
      update: jest.fn()
    },
    idea: {
      findMany: jest.fn(),
    },
    vote: {
      findMany: jest.fn(),
      groupBy: jest.fn()
    }
  };
};

// Mock users to be available for all tests
const seedTestDatabase = async () => {
  try {
    console.log('Seeding test database with users...');
    
    // Create test users
    await prisma.user.create({
      data: {
        id: 'user123',
        name: 'Test User',
      }
    });

    await prisma.user.create({
      data: {
        id: 'user456',
        name: 'Another User',
      }
    });

    await prisma.user.create({
      data: {
        id: 'owner-user-id',
        name: 'Owner',
      }
    });

    await prisma.user.create({
      data: {
        id: 'participant-user-id',
        name: 'Participant',
      }
    });

    // Create test owner
    await prisma.user.create({
      data: {
        id: 'owner-id',
        name: 'Session Owner',
      }
    });

    console.log('Test database seeded successfully');
  } catch (error) {
    // Ignore errors if users already exist
    console.log('Seed error (can be ignored if users already exist):', error);
  }
};

// Clean up database after tests
const cleanupTestDatabase = async () => {
  // Don't actually delete data - tests are using mocks
  // Just for demonstration purposes
  console.log('Test cleanup would run here');
};

// Run before all tests
beforeAll(async () => {
  // Seed the database with test users if not using mocks
  if (process.env.NODE_ENV !== 'test') {
    await seedTestDatabase();
  }
});

// Run after all tests
afterAll(async () => {
  // Clean up test data after tests if not using mocks
  if (process.env.NODE_ENV !== 'test') {
    await cleanupTestDatabase();
  }
  
  // Close database connection
  await prisma.$disconnect();
}); 