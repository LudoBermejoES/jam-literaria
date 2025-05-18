const { v4: uuidv4 } = require('uuid');
const db = require('../lib/db');

/**
 * Create a new idea
 * @param {string} content - The content of the idea
 * @param {string} authorId - The author's user ID
 * @param {string} sessionId - The session ID
 * @returns {Promise<Object>} - Created idea
 */
async function createIdea(content, authorId, sessionId) {
  const id = uuidv4();
  const now = new Date().toISOString();
  
  db.run(
    'INSERT INTO ideas (id, content, author_id, session_id, created_at) VALUES (?, ?, ?, ?, ?)',
    [id, content, authorId, sessionId, now]
  );
  
  return getIdea(id);
}

/**
 * Get an idea by ID
 * @param {string} id - Idea ID
 * @returns {Promise<Object|null>} - Idea or null if not found
 */
async function getIdea(id) {
  return db.get('SELECT * FROM ideas WHERE id = ?', [id]);
}

/**
 * Get all ideas for a session
 * @param {string} sessionId - Session ID
 * @returns {Promise<Array>} - Array of idea objects
 */
async function getIdeasBySession(sessionId) {
  return db.all(`
    SELECT i.*, u.name as author_name
    FROM ideas i
    JOIN users u ON i.author_id = u.id
    WHERE i.session_id = ?
    ORDER BY i.created_at ASC
  `, [sessionId]);
}

/**
 * Get ideas by author in a session
 * @param {string} sessionId - Session ID
 * @param {string} authorId - Author's user ID
 * @returns {Promise<Array>} - Array of idea objects
 */
async function getIdeasByAuthor(sessionId, authorId) {
  return db.all(`
    SELECT i.*, u.name as author_name
    FROM ideas i
    JOIN users u ON i.author_id = u.id
    WHERE i.session_id = ? AND i.author_id = ?
    ORDER BY i.created_at ASC
  `, [sessionId, authorId]);
}

/**
 * Count ideas for a session
 * @param {string} sessionId - Session ID
 * @returns {Promise<number>} - Number of ideas
 */
async function countIdeasInSession(sessionId) {
  const result = await db.get('SELECT COUNT(*) as count FROM ideas WHERE session_id = ?', [sessionId]);
  return result.count;
}

/**
 * Count ideas by a specific author in a session
 * @param {string} sessionId - Session ID
 * @param {string} authorId - Author's user ID
 * @returns {Promise<number>} - Number of ideas
 */
async function countIdeasByAuthor(sessionId, authorId) {
  const result = await db.get(
    'SELECT COUNT(*) as count FROM ideas WHERE session_id = ? AND author_id = ?', 
    [sessionId, authorId]
  );
  return result.count;
}

/**
 * Delete an idea
 * @param {string} id - Idea ID
 * @param {string} authorId - Author's user ID (for verification)
 * @returns {Promise<boolean>} - True if successful
 */
async function deleteIdea(id, authorId) {
  const result = db.run(
    'DELETE FROM ideas WHERE id = ? AND author_id = ?',
    [id, authorId]
  );
  
  return result.changes > 0;
}

module.exports = {
  createIdea,
  getIdea,
  getIdeasBySession,
  getIdeasByAuthor,
  countIdeasInSession,
  countIdeasByAuthor,
  deleteIdea
}; 