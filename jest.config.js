module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // File patterns
  testMatch: ['**/tests/**/*.test.js'],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/public/**/*.js'
  ],
  coverageDirectory: 'coverage',
  
  // Setup files
  setupFilesAfterEnv: ['./tests/setup.js'],
  
  // Timeouts
  testTimeout: 10000,
  
  // Other options
  verbose: true,
  forceExit: true,
  clearMocks: true,
  restoreMocks: true,
}; 