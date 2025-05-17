const path = require('path');
const Database = require('better-sqlite3');

let db = null;

/**
 * Gets a database connection, creating one if it doesn't exist
 * @returns {Object} - Database connection
 */
function getConnection() {
  if (!db) {
    const dbPath = process.env.DB_PATH || path.join(__dirname, '../../database/jam-literaria.db');
    db = new Database(dbPath, { verbose: process.env.NODE_ENV === 'development' ? console.log : null });
    setupDb();
  }
  return db;
}

/**
 * Closes the database connection
 */
function closeConnection() {
  if (db) {
    db.close();
    db = null;
  }
}

/**
 * Sets up pragmas and functions for the database
 */
function setupDb() {
  // Set pragmas for better performance
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  
  // Register functions if needed
  // db.function('my_function', (x) => {...});
}

/**
 * Executes a SELECT query that returns a single row
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Object|null} - Result row or null
 */
function get(sql, params = []) {
  const connection = getConnection();
  return connection.prepare(sql).get(params);
}

/**
 * Executes a SELECT query that returns multiple rows
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Array} - Result rows
 */
function all(sql, params = []) {
  const connection = getConnection();
  return connection.prepare(sql).all(params);
}

/**
 * Executes an INSERT, UPDATE, or DELETE query
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Object} - Result info
 */
function run(sql, params = []) {
  const connection = getConnection();
  return connection.prepare(sql).run(params);
}

/**
 * Executes multiple statements in a transaction
 * @param {Function} callback - Transaction function
 * @returns {*} - Result of the transaction
 */
function transaction(callback) {
  const connection = getConnection();
  return connection.transaction(callback)();
}

module.exports = {
  getConnection,
  closeConnection,
  get,
  all,
  run,
  transaction
}; 