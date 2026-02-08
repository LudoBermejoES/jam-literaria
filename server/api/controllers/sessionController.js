import * as sessionService from '../../services/sessionService.js';
import * as ideaService from '../../services/ideaService.js';
import { io } from '../../socket/io.js';

/**
 * Create a new session
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const createSession = async (req, res) => {
  try {
    const { user } = req;
    
    // Create session with the authenticated user as owner
    const session = sessionService.createSession(user.id);
    
    return res.status(201).json({
      success: true,
      data: {
        session
      }
    });
  } catch (error) {
    console.error('Create session error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to create session'
    });
  }
};

/**
 * Get a session by ID
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const getSession = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get the session with its participants
    const session = sessionService.getSessionWithParticipants(id);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: {
        session
      }
    });
  } catch (error) {
    console.error('Get session error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to get session'
    });
  }
};

/**
 * Join a session
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const joinSession = async (req, res) => {
  try {
    const { code } = req.body;
    const { user } = req;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Session code is required'
      });
    }
    
    // Find session by code
    const session = sessionService.getSessionByCode(code);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }
    
    // Join the session
    const updatedSession = sessionService.joinSession(session.id, user.id);
    
    return res.status(200).json({
      success: true,
      data: {
        session: updatedSession
      }
    });
  } catch (error) {
    console.error('Join session error:', error);
    
    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to join session'
    });
  }
};

/**
 * Start a session
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const startSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;
    
    // Start the session
    const session = sessionService.startSession(id, user.id);

    // Add max ideas per user information
    const maxIdeasPerUser = ideaService.getMaxIdeasPerUserForSession(id);

    // Broadcast to all participants via socket.io (if available)
    if (io) {
      io.to(`session:${id}`).emit('session-started', {
        session,
        maxIdeasPerUser
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        session,
        maxIdeasPerUser
      }
    });
  } catch (error) {
    console.error('Start session error:', error);

    // Return 403 for authorization errors
    if (error.message.includes('owner')) {
      return res.status(403).json({
        success: false,
        error: error.message
      });
    }

    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to start session'
    });
  }
};

/**
 * Get session status
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const getSessionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get the session with its participants
    const session = sessionService.getSessionWithParticipants(id);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }
    
    // Get ideas if appropriate
    let ideas = [];
    if (session.status === 'SUBMITTING_IDEAS' || session.status === 'VOTING' || session.status === 'COMPLETED') {
      ideas = ideaService.getIdeasBySessionId(id);
    }
    
    // Prepare response data
    const responseData = {
      session: {
        id: session.id,
        code: session.code,
        status: session.status,
        current_round: session.current_round,
        owner_id: session.owner_id,
        owner_name: session.owner_name,
        created_at: session.created_at,
        updated_at: session.updated_at
      },
      participants: session.participants,
      metadata: session.metadata,
      ideas: ideas
    };
    
    return res.status(200).json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Get session status error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to get session status'
    });
  }
};

/**
 * Get all sessions
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const getAllSessions = async (req, res) => {
  try {
    const sessions = sessionService.getAllSessions();
    
    return res.status(200).json({
      success: true,
      data: {
        sessions
      }
    });
  } catch (error) {
    console.error('Get all sessions error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to get sessions'
    });
  }
};

/**
 * Get sessions the user has joined
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const getJoinedSessions = async (req, res) => {
  try {
    const { user } = req;
    
    // Get sessions where the user is a participant
    const sessions = sessionService.getSessionsByParticipant(user.id);
    
    return res.status(200).json({
      success: true,
      data: {
        sessions
      }
    });
  } catch (error) {
    console.error('Get joined sessions error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to get joined sessions'
    });
  }
};

/**
 * Delete a session
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const deleteSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;
    
    // Delete the session
    const result = sessionService.deleteSession(id, user.id);
    
    return res.status(200).json({
      success: true,
      data: {
        deleted: result
      }
    });
  } catch (error) {
    console.error('Delete session error:', error);

    // Return 403 for authorization errors
    if (error.message.includes('owner')) {
      return res.status(403).json({
        success: false,
        error: error.message
      });
    }

    // Return 404 for not found errors
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }

    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to delete session'
    });
  }
};

/**
 * Get participants for a session
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const getParticipants = async (req, res) => {
  try {
    const { id } = req.params;

    // Get the session with its participants
    const session = sessionService.getSessionWithParticipants(id);

    return res.status(200).json({
      success: true,
      data: {
        participants: session.participants
      }
    });
  } catch (error) {
    console.error('Get participants error:', error);

    return res.status(500).json({
      success: false,
      error: 'Failed to get participants'
    });
  }
};

/**
 * Start voting phase for a session
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const startVoting = async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;

    // Get session to check ownership
    const session = sessionService.getSessionById(id);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    // Check if user is the owner
    if (session.owner_id !== user.id) {
      return res.status(403).json({
        success: false,
        error: 'Only the session owner can start voting'
      });
    }

    // Start voting phase
    const updatedSession = sessionService.startVotingPhase(id);

    // Broadcast to all participants via socket.io (if available)
    if (io) {
      io.to(`session:${id}`).emit('voting-started', {
        session: updatedSession
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        session: updatedSession
      }
    });
  } catch (error) {
    console.error('Start voting error:', error);

    // Return 403 for authorization errors
    if (error.message.includes('owner')) {
      return res.status(403).json({
        success: false,
        error: error.message
      });
    }

    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to start voting'
    });
  }
};