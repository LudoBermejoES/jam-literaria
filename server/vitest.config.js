import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'coverage/**',
        'scripts/**',
        '**/*.config.js',
        '**/dist/**',
        'tests/**'
      ]
    },
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/models/db.test.js' // Utility file, not a test suite
    ],
    setupFiles: ['./tests/setup.js'],
    testTimeout: 10000,
    hookTimeout: 10000
  }
});
