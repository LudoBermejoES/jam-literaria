// This file is to help TypeScript recognize Jest globals in test files
// It's intended to complement @types/jest which you should install via npm

// Re-export the Jest namespace to make it globally available in test files
import 'jest';

// Make sure Jest functions are recognized globally for our test files
declare global {
  // Re-export all Jest functions as globals
  const jest: typeof import('jest');
  const describe: typeof import('@jest/globals').describe;
  const it: typeof import('@jest/globals').it;
  const test: typeof import('@jest/globals').test;
  const expect: typeof import('@jest/globals').expect;
  const beforeAll: typeof import('@jest/globals').beforeAll;
  const beforeEach: typeof import('@jest/globals').beforeEach;
  const afterAll: typeof import('@jest/globals').afterAll;
  const afterEach: typeof import('@jest/globals').afterEach;
} 