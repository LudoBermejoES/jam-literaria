import { User } from '../../models/User.js';

/**
 * Authentication middleware
 * Validates that a user is authenticated
 */
export const authMiddleware = (req, res, next) => {
  // Check if userId exists in session
  const userId = req.session?.userId;
  
  if (!userId) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized - Please login first'
    });
  }
  
  try {
    // Check if user exists in database
    const user = User.getUserById(userId);
    
    if (!user) {
      // Clear invalid session
      req.session.destroy();
      
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - Invalid user'
      });
    }
    
    // Add user to request object
    req.user = user;
    
    // Update user's last active timestamp
    User.updateUserLastActive(userId);
    
    // Continue to the route handler
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Optional authentication middleware
 * Adds user to request if authenticated, but doesn't block the request if not
 */
export const optionalAuthMiddleware = (req, res, next) => {
  // Check if userId exists in session
  const userId = req.session?.userId;
  
  if (!userId) {
    // No user, but continue anyway
    return next();
  }
  
  try {
    // Check if user exists in database
    const user = User.getUserById(userId);
    
    if (user) {
      // Add user to request object
      req.user = user;
      
      // Update user's last active timestamp
      User.updateUserLastActive(userId);
    } else {
      // Clear invalid session but continue
      req.session.destroy();
    }
    
    // Continue to the route handler
    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    
    // Continue anyway, even on error
    next();
  }
};

/**
 * Session owner middleware
 * Validates that the authenticated user is the owner of the specified session
 */
export const sessionOwnerMiddleware = (req, res, next) => {
  // First, ensure the user is authenticated
  authMiddleware(req, res, () => {
    const sessionId = req.params.id || req.body.sessionId;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
    }
    
    try {
      // Get the session
      const session = req.app.locals.Session.getSessionById(sessionId);
      
      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Session not found'
        });
      }
      
      // Check if the authenticated user is the session owner
      if (session.owner_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden - Only the session owner can perform this action'
        });
      }
      
      // Add session to request
      req.session = session;
      
      // Continue to the route handler
      next();
    } catch (error) {
      console.error('Session owner middleware error:', error);
      
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });
};

/**
 * Session participant middleware
 * Validates that the authenticated user is a participant in the specified session
 */
export const sessionParticipantMiddleware = (req, res, next) => {
  // First, ensure the user is authenticated
  authMiddleware(req, res, () => {
    const sessionId = req.params.id || req.body.sessionId;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
    }
    
    try {
      // Get the session
      const session = req.app.locals.Session.getSessionById(sessionId);
      
      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Session not found'
        });
      }
      
      // Get participants
      const participants = req.app.locals.Session.getParticipants(sessionId);
      
      // Check if the authenticated user is a participant
      const isParticipant = participants.some(p => p.id === req.user.id);
      
      if (!isParticipant) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden - You are not a participant in this session'
        });
      }
      
      // Add session and participants to request
      req.session = session;
      req.participants = participants;
      
      // Continue to the route handler
      next();
    } catch (error) {
      console.error('Session participant middleware error:', error);
      
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });
}; 