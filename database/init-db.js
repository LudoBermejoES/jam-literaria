const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

/**
 * Initializes the database with the schema
 * @param {string} dbPath - Path to database file
 * @returns {Object} - Database connection
 */
function initDatabase(dbPath = path.join(__dirname, 'jam-literaria.db')) {
  // Create database directory if it doesn't exist
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Connect to SQLite database
  const db = new Database(dbPath);
  
  // Load and execute schema SQL
  const schema = fs.readFileSync(
    path.join(__dirname, 'schema.sql'),
    'utf8'
  );
  
  // Split on semicolons to get individual statements
  const statements = schema.split(';').filter(stmt => stmt.trim());
  
  // Execute each statement
  for (const stmt of statements) {
    db.exec(stmt);
  }
  
  console.info('Database initialized successfully.');
  return db;
}

// If this script is run directly, initialize the database
if (require.main === module) {
  initDatabase();
}

module.exports = { initDatabase }; 