module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverage: false,
  resetMocks: false,
  restoreMocks: false,
  collectCoverageFrom: [
    '**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/coverage/**',
    '!**/generated/**',
    '!prisma/seed.ts',
    '!jest.config.js',
  ],
  coverageDirectory: 'coverage',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: [
    '**/__tests__/**/*.{js,jsx,ts,tsx}',
    '**/*.{spec,test}.{js,jsx,ts,tsx}',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  // Use ts-jest for TypeScript files
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { isolatedModules: true }]
  },
  // Ignore TypeScript errors for tests
  globals: {},
  // Configure different test environments for different paths
  projects: [
    {
      displayName: 'server',
      testEnvironment: 'node',
      testMatch: [
        '<rootDir>/__tests__/integration/**/*.test.{js,ts}',
        '<rootDir>/__tests__/unit/server/**/*.test.{js,ts}',
        '<rootDir>/__tests__/unit/lib/**/*.test.{js,ts}'
      ],
      testPathIgnorePatterns: [
        '/node_modules/',
        '/__tests__/unit/server/api/compiled/'
      ],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', { isolatedModules: true }]
      },
      // Skip TypeScript errors for these tests
      globals: {}
    },
    {
      displayName: 'client',
      testEnvironment: 'jsdom',
      testMatch: [
        '<rootDir>/__tests__/unit/client/**/*.test.{js,jsx,ts,tsx}'
      ],
      transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest'
      }
    }
  ]
}; 