import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from './db.js';

// Session status constants
export const SESSION_STATUS = {
  WAITING: 'WAITING',
  SUBMITTING_IDEAS: 'SUBMITTING_IDEAS',
  VOTING: 'VOTING',
  COMPLETED: 'COMPLETED'
};

export class Session {
  /**
   * Create a new session
   * @param {string} ownerId - ID of the session owner
   * @returns {Object} Created session
   */
  static createSession(ownerId) {
    if (!ownerId) {
      throw new Error('Owner ID is required');
    }

    const db = getDatabase();
    const id = uuidv4();
    const code = this.generateSessionCode();
    
    // Insert the session
    const insertStmt = db.prepare(`
      INSERT INTO sessions (id, code, status, owner_id) 
      VALUES (?, ?, ?, ?)
    `);
    
    insertStmt.run(id, code, SESSION_STATUS.WAITING, ownerId);
    
    // Add the owner as a participant
    const participantStmt = db.prepare(`
      INSERT INTO session_participants (session_id, user_id)
      VALUES (?, ?)
    `);
    
    participantStmt.run(id, ownerId);
    
    // Create session metadata
    const metadataStmt = db.prepare(`
      INSERT INTO session_metadata (session_id)
      VALUES (?)
    `);
    
    metadataStmt.run(id);
    
    return this.getSessionById(id);
  }
  
  /**
   * Get a session by ID
   * @param {string} id - Session ID
   * @returns {Object|null} Session object or null if not found
   */
  static getSessionById(id) {
    if (!id) {
      throw new Error('Session ID is required');
    }

    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT s.*, u.name as owner_name,
        (SELECT COUNT(*) FROM session_participants WHERE session_id = s.id) as participant_count
      FROM sessions s
      JOIN users u ON s.owner_id = u.id
      WHERE s.id = ?
    `);
    
    return stmt.get(id) || null;
  }
  
  /**
   * Get a session by code
   * @param {string} code - Session code
   * @returns {Object|null} Session object or null if not found
   */
  static getSessionByCode(code) {
    if (!code) {
      throw new Error('Session code is required');
    }

    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT s.*, u.name as owner_name,
        (SELECT COUNT(*) FROM session_participants WHERE session_id = s.id) as participant_count
      FROM sessions s
      JOIN users u ON s.owner_id = u.id
      WHERE s.code = ?
    `);
    
    return stmt.get(code) || null;
  }
  
  /**
   * Get all sessions
   * @returns {Array} Array of session objects
   */
  static getAllSessions() {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT s.*, u.name as owner_name,
        (SELECT COUNT(*) FROM session_participants WHERE session_id = s.id) as participant_count
      FROM sessions s
      JOIN users u ON s.owner_id = u.id
      ORDER BY s.created_at DESC
    `);
    
    return stmt.all();
  }
  
  /**
   * Get sessions where a user is a participant
   * @param {string} userId - User ID
   * @returns {Array} Array of session objects
   */
  static getSessionsByParticipant(userId) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT s.*, u.name as owner_name,
        (SELECT COUNT(*) FROM session_participants WHERE session_id = s.id) as participant_count
      FROM sessions s
      JOIN users u ON s.owner_id = u.id
      JOIN session_participants sp ON s.id = sp.session_id
      WHERE sp.user_id = ?
      ORDER BY s.created_at DESC
    `);
    
    return stmt.all(userId);
  }
  
  /**
   * Update session status
   * @param {string} id - Session ID
   * @param {string} status - New session status
   * @returns {Object} Result of the update operation
   */
  static updateSessionStatus(id, status) {
    if (!id || !status) {
      throw new Error('Session ID and status are required');
    }
    
    if (!Object.values(SESSION_STATUS).includes(status)) {
      throw new Error('Invalid session status');
    }

    const db = getDatabase();
    const stmt = db.prepare(`
      UPDATE sessions 
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    return stmt.run(status, id);
  }
  
  /**
   * Update session round
   * @param {string} id - Session ID
   * @param {number} round - New round number
   * @returns {Object} Result of the update operation
   */
  static updateSessionRound(id, round) {
    if (!id || round === undefined) {
      throw new Error('Session ID and round are required');
    }

    const db = getDatabase();
    const stmt = db.prepare(`
      UPDATE sessions 
      SET current_round = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    return stmt.run(round, id);
  }
  
  /**
   * Add a participant to a session
   * @param {string} sessionId - Session ID
   * @param {string} userId - User ID
   * @returns {boolean} True if successful
   */
  static addParticipant(sessionId, userId) {
    if (!sessionId || !userId) {
      throw new Error('Session ID and User ID are required');
    }

    const db = getDatabase();
    
    // Check if already a participant
    const checkStmt = db.prepare(`
      SELECT COUNT(*) as count
      FROM session_participants
      WHERE session_id = ? AND user_id = ?
    `);
    
    const result = checkStmt.get(sessionId, userId);
    
    if (result && result.count > 0) {
      return true; // Already a participant
    }
    
    // Add as participant
    const insertStmt = db.prepare(`
      INSERT INTO session_participants (session_id, user_id)
      VALUES (?, ?)
    `);
    
    insertStmt.run(sessionId, userId);
    return true;
  }
  
  /**
   * Get participants of a session
   * @param {string} sessionId - Session ID
   * @returns {Array} Array of user objects
   */
  static getParticipants(sessionId) {
    if (!sessionId) {
      throw new Error('Session ID is required');
    }

    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT u.*
      FROM users u
      JOIN session_participants sp ON u.id = sp.user_id
      WHERE sp.session_id = ?
      ORDER BY u.name ASC
    `);
    
    return stmt.all(sessionId);
  }
  
  /**
   * Update session metadata
   * @param {string} sessionId - Session ID
   * @param {Object} metadata - Metadata to update
   * @returns {boolean} True if successful
   */
  static updateSessionMetadata(sessionId, metadata) {
    if (!sessionId || !metadata) {
      throw new Error('Session ID and metadata are required');
    }

    const db = getDatabase();
    const { ideas_elegidas, ideas_candidatas, mensaje_ronda, mensaje_final, required_votes } = metadata;
    
    // Convert arrays to JSON strings if they are arrays, handle undefined as null
    const ideasElegidas = Array.isArray(ideas_elegidas) 
      ? JSON.stringify(ideas_elegidas) 
      : ideas_elegidas || null;
      
    const ideasCandidatas = Array.isArray(ideas_candidatas) 
      ? JSON.stringify(ideas_candidatas) 
      : ideas_candidatas || null;
    
    const stmt = db.prepare(`
      UPDATE session_metadata
      SET ideas_elegidas = COALESCE(?, ideas_elegidas),
          ideas_candidatas = COALESCE(?, ideas_candidatas),
          mensaje_ronda = COALESCE(?, mensaje_ronda),
          mensaje_final = COALESCE(?, mensaje_final),
          required_votes = COALESCE(?, required_votes)
      WHERE session_id = ?
    `);
    
    stmt.run(
      ideasElegidas,
      ideasCandidatas,
      mensaje_ronda || null,
      mensaje_final || null,
      required_votes || null,
      sessionId
    );
    
    return true;
  }
  
  /**
   * Get session metadata
   * @param {string} sessionId - Session ID
   * @returns {Object|null} Session metadata or null if not found
   */
  static getSessionMetadata(sessionId) {
    if (!sessionId) {
      throw new Error('Session ID is required');
    }

    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT * FROM session_metadata
      WHERE session_id = ?
    `);
    
    const metadata = stmt.get(sessionId);
    
    if (!metadata) return null;
    
    // Parse JSON strings to arrays if they exist
    if (metadata.ideas_elegidas) {
      try {
        metadata.ideas_elegidas = JSON.parse(metadata.ideas_elegidas);
      } catch {
        metadata.ideas_elegidas = [];
      }
    }
    
    if (metadata.ideas_candidatas) {
      try {
        metadata.ideas_candidatas = JSON.parse(metadata.ideas_candidatas);
      } catch {
        metadata.ideas_candidatas = [];
      }
    }
    
    return metadata;
  }
  
  /**
   * Delete a session and all related data
   * @param {string} id - Session ID
   * @returns {boolean} True if successful
   */
  static deleteSession(id) {
    if (!id) {
      throw new Error('Session ID is required');
    }

    const db = getDatabase();
    
    try {
      // Begin transaction
      db.exec('BEGIN TRANSACTION');
      
      // First delete votes (references both ideas and sessions)
      const deleteVotesStmt = db.prepare(`
        DELETE FROM votes
        WHERE session_id = ?
      `);
      deleteVotesStmt.run(id);
      
      // Delete ideas
      const deleteIdeasStmt = db.prepare(`
        DELETE FROM ideas
        WHERE session_id = ?
      `);
      deleteIdeasStmt.run(id);
      
      // Remove participants
      const deleteParticipantsStmt = db.prepare(`
        DELETE FROM session_participants
        WHERE session_id = ?
      `);
      deleteParticipantsStmt.run(id);
      
      // Remove metadata
      const deleteMetadataStmt = db.prepare(`
        DELETE FROM session_metadata
        WHERE session_id = ?
      `);
      deleteMetadataStmt.run(id);
      
      // Finally remove the session
      const deleteSessionStmt = db.prepare(`
        DELETE FROM sessions
        WHERE id = ?
      `);
      deleteSessionStmt.run(id);
      
      // Commit the transaction
      db.exec('COMMIT');
      
      return true;
    } catch (error) {
      // Rollback in case of error
      db.exec('ROLLBACK');
      console.error('Error in transaction:', error);
      throw error;
    }
  }
  
  /**
   * Generate a random 6-character session code
   * @returns {string} Session code
   */
  static generateSessionCode() {
    // Create a random 6-character alphanumeric code
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    // Check if the code already exists
    const db = getDatabase();
    const stmt = db.prepare('SELECT COUNT(*) as count FROM sessions WHERE code = ?');
    const result = stmt.get(code);
    
    // If the code exists, generate a new one
    if (result && result.count > 0) {
      return this.generateSessionCode();
    }
    
    return code;
  }
} 