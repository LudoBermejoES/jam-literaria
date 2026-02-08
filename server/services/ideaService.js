import { Idea } from '../models/Idea.js';
import { Session, SESSION_STATUS } from '../models/Session.js';
import * as sessionService from './sessionService.js';

/**
 * Validate that a session exists
 * @param {string} sessionId - Session ID
 * @returns {Object} Session object
 * @throws {Error} If session not found
 */
export function validateSessionExists(sessionId) {
  if (!sessionId) {
    throw new Error('Session ID is required');
  }

  const session = Session.getSessionById(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }

  return session;
}

/**
 * Determine the maximum number of ideas per user based on participant count
 * @param {number} participantCount - Number of participants in the session
 * @returns {number} Maximum ideas per user
 */
export function getMaxIdeasPerUser(participantCount) {
  if (participantCount === 2) {
    return 4; // Two people: 4 ideas per person
  } else if (participantCount >= 3 && participantCount <= 4) {
    return 3; // 3-4 people: 3 ideas per person
  } else {
    return 2; // 5+ people: 2 ideas per person
  }
}

/**
 * Get the maximum number of ideas per user for a specific session
 * @param {string} sessionId - Session ID
 * @returns {number} Maximum ideas per user
 */
export function getMaxIdeasPerUserForSession(sessionId) {
  if (!sessionId) {
    throw new Error('Session ID is required');
  }
  
  try {
    const participants = Session.getParticipants(sessionId);
    return getMaxIdeasPerUser(participants.length);
  } catch (error) {
    console.error('Error getting max ideas per user:', error);
    throw error;
  }
}

/**
 * Create a new idea
 * @param {string} content - Idea content
 * @param {string} authorId - ID of the idea author
 * @param {string} sessionId - ID of the session
 * @returns {Object} Created idea
 */
export function createIdea(content, authorId, sessionId) {
  if (!content || !authorId || !sessionId) {
    throw new Error('Content, author ID, and session ID are required');
  }
  
  try {
    // Check if session exists and is in the correct state
    const session = Session.getSessionById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    
    if (session.status !== SESSION_STATUS.SUBMITTING_IDEAS) {
      throw new Error('Session is not in the idea submission phase');
    }
    
    // Check if the user has already submitted the maximum number of ideas
    const userIdeas = Idea.getIdeasBySessionAndAuthor(sessionId, authorId);
    const participants = Session.getParticipants(sessionId);
    
    // Determine max ideas per user based on participant count
    const maxIdeasPerUser = getMaxIdeasPerUser(participants.length);
    
    if (userIdeas.length >= maxIdeasPerUser) {
      throw new Error(`You can only submit up to ${maxIdeasPerUser} ideas`);
    }
    
    // Create the idea
    const idea = Idea.createIdea(content, authorId, sessionId);
    
    // Note: Do not automatically change session status to VOTING
    // The session owner must manually start the voting phase
    
    return idea;
  } catch (error) {
    console.error('Error creating idea:', error);
    throw error;
  }
}

/**
 * Get an idea by ID
 * @param {string} id - Idea ID
 * @returns {Object|null} Idea object or null if not found
 */
export function getIdeaById(id) {
  if (!id) {
    throw new Error('Idea ID is required');
  }
  
  try {
    return Idea.getIdeaById(id);
  } catch (error) {
    console.error('Error getting idea by ID:', error);
    throw new Error('Failed to get idea');
  }
}

/**
 * Get ideas by session ID
 * @param {string} sessionId - Session ID
 * @returns {Array} Array of idea objects
 */
export function getIdeasBySessionId(sessionId) {
  if (!sessionId) {
    throw new Error('Session ID is required');
  }

  try {
    return Idea.getIdeasBySessionId(sessionId);
  } catch (error) {
    console.error('Error getting ideas by session ID:', error);
    throw new Error('Failed to get ideas');
  }
}

/**
 * Get ideas by session ID with session validation
 * @param {string} sessionId - Session ID
 * @returns {Array} Array of idea objects
 * @throws {Error} If session not found
 */
export function getIdeasBySessionWithValidation(sessionId) {
  if (!sessionId) {
    throw new Error('Session ID is required');
  }

  // Validate session exists
  const session = Session.getSessionById(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }

  // Get ideas
  return Idea.getIdeasBySessionId(sessionId);
}

/**
 * Get ideas by author for a session
 * @param {string} sessionId - Session ID
 * @param {string} authorId - Author ID
 * @returns {Array} Array of idea objects
 */
export function getIdeasBySessionAndAuthor(sessionId, authorId) {
  if (!sessionId || !authorId) {
    throw new Error('Session ID and author ID are required');
  }
  
  try {
    return Idea.getIdeasBySessionAndAuthor(sessionId, authorId);
  } catch (error) {
    console.error('Error getting ideas by session and author:', error);
    throw new Error('Failed to get ideas');
  }
}

/**
 * Get candidate ideas for voting
 * @param {string} sessionId - Session ID
 * @returns {Array} Array of idea objects for the current voting round
 */
export function getCandidateIdeasForVoting(sessionId) {
  if (!sessionId) {
    throw new Error('Session ID is required');
  }
  
  try {
    const session = Session.getSessionById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    
    if (session.status !== SESSION_STATUS.VOTING) {
      throw new Error('Session is not in the voting phase');
    }
    
    // Get the session metadata to see if there are candidate ideas
    const metadata = Session.getSessionMetadata(sessionId);
    
    if (metadata && metadata.ideas_candidatas && metadata.ideas_candidatas.length > 0) {
      // If there are candidate ideas, return those
      return Idea.getIdeasByIds(metadata.ideas_candidatas);
    } else {
      // Otherwise, return all ideas for the session
      return Idea.getIdeasBySessionId(sessionId);
    }
  } catch (error) {
    console.error('Error getting candidate ideas for voting:', error);
    throw error;
  }
}

/**
 * Get the winning ideas from a completed session
 * @param {string} sessionId - Session ID
 * @returns {Array} Array of winning idea objects
 */
export function getWinningIdeas(sessionId) {
  if (!sessionId) {
    throw new Error('Session ID is required');
  }
  
  try {
    const session = Session.getSessionById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    
    if (session.status !== SESSION_STATUS.COMPLETED) {
      throw new Error('Session is not completed');
    }
    
    // Get the session metadata to find the winning ideas
    const metadata = Session.getSessionMetadata(sessionId);
    
    if (metadata && metadata.ideas_elegidas && metadata.ideas_elegidas.length > 0) {
      return Idea.getIdeasByIds(metadata.ideas_elegidas);
    } else {
      throw new Error('No winning ideas found');
    }
  } catch (error) {
    console.error('Error getting winning ideas:', error);
    throw error;
  }
} 