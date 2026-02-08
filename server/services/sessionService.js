import { Session, SESSION_STATUS } from '../models/Session.js';

/**
 * Create a new session
 * @param {string} ownerId - ID of the session owner
 * @returns {Object} Created session
 */
export function createSession(ownerId) {
  if (!ownerId) {
    throw new Error('Owner ID is required');
  }
  
  try {
    return Session.createSession(ownerId);
  } catch (error) {
    console.error('Error creating session:', error);
    throw new Error('Failed to create session');
  }
}

/**
 * Get a session by ID
 * @param {string} id - Session ID
 * @returns {Object|null} Session object or null if not found
 */
export function getSessionById(id) {
  if (!id) {
    throw new Error('Session ID is required');
  }
  
  try {
    return Session.getSessionById(id);
  } catch (error) {
    console.error('Error getting session by ID:', error);
    throw new Error('Failed to get session');
  }
}

/**
 * Get a session by code
 * @param {string} code - Session code
 * @returns {Object|null} Session object or null if not found
 */
export function getSessionByCode(code) {
  if (!code) {
    throw new Error('Session code is required');
  }
  
  try {
    return Session.getSessionByCode(code);
  } catch (error) {
    console.error('Error getting session by code:', error);
    throw new Error('Failed to get session');
  }
}

/**
 * Get all sessions
 * @returns {Array} Array of session objects
 */
export function getAllSessions() {
  try {
    return Session.getAllSessions();
  } catch (error) {
    console.error('Error getting all sessions:', error);
    throw new Error('Failed to get sessions');
  }
}

/**
 * Get sessions by participant
 * @param {string} userId - User ID
 * @returns {Array} Array of session objects
 */
export function getSessionsByParticipant(userId) {
  if (!userId) {
    throw new Error('User ID is required');
  }
  
  try {
    return Session.getSessionsByParticipant(userId);
  } catch (error) {
    console.error('Error getting sessions by participant:', error);
    throw new Error('Failed to get sessions');
  }
}

/**
 * Join a session
 * @param {string} sessionId - Session ID
 * @param {string} userId - User ID
 * @returns {Object} Session that was joined
 */
export function joinSession(sessionId, userId) {
  if (!sessionId || !userId) {
    throw new Error('Session ID and user ID are required');
  }
  
  try {
    // Check if session exists
    const session = Session.getSessionById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    
    // Check if session is in a valid state for joining
    if (session.status !== SESSION_STATUS.WAITING) {
      throw new Error('Cannot join session in current state');
    }
    
    // Add user as participant
    Session.addParticipant(sessionId, userId);
    
    // Return the updated session
    return getSessionWithParticipants(sessionId);
  } catch (error) {
    console.error('Error joining session:', error);
    throw error;
  }
}

/**
 * Start a session
 * @param {string} sessionId - Session ID
 * @param {string} ownerId - ID of the session owner
 * @returns {Object} Updated session
 */
export function startSession(sessionId, ownerId) {
  if (!sessionId || !ownerId) {
    throw new Error('Session ID and owner ID are required');
  }
  
  try {
    // Check if session exists
    const session = Session.getSessionById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    
    // Check if user is the owner
    if (session.owner_id !== ownerId) {
      throw new Error('Only the session owner can start the session');
    }
    
    // Check if session is in a valid state
    if (session.status !== SESSION_STATUS.WAITING) {
      throw new Error('Session is already started');
    }
    
    // Get participant count
    const participants = Session.getParticipants(sessionId);
    if (participants.length < 2) {
      throw new Error('Session needs at least 2 participants to start');
    }
    
    // Update session status
    Session.updateSessionStatus(sessionId, SESSION_STATUS.SUBMITTING_IDEAS);
    
    // Return the updated session
    return getSessionWithParticipants(sessionId);
  } catch (error) {
    console.error('Error starting session:', error);
    throw error;
  }
}

/**
 * Update session status
 * @param {string} sessionId - Session ID
 * @param {string} status - New session status
 * @returns {Object} Updated session
 */
export function updateSessionStatus(sessionId, status) {
  if (!sessionId || !status) {
    throw new Error('Session ID and status are required');
  }
  
  if (!Object.values(SESSION_STATUS).includes(status)) {
    throw new Error('Invalid session status');
  }
  
  try {
    Session.updateSessionStatus(sessionId, status);
    return getSessionWithParticipants(sessionId);
  } catch (error) {
    console.error('Error updating session status:', error);
    throw new Error('Failed to update session status');
  }
}

/**
 * Update session round
 * @param {string} sessionId - Session ID
 * @param {number} round - New round number
 * @returns {Object} Updated session
 */
export function updateSessionRound(sessionId, round) {
  if (!sessionId || round === undefined) {
    throw new Error('Session ID and round are required');
  }
  
  try {
    Session.updateSessionRound(sessionId, round);
    return getSessionWithParticipants(sessionId);
  } catch (error) {
    console.error('Error updating session round:', error);
    throw new Error('Failed to update session round');
  }
}

/**
 * Get session with participants
 * @param {string} sessionId - Session ID
 * @returns {Object} Session with participants
 */
export function getSessionWithParticipants(sessionId) {
  if (!sessionId) {
    throw new Error('Session ID is required');
  }

  try {
    const session = Session.getSessionById(sessionId);
    if (!session) {
      return null;
    }

    const participants = Session.getParticipants(sessionId);
    const metadata = Session.getSessionMetadata(sessionId);

    return {
      ...session,
      participants,
      metadata
    };
  } catch (error) {
    console.error('Error getting session with participants:', error);
    throw error;
  }
}

/**
 * Get session metadata
 * @param {string} sessionId - Session ID
 * @returns {Object|null} Session metadata
 */
export function getSessionMetadata(sessionId) {
  if (!sessionId) {
    throw new Error('Session ID is required');
  }
  
  try {
    return Session.getSessionMetadata(sessionId);
  } catch (error) {
    console.error('Error getting session metadata:', error);
    throw new Error('Failed to get session metadata');
  }
}

/**
 * Update session metadata
 * @param {string} sessionId - Session ID
 * @param {Object} metadata - Metadata to update
 * @returns {Object} Updated metadata
 */
export function updateSessionMetadata(sessionId, metadata) {
  if (!sessionId || !metadata) {
    throw new Error('Session ID and metadata are required');
  }
  
  try {
    Session.updateSessionMetadata(sessionId, metadata);
    return getSessionMetadata(sessionId);
  } catch (error) {
    console.error('Error updating session metadata:', error);
    throw new Error('Failed to update session metadata');
  }
}

/**
 * Delete a session
 * @param {string} sessionId - Session ID
 * @param {string} ownerId - ID of the user trying to delete the session
 * @returns {boolean} True if successful
 */
export function deleteSession(sessionId, ownerId) {
  if (!sessionId || !ownerId) {
    throw new Error('Session ID and owner ID are required');
  }
  
  try {
    // Check if session exists
    const session = Session.getSessionById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    
    // Check if user is the owner
    if (session.owner_id !== ownerId) {
      throw new Error('Only the session owner can delete the session');
    }
    
    // Delete the session
    return Session.deleteSession(sessionId);
  } catch (error) {
    console.error('Error deleting session:', error);
    throw error;
  }
}

/**
 * Start the voting phase for a session
 * @param {string} sessionId - The session ID
 * @param {string} userId - The user ID making the request
 * @returns {Object} The updated session
 */
export function startVotingPhase(sessionId) {
  // Get session
  const session = getSessionById(sessionId);
  
  if (!session) {
    throw new Error('Session not found');
  }
  
  // Check if the session is in the correct state to start voting
  if (session.status !== 'SUBMITTING_IDEAS') {
    throw new Error('Session must be in the SUBMITTING_IDEAS phase to start voting');
  }
  
  // Update session status to VOTING
  Session.updateSessionStatus(sessionId, SESSION_STATUS.VOTING);
  
  // Return the updated session with participants
  return getSessionWithParticipants(sessionId);
} 