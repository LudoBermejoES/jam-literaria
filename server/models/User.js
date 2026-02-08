import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from './db.js';

export class User {
  /**
   * Create a new user
   * @param {string} name - User name
   * @returns {Object} Created user or existing user with the same name
   */
  static createUser(name) {
    if (!name || name.trim() === '') {
      throw new Error('User name is required');
    }

    const db = getDatabase();
    const trimmedName = name.trim();
    
    // Check if user with this name already exists
    const existingUser = this.getUserByName(trimmedName);
    if (existingUser) {
      return existingUser;
    }
    
    // Create new user if not found
    const id = uuidv4();
    const stmt = db.prepare('INSERT INTO users (id, name) VALUES (?, ?)');
    stmt.run(id, trimmedName);
    
    return this.getUserById(id);
  }
  
  /**
   * Get a user by ID
   * @param {string} id - User ID
   * @returns {Object|null} User object or null if not found
   */
  static getUserById(id) {
    if (!id) {
      throw new Error('User ID is required');
    }

    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id) || null;
  }
  
  /**
   * Update a user's last active timestamp
   * @param {string} id - User ID
   * @returns {Object} Result of the update operation
   */
  static updateUserLastActive(id) {
    if (!id) {
      throw new Error('User ID is required');
    }

    const db = getDatabase();
    const stmt = db.prepare('UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE id = ?');
    return stmt.run(id);
  }
  
  /**
   * Get all users
   * @returns {Array} Array of user objects
   */
  static getAllUsers() {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM users ORDER BY created_at DESC');
    return stmt.all();
  }
  
  /**
   * Get users participating in a session
   * @param {string} sessionId - Session ID
   * @returns {Array} Array of user objects
   */
  static getUsersBySessionId(sessionId) {
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
   * Delete a user (for testing purposes)
   * @param {string} id - User ID
   * @returns {boolean} True if user was deleted, false otherwise
   */
  static deleteUser(id) {
    if (!id) {
      throw new Error('User ID is required');
    }

    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }
  
  /**
   * Get a user by name
   * @param {string} name - User name
   * @returns {Object|null} User object or null if not found
   */
  static getUserByName(name) {
    if (!name) {
      throw new Error('User name is required');
    }

    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM users WHERE name = ? COLLATE NOCASE');
    return stmt.get(name.trim()) || null;
  }
} 