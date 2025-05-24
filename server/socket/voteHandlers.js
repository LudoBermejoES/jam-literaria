import * as voteService from '../services/voteService.js';
import * as sessionService from '../services/sessionService.js';
import * as ideaService from '../services/ideaService.js';
import { SESSION_STATUS } from '../models/Session.js';
import { calculateRequiredVotes } from '../services/votingService.js';

/**
 * Socket handlers for vote-related events
 * @param {Object} io - Socket.IO server instance
 * @param {Object} socket - Socket connection
 */
export function voteHandlers(io, socket) {
  /**
   * Submit multiple votes in a single call
   */
  socket.on('submit-votes', async ({ sessionId, ideaIds }) => {
    try {
      if (!sessionId || !Array.isArray(ideaIds) || ideaIds.length === 0) {
        socket.emit('error', { message: 'Session ID and array of idea IDs are required' });
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
      
      // Get session metadata to check required votes
      const metadata = sessionService.getSessionMetadata(sessionId);
      let requiredVotes = 3; // Default for first round
      
      console.log(`Vote validation - Session: ${sessionId}, Round: ${session.current_round}, Metadata:`, metadata);
      
      // Calculate required votes based on current state
      let ideaCount;
      let remainingSlots = 3; // Total winners needed
      
      // Check if we're in a subsequent round with candidate ideas
      if (metadata && metadata.ideas_candidatas && Array.isArray(metadata.ideas_candidatas)) {
        // Use candidate ideas for subsequent rounds
        ideaCount = metadata.ideas_candidatas.length;
        console.log(`Using candidate ideas count: ${ideaCount} ideas`);
        
        // Calculate how many winners we still need
        const alreadySelected = metadata.ideas_elegidas ? metadata.ideas_elegidas.length : 0;
        remainingSlots = 3 - alreadySelected;
        console.log(`Already selected: ${alreadySelected}, remaining slots: ${remainingSlots}`);
        
        // Required votes should be minimum of calculated votes for idea count and remaining slots
        const calculatedVotes = calculateRequiredVotes(ideaCount);
        requiredVotes = Math.min(calculatedVotes, remainingSlots);
        console.log(`Calculated votes for ${ideaCount} ideas: ${calculatedVotes}, limited by remaining slots: ${requiredVotes}`);
      } else {
        // Use all session ideas for first round
        const ideas = ideaService.getIdeasBySessionId(sessionId);
        ideaCount = ideas.length;
        console.log(`Using all session ideas count: ${ideaCount} ideas`);
        requiredVotes = calculateRequiredVotes(ideaCount);
        console.log(`Calculated required votes: ${requiredVotes} for ${ideaCount} ideas`);
      }
      
      // Update metadata with the calculated value
      sessionService.updateSessionMetadata(sessionId, {
        required_votes: requiredVotes
      });
      
      console.log(`Final required votes: ${requiredVotes}, User submitted: ${ideaIds.length}`);
      
      // Validate the number of votes
      if (ideaIds.length !== requiredVotes) {
        socket.emit('error', { 
          message: `You must select exactly ${requiredVotes} idea${requiredVotes !== 1 ? 's' : ''}` 
        });
        return;
      }
      
      // Submit all votes
      const result = await voteService.createVotes(socket.userId, ideaIds, sessionId);
      
      // Notify the user that their votes were registered
      socket.emit('vote-confirmed', {
        ideaIds,
        round: session.current_round,
        requiredVotes
      });
      
      // Notify all participants about the votes (without revealing who voted for what)
      io.to(`session:${sessionId}`).emit('vote-submitted', {
        userId: socket.userId,
        userName: socket.user.name,
        round: session.current_round,
        requiredVotes
      });
      
      // If all participants have voted and the round is complete
      if (result.roundComplete) {
        // Notify all participants about the round result
        if (result.result.action === 'COMPLETE') {
          // If the voting is complete, notify about the final results
          io.to(`session:${sessionId}`).emit('voting-complete', {
            selectedIdeas: result.result.selectedIdeas,
            message: result.result.message
          });
        } else if (result.result.action === 'NEW_ROUND') {
          // If a new voting round is needed, notify about the new round
          io.to(`session:${sessionId}`).emit('new-voting-round', {
            round: result.result.round,
            candidateIdeas: result.result.candidateIdeas,
            requiredVotes: result.result.requiredVotes,
            accumulatedWinners: result.result.accumulatedWinners,
            message: result.result.message
          });
        }
      }
      
      console.log(`User ${socket.userId} submitted ${ideaIds.length} votes in session ${sessionId}`);
    } catch (error) {
      console.error('Error in submit-votes:', error);
      socket.emit('error', { message: error.message || 'Failed to submit votes' });
    }
  });

  /**
   * Submit a vote
   */
  socket.on('submit-vote', async ({ sessionId, ideaId }) => {
    try {
      if (!sessionId || !ideaId) {
        socket.emit('error', { message: 'Session ID and idea ID are required' });
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
      
      // Submit the vote
      const result = await voteService.createVote(socket.userId, ideaId, sessionId);
      
      // Notify the user that their vote was registered
      socket.emit('vote-confirmed', {
        ideaId,
        round: session.current_round
      });
      
      // Notify all participants about the vote (without revealing who voted for what)
      io.to(`session:${sessionId}`).emit('vote-submitted', {
        userId: socket.userId,
        userName: socket.user.name,
        round: session.current_round
      });
      
      // If all participants have voted and the round is complete
      if (result.roundComplete) {
        // Notify all participants about the round result
        if (result.result.action === 'COMPLETE') {
          // If the voting is complete, notify about the final results
          io.to(`session:${sessionId}`).emit('voting-complete', {
            selectedIdeas: result.result.selectedIdeas,
            message: result.result.message
          });
        } else if (result.result.action === 'NEW_ROUND') {
          // If a new voting round is needed, notify about the new round
          io.to(`session:${sessionId}`).emit('new-voting-round', {
            round: result.result.round,
            candidateIdeas: result.result.candidateIdeas,
            requiredVotes: result.result.requiredVotes,
            accumulatedWinners: result.result.accumulatedWinners,
            message: result.result.message
          });
        }
      }
      
      console.log(`User ${socket.userId} submitted vote in session ${sessionId}`);
    } catch (error) {
      console.error('Error in submit-vote:', error);
      socket.emit('error', { message: error.message || 'Failed to submit vote' });
    }
  });
  
  /**
   * Get vote status for a session
   */
  socket.on('get-vote-status', async ({ sessionId }) => {
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
      
      // Get vote status
      const status = voteService.getVoteStatus(sessionId);
      
      // Send status to the requesting user
      socket.emit('vote-status', {
        sessionId,
        status
      });
      
      console.log(`User ${socket.userId} requested vote status for session ${sessionId}`);
    } catch (error) {
      console.error('Error in get-vote-status:', error);
      socket.emit('error', { message: error.message || 'Failed to get vote status' });
    }
  });
  
  /**
   * Get vote results for a session
   */
  socket.on('get-vote-results', async ({ sessionId }) => {
    try {
      if (!sessionId) {
        socket.emit('error', { message: 'Session ID is required' });
        return;
      }
      
      // Check if session exists and is completed
      const session = sessionService.getSessionById(sessionId);
      if (!session) {
        socket.emit('error', { message: 'Session not found' });
        return;
      }
      
      if (session.status !== SESSION_STATUS.COMPLETED) {
        socket.emit('error', { message: 'Session is not completed' });
        return;
      }
      
      // Get vote results
      const results = voteService.getVoteResults(sessionId);
      
      // Send results to the requesting user
      socket.emit('vote-results', {
        sessionId,
        results
      });
      
      console.log(`User ${socket.userId} requested vote results for session ${sessionId}`);
    } catch (error) {
      console.error('Error in get-vote-results:', error);
      socket.emit('error', { message: error.message || 'Failed to get vote results' });
    }
  });
} 