import * as sessionService from '../services/sessionService.js';
import * as userService from '../services/userService.js';

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
      
      // Send session state to the user
      socket.emit('session-state', sessionDetails);
      
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
      
      // Broadcast to all participants
      io.to(`session:${sessionId}`).emit('session-started', {
        session
      });
      
      console.log(`Session ${sessionId} started by user ${socket.userId}`);
    } catch (error) {
      console.error('Error in start-session:', error);
      socket.emit('error', { message: error.message || 'Failed to start session' });
    }
  });
} 