import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from './db.js';

export class Vote {
  /**
   * Create a new vote
   * @param {string} userId - ID of the user voting
   * @param {string} ideaId - ID of the idea being voted for
   * @param {string} sessionId - ID of the session
   * @param {number} round - Voting round number
   * @returns {Object} Created vote
   */
  static createVote(userId, ideaId, sessionId, round) {
    if (!userId || !ideaId || !sessionId || round === undefined) {
      throw new Error('User ID, idea ID, session ID, and round are required');
    }

    const db = getDatabase();
    const id = uuidv4();
    
    try {
      const stmt = db.prepare(`
        INSERT INTO votes (id, user_id, idea_id, session_id, round)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      stmt.run(id, userId, ideaId, sessionId, round);
      
      return this.getVoteById(id);
    } catch (error) {
      // Handle unique constraint violation
      if (error.message.includes('UNIQUE constraint failed')) {
        throw new Error('User has already voted for this idea in this round');
      }
      throw error;
    }
  }
  
  /**
   * Get a vote by ID
   * @param {string} id - Vote ID
   * @returns {Object|null} Vote object or null if not found
   */
  static getVoteById(id) {
    if (!id) {
      throw new Error('Vote ID is required');
    }

    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT v.*, u.name as voter_name, i.content as idea_content
      FROM votes v
      JOIN users u ON v.user_id = u.id
      JOIN ideas i ON v.idea_id = i.id
      WHERE v.id = ?
    `);
    
    return stmt.get(id) || null;
  }
  
  /**
   * Get votes by session ID and round
   * @param {string} sessionId - Session ID
   * @param {number} round - Voting round number
   * @returns {Array} Array of vote objects
   */
  static getVotesBySessionAndRound(sessionId, round) {
    if (!sessionId || round === undefined) {
      throw new Error('Session ID and round are required');
    }

    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT v.*, u.name as voter_name, i.content as idea_content
      FROM votes v
      JOIN users u ON v.user_id = u.id
      JOIN ideas i ON v.idea_id = i.id
      WHERE v.session_id = ? AND v.round = ?
      ORDER BY v.created_at ASC
    `);
    
    return stmt.all(sessionId, round);
  }
  
  /**
   * Get votes by user, session, and round
   * @param {string} userId - User ID
   * @param {string} sessionId - Session ID
   * @param {number} round - Voting round number
   * @returns {Array} Array of vote objects
   */
  static getVotesByUserSessionAndRound(userId, sessionId, round) {
    if (!userId || !sessionId || round === undefined) {
      throw new Error('User ID, session ID, and round are required');
    }

    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT v.*, u.name as voter_name, i.content as idea_content
      FROM votes v
      JOIN users u ON v.user_id = u.id
      JOIN ideas i ON v.idea_id = i.id
      WHERE v.user_id = ? AND v.session_id = ? AND v.round = ?
      ORDER BY v.created_at ASC
    `);
    
    return stmt.all(userId, sessionId, round);
  }
  
  /**
   * Get vote counts by idea for a session and round
   * @param {string} sessionId - Session ID
   * @param {number} round - Voting round number
   * @returns {Array} Array of objects with idea ID and vote count
   */
  static getVoteCountsByIdea(sessionId, round) {
    if (!sessionId || round === undefined) {
      throw new Error('Session ID and round are required');
    }

    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT v.idea_id, i.content, COUNT(*) as vote_count, i.author_id
      FROM votes v
      JOIN ideas i ON v.idea_id = i.id
      WHERE v.session_id = ? AND v.round = ?
      GROUP BY v.idea_id
      ORDER BY vote_count DESC, i.created_at ASC
    `);
    
    return stmt.all(sessionId, round);
  }
  
  /**
   * Check if a user has voted in a specific round
   * @param {string} userId - User ID
   * @param {string} sessionId - Session ID
   * @param {number} round - Voting round number
   * @returns {boolean} True if the user has voted
   */
  static hasUserVotedInRound(userId, sessionId, round) {
    if (!userId || !sessionId || round === undefined) {
      throw new Error('User ID, session ID, and round are required');
    }

    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT COUNT(*) as count
      FROM votes
      WHERE user_id = ? AND session_id = ? AND round = ?
    `);
    
    const result = stmt.get(userId, sessionId, round);
    return result && result.count > 0;
  }
  
  /**
   * Count votes in a session and round
   * @param {string} sessionId - Session ID
   * @param {number} round - Voting round number
   * @returns {number} Number of votes
   */
  static countVotesInRound(sessionId, round) {
    if (!sessionId || round === undefined) {
      throw new Error('Session ID and round are required');
    }

    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT COUNT(*) as count
      FROM votes
      WHERE session_id = ? AND round = ?
    `);
    
    const result = stmt.get(sessionId, round);
    return result ? result.count : 0;
  }
  
  /**
   * Get participants who have voted in a round
   * @param {string} sessionId - Session ID
   * @param {number} round - Voting round number
   * @returns {Array} Array of user IDs who have voted
   */
  static getVotersByRound(sessionId, round) {
    if (!sessionId || round === undefined) {
      throw new Error('Session ID and round are required');
    }

    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT DISTINCT user_id
      FROM votes
      WHERE session_id = ? AND round = ?
    `);
    
    return stmt.all(sessionId, round).map(row => row.user_id);
  }
  
  /**
   * Delete a user's votes for a specific round
   * @param {string} userId - User ID
   * @param {string} sessionId - Session ID
   * @param {number} round - Voting round number
   * @returns {boolean} True if successful
   */
  static deleteUserVotesInRound(userId, sessionId, round) {
    if (!userId || !sessionId || round === undefined) {
      throw new Error('User ID, session ID, and round are required');
    }

    const db = getDatabase();
    const stmt = db.prepare(`
      DELETE FROM votes
      WHERE user_id = ? AND session_id = ? AND round = ?
    `);
    
    stmt.run(userId, sessionId, round);
    return true;
  }
  
  /**
   * Delete all votes for a session
   * @param {string} sessionId - Session ID
   * @returns {boolean} True if successful
   */
  static deleteVotesBySession(sessionId) {
    if (!sessionId) {
      throw new Error('Session ID is required');
    }

    const db = getDatabase();
    const stmt = db.prepare(`
      DELETE FROM votes
      WHERE session_id = ?
    `);
    
    stmt.run(sessionId);
    return true;
  }
  
  /**
   * Delete all votes for a session and round
   * @param {string} sessionId - Session ID
   * @param {number} round - Voting round number
   * @returns {boolean} True if successful
   */
  static deleteVotesByRound(sessionId, round) {
    if (!sessionId || round === undefined) {
      throw new Error('Session ID and round are required');
    }

    const db = getDatabase();
    const stmt = db.prepare(`
      DELETE FROM votes
      WHERE session_id = ? AND round = ?
    `);
    
    stmt.run(sessionId, round);
    return true;
  }
} 