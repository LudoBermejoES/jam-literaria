/**
 * Test database utilities
 * This module provides database access for tests using the in-memory database
 */

/**
 * Get the database instance (test or production)
 * @returns {DatabaseSync} Database instance
 */
export function getDatabase() {
  // In test environment, use the global test database
  if (process.env.NODE_ENV === 'test' && global.testDatabase) {
    return global.testDatabase;
  }

  // Otherwise, use the regular database
  const { getDatabase: getProductionDb } = require('./db.js');
  return getProductionDb();
}

/**
 * Initialize database - no-op in tests (handled by setup.js)
 */
export function initDatabase() {
  if (process.env.NODE_ENV === 'test') {
    return getDatabase();
  }

  const { initDatabase: initProductionDb } = require('./db.js');
  return initProductionDb();
}

/**
 * Close database - no-op in tests (handled by setup.js)
 */
export function closeDatabase() {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  const { closeDatabase: closeProductionDb } = require('./db.js');
  return closeProductionDb();
}
