const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

// Mock the main db module
jest.mock('../../src/lib/db');

let testDb = null;

/**
 * Setup an in-memory SQLite database for testing
 * @returns {Object} - Database connection
 */
const setupTestDb = async () => {
  // Create in-memory database
  testDb = new Database(':memory:');
  
  // Load and execute schema SQL
  const schema = fs.readFileSync(
    path.join(__dirname, '../../database/schema.sql'),
    'utf8'
  );
  
  // Split on semicolons to get individual statements
  const statements = schema.split(';').filter(stmt => stmt.trim());
  
  // Execute each statement
  for (const stmt of statements) {
    testDb.exec(stmt);
  }
  
  // Override db module methods with test versions
  const dbModule = require('../../src/lib/db');
  
  dbModule.getConnection.mockReturnValue(testDb);
  
  dbModule.get.mockImplementation((sql, params = []) => {
    return testDb.prepare(sql).get(params);
  });
  
  dbModule.all.mockImplementation((sql, params = []) => {
    return testDb.prepare(sql).all(params);
  });
  
  dbModule.run.mockImplementation((sql, params = []) => {
    return testDb.prepare(sql).run(params);
  });
  
  dbModule.transaction.mockImplementation((callback) => {
    return testDb.transaction(callback)();
  });
  
  return testDb;
};

/**
 * Teardown the test database
 */
const teardownTestDb = async () => {
  if (testDb) {
    testDb.close();
    testDb = null;
  }
};

/**
 * Helper to insert test data
 * @param {string} table - Table name
 * @param {Object|Array} data - Data to insert
 * @returns {Array} - Inserted records
 */
const insertTestData = (table, data) => {
  const items = Array.isArray(data) ? data : [data];
  const results = [];
  
  items.forEach(item => {
    const columns = Object.keys(item);
    const placeholders = columns.map(() => '?').join(', ');
    const values = columns.map(col => item[col]);
    
    const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
    const result = testDb.prepare(sql).run(values);
    
    results.push({
      ...item,
      id: result.lastInsertRowid || item.id
    });
  });
  
  return results;
};

module.exports = {
  setupTestDb,
  teardownTestDb,
  insertTestData
}; 