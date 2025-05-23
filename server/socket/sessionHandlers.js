import * as sessionService from '../services/sessionService.js';
import * as userService from '../services/userService.js';
import * as ideaService from '../services/ideaService.js';

/**
 * Socket handlers for session-related events
 * @param {Object} io - Socket.IO server instance
 * @param {Object} socket - Socket connection
 */
export function sessionHandlers(io, socket) {
  /**
   * Join a session room
   */
  socket.on('join-session', async ({ sessionId }) => {
    try {
      if (!sessionId) {
        socket.emit('error', { message: 'Session ID is required' });
        return;
      }
      
      // Validate session exists
      const session = sessionService.getSessionById(sessionId);
      if (!session) {
        socket.emit('error', { message: 'Session not found' });
        return;
      }
      
      // Check if user is a participant
      const isParticipant = userService.validateUserSessionAccess(socket.userId, sessionId);
      if (!isParticipant) {
        socket.emit('error', { message: 'Not a participant in this session' });
        return;
      }
      
      // Join the session room
      socket.join(`session:${sessionId}`);
      
      // Update user's last active time
      userService.updateUserLastActive(socket.userId);
      
      // Notify others in the room
      socket.to(`session:${sessionId}`).emit('user-joined', {
        userId: socket.userId,
        userName: socket.user.name
      });
      
      // Get session details with participants
      const sessionDetails = sessionService.getSessionWithParticipants(sessionId);
      
      // Add max ideas per user information
      const maxIdeasPerUser = ideaService.getMaxIdeasPerUserForSession(sessionId);
      
      // Send session state to the user
      socket.emit('session-state', {
        ...sessionDetails,
        maxIdeasPerUser
      });
      
      console.log(`User ${socket.userId} joined session ${sessionId}`);
    } catch (error) {
      console.error('Error in join-session:', error);
      socket.emit('error', { message: error.message || 'Failed to join session' });
    }
  });
  
  /**
   * Leave a session room
   */
  socket.on('leave-session', ({ sessionId }) => {
    try {
      if (!sessionId) {
        socket.emit('error', { message: 'Session ID is required' });
        return;
      }
      
      // Leave the session room
      socket.leave(`session:${sessionId}`);
      
      // Notify others in the room
      socket.to(`session:${sessionId}`).emit('user-left', {
        userId: socket.userId,
        userName: socket.user.name
      });
      
      console.log(`User ${socket.userId} left session ${sessionId}`);
    } catch (error) {
      console.error('Error in leave-session:', error);
      socket.emit('error', { message: error.message || 'Failed to leave session' });
    }
  });
  
  /**
   * Start a session
   */
  socket.on('start-session', async ({ sessionId }) => {
    try {
      if (!sessionId) {
        socket.emit('error', { message: 'Session ID is required' });
        return;
      }
      
      // Start the session
      const session = sessionService.startSession(sessionId, socket.userId);
      
      // Add max ideas per user information
      const maxIdeasPerUser = ideaService.getMaxIdeasPerUserForSession(sessionId);
      
      // Broadcast to all participants
      io.to(`session:${sessionId}`).emit('session-started', {
        session,
        maxIdeasPerUser
      });
      
      console.log(`Session ${sessionId} started by user ${socket.userId}`);
    } catch (error) {
      console.error('Error in start-session:', error);
      socket.emit('error', { message: error.message || 'Failed to start session' });
    }
  });

  // Start the ideation phase
  socket.on('start-ideation', ({ sessionId }) => {
    try {
      if (!sessionId) {
        return socket.emit('error', { message: 'Session ID is required' });
      }
      
      // Verify user is the session owner
      const session = sessionService.getSessionById(sessionId);
      
      if (!session) {
        return socket.emit('error', { message: 'Session not found' });
      }
      
      if (session.owner_id !== socket.userId) {
        return socket.emit('error', { message: 'Only the session owner can start ideation' });
      }
      
      // Start the ideation phase
      const updatedSession = sessionService.startIdeation(sessionId);
      
      // Get max ideas per user
      const maxIdeasPerUser = ideaService.getMaxIdeasPerUserForSession(sessionId);
      
      // Broadcast to all participants in the session
      io.to(`session:${sessionId}`).emit('ideation-started', {
        session: updatedSession,
        maxIdeasPerUser
      });
    } catch (error) {
      console.error('Start ideation error:', error);
      socket.emit('error', { message: error.message || 'Failed to start ideation' });
    }
  });
  
  // Start the voting phase
  socket.on('start-voting', ({ sessionId }) => {
    try {
      if (!sessionId) {
        return socket.emit('error', { message: 'Session ID is required' });
      }
      
      // Verify user is the session owner
      const session = sessionService.getSessionById(sessionId);
      
      if (!session) {
        return socket.emit('error', { message: 'Session not found' });
      }
      
      if (session.owner_id !== socket.userId) {
        return socket.emit('error', { message: 'Only the session owner can start voting' });
      }
      
      // Start the voting phase
      const updatedSession = sessionService.startVotingPhase(sessionId);
      
      // Get ideas for voting
      const ideas = ideaService.getIdeasBySessionId(sessionId);
      
      // Broadcast to all participants in the session
      io.to(`session:${sessionId}`).emit('voting-started', {
        session: updatedSession,
        ideas
      });
    } catch (error) {
      console.error('Start voting error:', error);
      socket.emit('error', { message: error.message || 'Failed to start voting phase' });
    }
  });
} 