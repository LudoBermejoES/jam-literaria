import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from './db.js';

export class Idea {
  /**
   * Create a new idea
   * @param {string} content - Idea content
   * @param {string} authorId - ID of the idea author
   * @param {string} sessionId - ID of the session
   * @returns {Object} Created idea
   */
  static createIdea(content, authorId, sessionId) {
    if (!content || !authorId || !sessionId) {
      throw new Error('Content, author ID, and session ID are required');
    }

    const db = getDatabase();
    const id = uuidv4();
    
    const stmt = db.prepare(`
      INSERT INTO ideas (id, content, author_id, session_id)
      VALUES (?, ?, ?, ?)
    `);
    
    stmt.run(id, content.trim(), authorId, sessionId);
    
    return this.getIdeaById(id);
  }
  
  /**
   * Get an idea by ID
   * @param {string} id - Idea ID
   * @returns {Object|null} Idea object or null if not found
   */
  static getIdeaById(id) {
    if (!id) {
      throw new Error('Idea ID is required');
    }

    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT i.*, u.name as author_name
      FROM ideas i
      JOIN users u ON i.author_id = u.id
      WHERE i.id = ?
    `);
    
    return stmt.get(id) || null;
  }
  
  /**
   * Get ideas by session ID
   * @param {string} sessionId - Session ID
   * @returns {Array} Array of idea objects
   */
  static getIdeasBySessionId(sessionId) {
    if (!sessionId) {
      throw new Error('Session ID is required');
    }

    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT i.*, u.name as author_name
      FROM ideas i
      JOIN users u ON i.author_id = u.id
      WHERE i.session_id = ?
      ORDER BY i.created_at ASC
    `);
    
    return stmt.all(sessionId);
  }
  
  /**
   * Get ideas by author ID
   * @param {string} authorId - Author ID
   * @returns {Array} Array of idea objects
   */
  static getIdeasByAuthorId(authorId) {
    if (!authorId) {
      throw new Error('Author ID is required');
    }

    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT i.*, u.name as author_name
      FROM ideas i
      JOIN users u ON i.author_id = u.id
      WHERE i.author_id = ?
      ORDER BY i.created_at DESC
    `);
    
    return stmt.all(authorId);
  }
  
  /**
   * Get ideas by author for a specific session
   * @param {string} sessionId - Session ID
   * @param {string} authorId - Author ID
   * @returns {Array} Array of idea objects
   */
  static getIdeasBySessionAndAuthor(sessionId, authorId) {
    if (!sessionId || !authorId) {
      throw new Error('Session ID and author ID are required');
    }

    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT i.*, u.name as author_name
      FROM ideas i
      JOIN users u ON i.author_id = u.id
      WHERE i.session_id = ? AND i.author_id = ?
      ORDER BY i.created_at ASC
    `);
    
    return stmt.all(sessionId, authorId);
  }
  
  /**
   * Get ideas by IDs
   * @param {Array} ideaIds - Array of idea IDs
   * @returns {Array} Array of idea objects
   */
  static getIdeasByIds(ideaIds) {
    if (!Array.isArray(ideaIds) || ideaIds.length === 0) {
      return [];
    }

    const db = getDatabase();
    
    // Create placeholders for the IN clause
    const placeholders = ideaIds.map(() => '?').join(',');
    
    const stmt = db.prepare(`
      SELECT i.*, u.name as author_name
      FROM ideas i
      JOIN users u ON i.author_id = u.id
      WHERE i.id IN (${placeholders})
      ORDER BY i.created_at ASC
    `);
    
    return stmt.all(...ideaIds);
  }
  
  /**
   * Count ideas by session
   * @param {string} sessionId - Session ID
   * @returns {number} Number of ideas in the session
   */
  static countIdeasBySession(sessionId) {
    if (!sessionId) {
      throw new Error('Session ID is required');
    }

    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT COUNT(*) as count
      FROM ideas
      WHERE session_id = ?
    `);
    
    const result = stmt.get(sessionId);
    return result ? result.count : 0;
  }
  
  /**
   * Count ideas by author in a session
   * @param {string} sessionId - Session ID
   * @param {string} authorId - Author ID
   * @returns {number} Number of ideas by the author in the session
   */
  static countIdeasBySessionAndAuthor(sessionId, authorId) {
    if (!sessionId || !authorId) {
      throw new Error('Session ID and author ID are required');
    }

    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT COUNT(*) as count
      FROM ideas
      WHERE session_id = ? AND author_id = ?
    `);
    
    const result = stmt.get(sessionId, authorId);
    return result ? result.count : 0;
  }
  
  /**
   * Delete an idea
   * @param {string} id - Idea ID
   * @returns {boolean} True if successful
   */
  static deleteIdea(id) {
    if (!id) {
      throw new Error('Idea ID is required');
    }

    const db = getDatabase();
    const stmt = db.prepare(`
      DELETE FROM ideas
      WHERE id = ?
    `);
    
    stmt.run(id);
    return true;
  }
  
  /**
   * Delete all ideas for a session
   * @param {string} sessionId - Session ID
   * @returns {boolean} True if successful
   */
  static deleteIdeasBySession(sessionId) {
    if (!sessionId) {
      throw new Error('Session ID is required');
    }

    const db = getDatabase();
    const stmt = db.prepare(`
      DELETE FROM ideas
      WHERE session_id = ?
    `);
    
    stmt.run(sessionId);
    return true;
  }
} 