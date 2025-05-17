const { v4: uuidv4 } = require('uuid');
const db = require('../lib/db');

/**
 * Create a new user
 * @param {string} name - User's name
 * @returns {Promise<Object>} - Created user
 */
async function createUser(name) {
  if (!name || name.trim() === '') {
    throw new Error('User name is required');
  }

  const id = uuidv4();
  const now = new Date().toISOString();
  
  db.run(
    'INSERT INTO users (id, name, created_at, last_active) VALUES (?, ?, ?, ?)',
    [id, name, now, now]
  );
  
  return getUserById(id);
}

/**
 * Get a user by ID
 * @param {string} id - User ID
 * @returns {Promise<Object|null>} - User or null if not found
 */
async function getUserById(id) {
  return db.get('SELECT * FROM users WHERE id = ?', [id]);
}

/**
 * Get a user by name (exact match)
 * @param {string} name - User name
 * @returns {Promise<Object|null>} - User or null if not found
 */
async function getUserByName(name) {
  return db.get('SELECT * FROM users WHERE name = ?', [name]);
}

/**
 * Update a user's last active timestamp
 * @param {string} id - User ID
 * @returns {Promise<boolean>} - True if successful
 */
async function updateUserActivity(id) {
  const now = new Date().toISOString();
  const result = db.run(
    'UPDATE users SET last_active = ? WHERE id = ?',
    [now, id]
  );
  
  return result.changes > 0;
}

/**
 * Update a user's name
 * @param {string} id - User ID
 * @param {string} name - New name
 * @returns {Promise<Object|null>} - Updated user or null if not found
 */
async function updateUserName(id, name) {
  if (!name || name.trim() === '') {
    throw new Error('User name is required');
  }
  
  const result = db.run(
    'UPDATE users SET name = ? WHERE id = ?',
    [name, id]
  );
  
  if (result.changes === 0) {
    return null;
  }
  
  return getUserById(id);
}

/**
 * Get all users in a session
 * @param {string} sessionId - Session ID
 * @returns {Promise<Array>} - Array of users
 */
async function getUsersBySession(sessionId) {
  return db.all(`
    SELECT u.* 
    FROM users u
    JOIN session_participants sp ON u.id = sp.user_id
    WHERE sp.session_id = ?
  `, [sessionId]);
}

/**
 * Check if a user exists in a session
 * @param {string} userId - User ID
 * @param {string} sessionId - Session ID
 * @returns {Promise<boolean>} - True if user is in session
 */
async function isUserInSession(userId, sessionId) {
  const result = db.get(`
    SELECT 1 
    FROM session_participants 
    WHERE user_id = ? AND session_id = ?
  `, [userId, sessionId]);
  
  return !!result;
}

module.exports = {
  createUser,
  getUserById,
  getUserByName,
  updateUserActivity,
  updateUserName,
  getUsersBySession,
  isUserInSession
}; 