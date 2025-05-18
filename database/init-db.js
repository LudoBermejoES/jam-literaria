const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');

// Path to the database file
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'jam-literaria.db');

/**
 * Initializes the database with the schema
 * @param {string} dbPath - Path to database file
 * @returns {Promise<Object>} - Database connection
 */
async function initDatabase(dbPath = DB_PATH) {
  try {
    // Create database directory if it doesn't exist
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    // Create/connect to SQLite database
    const db = new DatabaseSync(dbPath, {
      enableForeignKeyConstraints: true
    });
    
    // Load and execute schema SQL
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
    console.info('Database initialized successfully.');
    
    return db;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// If this script is run directly, initialize the database
if (require.main === module) {
  initDatabase().then(db => {
    // Close the database connection
    db.close();
  }).catch(err => {
    console.error('Database initialization failed:', err);
    process.exit(1);
  });
}

module.exports = { initDatabase }; 