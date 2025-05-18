const { v4: uuidv4 } = require('uuid');
const db = require('../lib/db');
const { generateSessionCode } = require('../lib/utils');

/**
 * Create a new session
 * @param {string} ownerId - Owner's user ID
 * @returns {Promise<Object>} - Created session
 */
async function createSession(ownerId) {
  const id = uuidv4();
  const code = await generateSessionCode();
  const now = new Date().toISOString();
  
  // Insert session record
  db.run(
    'INSERT INTO sessions (id, code, owner_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
    [id, code, ownerId, now, now]
  );
  
  // Add owner as participant
  db.run(
    'INSERT INTO session_participants (session_id, user_id) VALUES (?, ?)',
    [id, ownerId]
  );
  
  return getSession(id);
}

/**
 * Get a session by ID
 * @param {string} id - Session ID
 * @returns {Promise<Object|null>} - Session or null if not found
 */
async function getSession(id) {
  return db.get('SELECT * FROM sessions WHERE id = ?', [id]);
}

/**
 * Get a session by code
 * @param {string} code - Session code
 * @returns {Promise<Object|null>} - Session or null if not found
 */
async function getSessionByCode(code) {
  return db.get('SELECT * FROM sessions WHERE code = ?', [code]);
}

/**
 * Get all participants in a session
 * @param {string} sessionId - Session ID
 * @returns {Promise<Array>} - Array of user objects
 */
async function getParticipants(sessionId) {
  return db.all(`
    SELECT u.* 
    FROM users u
    JOIN session_participants sp ON u.id = sp.user_id
    WHERE sp.session_id = ?
  `, [sessionId]);
}

/**
 * Get new participants who joined after the specified time
 * @param {string} sessionId - Session ID
 * @param {string} since - ISO timestamp to check after
 * @returns {Promise<Array>} - Array of new participants
 */
async function getNewParticipants(sessionId, since) {
  return db.all(`
    SELECT u.* 
    FROM users u
    JOIN session_participants sp ON u.id = sp.user_id
    WHERE sp.session_id = ? AND u.last_active > ?
    ORDER BY u.last_active ASC
  `, [sessionId, since]);
}

/**
 * Get session updates since a specific time
 * @param {string} sessionId - Session ID
 * @param {string} since - ISO timestamp to check after
 * @returns {Promise<Object>} - Object with session updates
 */
async function getSessionUpdates(sessionId, since) {
  try {
    // Get session details to check if status has changed
    const session = await getSession(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    
    // Check if session was updated after the since time
    const sessionUpdated = new Date(session.updated_at) > new Date(since);
    const sessionStarted = sessionUpdated && session.status !== 'WAITING';
    
    // Get new participants that joined after the specified time
    const newParticipants = await getNewParticipants(sessionId, since);
    
    // Get new ideas submitted after the specified time
    const newIdeas = await db.all(`
      SELECT i.*, u.name as authorName
      FROM ideas i
      JOIN users u ON i.author_id = u.id
      WHERE i.session_id = ? AND i.created_at > ?
      ORDER BY i.created_at ASC
    `, [sessionId, since]);
    
    // Get new votes submitted after the specified time
    const newVotes = await db.all(`
      SELECT v.*, u.name as userName
      FROM votes v
      JOIN users u ON v.user_id = u.id
      WHERE v.session_id = ? AND v.created_at > ?
      ORDER BY v.created_at ASC
    `, [sessionId, since]);
    
    return {
      sessionId,
      sessionStarted,
      statusChanged: sessionUpdated,
      currentStatus: session.status,
      newParticipants,
      newIdeas,
      newVotes
    };
  } catch (error) {
    console.error('Error getting session updates:', error);
    throw error;
  }
}

/**
 * Add a user to a session
 * @param {string} sessionId - Session ID
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} - True if successful
 */
async function addParticipant(sessionId, userId) {
  try {
    db.run(
      'INSERT INTO session_participants (session_id, user_id) VALUES (?, ?)',
      [sessionId, userId]
    );
    return true;
  } catch (error) {
    console.error('Error adding participant:', error);
    return false;
  }
}

/**
 * Update session status
 * @param {string} sessionId - Session ID
 * @param {string} status - New status
 * @returns {Promise<Object|null>} - Updated session or null if not found
 */
async function updateSessionStatus(sessionId, status) {
  const now = new Date().toISOString();
  
  const result = db.run(
    'UPDATE sessions SET status = ?, updated_at = ? WHERE id = ?',
    [status, now, sessionId]
  );
  
  if (result.changes === 0) {
    return null;
  }
  
  return getSession(sessionId);
}

/**
 * Update session round
 * @param {string} sessionId - Session ID
 * @param {number} round - New round number
 * @returns {Promise<Object|null>} - Updated session or null if not found
 */
async function updateSessionRound(sessionId, round) {
  const now = new Date().toISOString();
  
  const result = db.run(
    'UPDATE sessions SET current_round = ?, updated_at = ? WHERE id = ?',
    [round, now, sessionId]
  );
  
  if (result.changes === 0) {
    return null;
  }
  
  return getSession(sessionId);
}

/**
 * Get sessions owned by a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Array of session objects
 */
async function getSessionsByOwner(userId) {
  return db.all('SELECT * FROM sessions WHERE owner_id = ? ORDER BY created_at DESC', [userId]);
}

/**
 * Get sessions a user is participating in
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Array of session objects
 */
async function getSessionsByParticipant(userId) {
  return db.all(`
    SELECT s.* 
    FROM sessions s
    JOIN session_participants sp ON s.id = sp.session_id
    WHERE sp.user_id = ?
    ORDER BY s.created_at DESC
  `, [userId]);
}

/**
 * Check if user is session owner
 * @param {string} sessionId - Session ID
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} - True if user is owner
 */
async function isSessionOwner(sessionId, userId) {
  const session = await getSession(sessionId);
  return session && session.owner_id === userId;
}

/**
 * Delete a session
 * @param {string} sessionId - Session ID
 * @returns {Promise<boolean>} - True if successful
 */
async function deleteSession(sessionId) {
  try {
    // Delete within a transaction to ensure all related data is deleted
    return await db.transaction(async () => {
      // Delete related data first (foreign key constraints)
      await db.run('DELETE FROM session_metadata WHERE session_id = ?', [sessionId]);
      await db.run('DELETE FROM votes WHERE session_id = ?', [sessionId]);
      await db.run('DELETE FROM ideas WHERE session_id = ?', [sessionId]);
      await db.run('DELETE FROM session_participants WHERE session_id = ?', [sessionId]);
      
      // Finally delete the session
      const result = await db.run('DELETE FROM sessions WHERE id = ?', [sessionId]);
      
      return result.changes > 0;
    });
  } catch (error) {
    console.error('Error deleting session:', error);
    return false;
  }
}

module.exports = {
  createSession,
  getSession,
  getSessionByCode,
  getParticipants,
  getNewParticipants,
  getSessionUpdates,
  addParticipant,
  updateSessionStatus,
  updateSessionRound,
  getSessionsByOwner,
  getSessionsByParticipant,
  isSessionOwner,
  deleteSession
}; 