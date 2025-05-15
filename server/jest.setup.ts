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