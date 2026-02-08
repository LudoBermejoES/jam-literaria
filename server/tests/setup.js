import { beforeAll, afterAll, beforeEach } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use an in-memory database for tests
let testDb = null;

beforeAll(() => {
  // Set test environment
  process.env.NODE_ENV = 'test';

  // Create in-memory database using native Node.js SQLite
  testDb = new DatabaseSync(':memory:', {
    enableForeignKeyConstraints: true
  });

  // Read and execute schema
  const schemaPath = path.join(__dirname, '../../database/schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  // Execute schema
  testDb.exec(schema);

  // Make test database available globally for models
  global.testDatabase = testDb;
});

afterAll(() => {
  if (testDb) {
    testDb.close();
    global.testDatabase = null;
  }
});

// Reset database before each test
beforeEach(() => {
  if (!testDb) return;

  // Clear all tables in correct order (respecting foreign keys)
  testDb.exec('DELETE FROM votes');
  testDb.exec('DELETE FROM ideas');
  testDb.exec('DELETE FROM session_participants');
  testDb.exec('DELETE FROM session_metadata');
  testDb.exec('DELETE FROM sessions');
  testDb.exec('DELETE FROM users');
});
