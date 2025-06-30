import * as ideaService from '../services/ideaService.js';
import * as sessionService from '../services/sessionService.js';
import { SESSION_STATUS } from '../models/Session.js';

/**
 * Socket handlers for idea-related events
 * @param {Object} io - Socket.IO server instance
 * @param {Object} socket - Socket connection
 */
export function ideaHandlers(io, socket) {
  /**
   * Submit a new idea
   */
  socket.on('submit-idea', async ({ sessionId, content }) => {
    try {
      if (!sessionId || !content) {
        socket.emit('error', { message: 'Session ID and content are required' });
        return;
      }
      
      // Check if session exists
      const session = sessionService.getSessionById(sessionId);
      if (!session) {
        socket.emit('error', { message: 'Session not found' });
        return;
      }
      
      // Check if session is in the correct state
      if (session.status !== SESSION_STATUS.SUBMITTING_IDEAS) {
        socket.emit('error', { message: 'Session is not in the idea submission phase' });
        return;
      }
      
      // Create the idea
      const idea = ideaService.createIdea(content, socket.userId, sessionId);
      
      // Get updated session status
      const updatedSession = sessionService.getSessionById(sessionId);
      
      // Notify all participants about the new idea
      io.to(`session:${sessionId}`).emit('idea-submitted', {
        idea: {
          id: idea.id,
          content: idea.content,
          author_id: idea.author_id,
          author_name: idea.author_name,
          created_at: idea.created_at
        },
        user: {
          id: socket.userId,
          name: socket.user.name
        }
      });
      
      console.log(`User ${socket.userId} submitted idea in session ${sessionId}`);
    } catch (error) {
      console.error('Error in submit-idea:', error);
      socket.emit('error', { message: error.message || 'Failed to submit idea' });
    }
  });
  
  /**
   * Get ideas for a session (context-aware)
   */
  socket.on('get-ideas', async ({ sessionId }) => {
    try {
      if (!sessionId) {
        socket.emit('error', { message: 'Session ID is required' });
        return;
      }
      
      // Check if session exists
      const session = sessionService.getSessionById(sessionId);
      if (!session) {
        socket.emit('error', { message: 'Session not found' });
        return;
      }
      
      let ideas;
      
      // CRITICAL FIX: Return appropriate ideas based on session status
      if (session.status === SESSION_STATUS.VOTING) {
        // In voting phase, return candidate ideas for current round
        ideas = ideaService.getCandidateIdeasForVoting(sessionId);
        console.log(`Returning ${ideas.length} candidate ideas for voting in session ${sessionId}`);
      } else {
        // In other phases, return all session ideas
        ideas = ideaService.getIdeasBySessionId(sessionId);
        console.log(`Returning ${ideas.length} total ideas for session ${sessionId}`);
      }
      
      // Send ideas to the requesting user
      socket.emit('ideas', {
        sessionId,
        ideas,
        round: session.current_round,
        sessionStatus: session.status
      });
      
      console.log(`User ${socket.userId} requested ideas for session ${sessionId}`);
    } catch (error) {
      console.error('Error in get-ideas:', error);
      socket.emit('error', { message: error.message || 'Failed to get ideas' });
    }
  });
  
  /**
   * Get candidate ideas for voting
   */
  socket.on('get-candidate-ideas', async ({ sessionId }) => {
    try {
      if (!sessionId) {
        socket.emit('error', { message: 'Session ID is required' });
        return;
      }
      
      // Check if session exists
      const session = sessionService.getSessionById(sessionId);
      if (!session) {
        socket.emit('error', { message: 'Session not found' });
        return;
      }
      
      // Check if session is in the voting phase
      if (session.status !== SESSION_STATUS.VOTING) {
        socket.emit('error', { message: 'Session is not in the voting phase' });
        return;
      }
      
      // Get candidate ideas for voting
      const ideas = ideaService.getCandidateIdeasForVoting(sessionId);
      
      // Send ideas to the requesting user
      socket.emit('candidate-ideas', {
        sessionId,
        ideas,
        round: session.current_round
      });
      
      console.log(`User ${socket.userId} requested candidate ideas for session ${sessionId}`);
    } catch (error) {
      console.error('Error in get-candidate-ideas:', error);
      socket.emit('error', { message: error.message || 'Failed to get candidate ideas' });
    }
  });
} 