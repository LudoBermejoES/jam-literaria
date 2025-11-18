import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DatabaseSync } from 'node:sqlite';

// Get directory name properly with ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, '../../database/jam_literaria.db');
const SCHEMA_PATH = path.join(__dirname, '../../database/schema.sql');

let database;

/**
 * Initialize the database
 * @returns {DatabaseSync} Database instance
 */
export function initDatabase() {
  try {
    database = new DatabaseSync(DB_PATH, {
      enableForeignKeyConstraints: true
    });
    
    // Create database directory if it doesn't exist
    const dbDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    // Apply schema if database is empty
    const tableCount = database.prepare("SELECT count(*) as count FROM sqlite_master WHERE type='table'").get().count;
    if (tableCount === 0) {
      const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
      database.exec(schema);
    }
    
    console.log(`Database initialized successfully at ${DB_PATH}`);
    return database;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

/**
 * Get the database instance
 * @returns {DatabaseSync} Database instance
 */
export function getDatabase() {
  // In test environment, use the global test database
  if (process.env.NODE_ENV === 'test' && global.testDatabase) {
    return global.testDatabase;
  }

  if (!database) {
    return initDatabase();
  }
  return database;
}

/**
 * Close the database connection
 */
export function closeDatabase() {
  if (database) {
    database.close();
    database = null;
    console.log('Database connection closed');
  }
} 