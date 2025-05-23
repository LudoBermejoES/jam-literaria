import { User } from '../models/User.js';

/**
 * Create a new user
 * @param {string} name - User name
 * @returns {Object} Created user
 */
export function createUser(name) {
  if (!name || name.trim() === '') {
    throw new Error('User name is required');
  }
  
  try {
    return User.createUser(name);
  } catch (error) {
    console.error('Error creating user:', error);
    throw new Error('Failed to create user');
  }
}

/**
 * Get a user by ID
 * @param {string} id - User ID
 * @returns {Object|null} User object or null if not found
 */
export function getUserById(id) {
  if (!id) {
    throw new Error('User ID is required');
  }
  
  try {
    return User.getUserById(id);
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw new Error('Failed to get user');
  }
}

/**
 * Update a user's last activity timestamp
 * @param {string} id - User ID
 * @returns {boolean} True if successful
 */
export function updateUserLastActive(id) {
  if (!id) {
    throw new Error('User ID is required');
  }
  
  try {
    User.updateUserLastActive(id);
    return true;
  } catch (error) {
    console.error('Error updating user last active:', error);
    throw new Error('Failed to update user activity');
  }
}

/**
 * Get all users
 * @returns {Array} Array of user objects
 */
export function getAllUsers() {
  try {
    return User.getAllUsers();
  } catch (error) {
    console.error('Error getting all users:', error);
    throw new Error('Failed to get users');
  }
}

/**
 * Get users participating in a session
 * @param {string} sessionId - Session ID
 * @returns {Array} Array of user objects
 */
export function getUsersBySessionId(sessionId) {
  if (!sessionId) {
    throw new Error('Session ID is required');
  }
  
  try {
    return User.getUsersBySessionId(sessionId);
  } catch (error) {
    console.error('Error getting users by session ID:', error);
    throw new Error('Failed to get session participants');
  }
}

/**
 * Validate user access to a session
 * @param {string} userId - User ID
 * @param {string} sessionId - Session ID
 * @returns {boolean} True if user has access
 */
export function validateUserSessionAccess(userId, sessionId) {
  if (!userId || !sessionId) {
    throw new Error('User ID and session ID are required');
  }
  
  try {
    const users = User.getUsersBySessionId(sessionId);
    return users.some(user => user.id === userId);
  } catch (error) {
    console.error('Error validating user session access:', error);
    throw new Error('Failed to validate user session access');
  }
} 