const path = require('path');
const { DatabaseSync } = require('node:sqlite');

let db = null;

/**
 * Gets a database connection, creating one if it doesn't exist
 * @returns {Object} - Database connection
 */
function getConnection() {
  if (!db) {
    const dbPath = process.env.DB_PATH || path.join(__dirname, '../../database/jam-literaria.db');
    
    try {
      db = new DatabaseSync(dbPath, {
        enableForeignKeyConstraints: true
      });
      
      // Initialize schema if needed
      setupDb();
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Connected to SQLite database successfully');
      }
    } catch (error) {
      console.error('Database connection error:', error);
      throw error;
    }
  }
  return db;
}

/**
 * Closes the database connection
 */
function closeConnection() {
  if (db) {
    try {
      db.close();
      if (process.env.NODE_ENV === 'development') {
        console.log('Database connection closed');
      }
    } catch (error) {
      console.error('Error closing database:', error);
    } finally {
      db = null;
    }
  }
}

/**
 * Sets up database schema if needed
 */
function setupDb() {
  const schemaSQL = `
    -- Usuarios
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Sesiones
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'WAITING',
      current_round INTEGER DEFAULT 0,
      owner_id TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id)
    );
    
    -- Relación Usuarios-Sesiones (para participantes)
    CREATE TABLE IF NOT EXISTS session_participants (
      session_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      PRIMARY KEY (session_id, user_id),
      FOREIGN KEY (session_id) REFERENCES sessions(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    
    -- Ideas
    CREATE TABLE IF NOT EXISTS ideas (
      id TEXT PRIMARY KEY,
      content TEXT NOT NULL,
      author_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (author_id) REFERENCES users(id),
      FOREIGN KEY (session_id) REFERENCES sessions(id)
    );
    
    -- Votos
    CREATE TABLE IF NOT EXISTS votes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      idea_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      round INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (user_id, idea_id, round, session_id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (idea_id) REFERENCES ideas(id),
      FOREIGN KEY (session_id) REFERENCES sessions(id)
    );
    
    -- Sesión Metadata (para almacenar información adicional de sesión)
    CREATE TABLE IF NOT EXISTS session_metadata (
      session_id TEXT PRIMARY KEY,
      ideas_elegidas TEXT, -- JSON array of idea IDs
      ideas_candidatas TEXT, -- JSON array of idea IDs
      mensaje_ronda TEXT,
      mensaje_final TEXT,
      FOREIGN KEY (session_id) REFERENCES sessions(id)
    );
  `;
  
  db.exec(schemaSQL);
}

/**
 * Executes a SELECT query that returns a single row
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Object|null>} - Result row or null
 */
async function get(sql, params = []) {
  try {
    const connection = getConnection();
    const stmt = connection.prepare(sql);
    const result = stmt.get(...params);
    return result || null;
  } catch (error) {
    console.error('Error in get operation:', error);
    throw error;
  }
}

/**
 * Executes a SELECT query that returns multiple rows
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>} - Result rows
 */
async function all(sql, params = []) {
  try {
    const connection = getConnection();
    const stmt = connection.prepare(sql);
    const results = stmt.all(...params);
    return results || [];
  } catch (error) {
    console.error('Error in all operation:', error);
    throw error;
  }
}

/**
 * Executes an INSERT, UPDATE, or DELETE query
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} - Result info with lastID and changes properties
 */
async function run(sql, params = []) {
  try {
    const connection = getConnection();
    const stmt = connection.prepare(sql);
    const { changes } = stmt.run(...params);
    
    // For INSERT statements, get the last inserted ID
    let lastID = null;
    if (sql.trim().toUpperCase().startsWith('INSERT')) {
      lastID = connection.prepare('SELECT last_insert_rowid() as id').get().id;
    }
    
    return { lastID, changes };
  } catch (error) {
    console.error('Error in run operation:', error);
    throw error;
  }
}

/**
 * Executes multiple statements in a transaction
 * @param {Function} callback - Transaction function
 * @returns {Promise<any>} - Result of the transaction
 */
async function transaction(callback) {
  const connection = getConnection();
  
  try {
    connection.exec('BEGIN TRANSACTION');
    const result = await callback(connection);
    connection.exec('COMMIT');
    return result;
  } catch (error) {
    console.error('Transaction error:', error);
    connection.exec('ROLLBACK');
    throw error;
  }
}

module.exports = {
  getConnection,
  closeConnection,
  get,
  all,
  run,
  transaction
}; 