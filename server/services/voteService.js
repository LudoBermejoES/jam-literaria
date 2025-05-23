import { Vote } from '../models/Vote.js';
import { Session, SESSION_STATUS } from '../models/Session.js';
import * as votingService from './votingService.js';

/**
 * Create a new vote
 * @param {string} userId - ID of the user voting
 * @param {string} ideaId - ID of the idea being voted for
 * @param {string} sessionId - ID of the session
 * @returns {Object} Created vote and session status update
 */
export async function createVote(userId, ideaId, sessionId) {
  if (!userId || !ideaId || !sessionId) {
    throw new Error('User ID, idea ID, and session ID are required');
  }
  
  try {
    // Check if session exists and is in the voting phase
    const session = Session.getSessionById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    
    if (session.status !== SESSION_STATUS.VOTING) {
      throw new Error('Session is not in the voting phase');
    }
    
    const round = session.current_round;
    
    // Check if the user has already voted in this round
    if (Vote.hasUserVotedInRound(userId, sessionId, round)) {
      throw new Error('You have already voted in this round');
    }
    
    // Record the vote
    const vote = Vote.createVote(userId, ideaId, sessionId, round);
    
    // Check if all participants have voted
    const participants = Session.getParticipants(sessionId);
    const votersCount = Vote.getVotersByRound(sessionId, round).length;
    
    // If all participants have voted, process the round
    if (votersCount >= participants.length) {
      // Process the voting round and determine the next action
      const result = await votingService.processVotingRound(sessionId, round);
      
      return {
        vote,
        roundComplete: true,
        result
      };
    }
    
    return {
      vote,
      roundComplete: false
    };
  } catch (error) {
    console.error('Error creating vote:', error);
    throw error;
  }
}

/**
 * Create multiple votes for a user in a single transaction
 * @param {string} userId - ID of the user voting
 * @param {Array} ideaIds - Array of idea IDs being voted for
 * @param {string} sessionId - ID of the session
 * @returns {Object} Created votes and session status update
 */
export async function createVotes(userId, ideaIds, sessionId) {
  if (!userId || !Array.isArray(ideaIds) || ideaIds.length === 0 || !sessionId) {
    throw new Error('User ID, array of idea IDs, and session ID are required');
  }
  
  try {
    // Check if session exists and is in the voting phase
    const session = Session.getSessionById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    
    if (session.status !== SESSION_STATUS.VOTING) {
      throw new Error('Session is not in the voting phase');
    }
    
    const round = session.current_round;
    
    // Check if the user has already voted in this round
    if (Vote.hasUserVotedInRound(userId, sessionId, round)) {
      throw new Error('You have already voted in this round');
    }
    
    // Record all votes
    const votes = [];
    for (const ideaId of ideaIds) {
      const vote = Vote.createVote(userId, ideaId, sessionId, round);
      votes.push(vote);
    }
    
    // Check if all participants have voted
    const participants = Session.getParticipants(sessionId);
    const votersCount = Vote.getVotersByRound(sessionId, round).length;
    
    // If all participants have voted, process the round
    if (votersCount >= participants.length) {
      // Process the voting round and determine the next action
      const result = await votingService.processVotingRound(sessionId, round);
      
      return {
        votes,
        roundComplete: true,
        result
      };
    }
    
    return {
      votes,
      roundComplete: false
    };
  } catch (error) {
    console.error('Error creating votes:', error);
    throw error;
  }
}

/**
 * Get votes by session and round
 * @param {string} sessionId - Session ID
 * @param {number} round - Voting round number (optional, defaults to current round)
 * @returns {Array} Array of vote objects
 */
export function getVotesBySessionAndRound(sessionId, round) {
  if (!sessionId) {
    throw new Error('Session ID is required');
  }
  
  try {
    const session = Session.getSessionById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    
    // If round is not specified, use the current round
    const currentRound = round !== undefined ? round : session.current_round;
    
    return Vote.getVotesBySessionAndRound(sessionId, currentRound);
  } catch (error) {
    console.error('Error getting votes:', error);
    throw new Error('Failed to get votes');
  }
}

/**
 * Get vote status for a round
 * @param {string} sessionId - Session ID
 * @param {number} round - Voting round number (optional, defaults to current round)
 * @returns {Object} Vote status object with counts and participants
 */
export function getVoteStatus(sessionId, round) {
  if (!sessionId) {
    throw new Error('Session ID is required');
  }
  
  try {
    const session = Session.getSessionById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    
    // If round is not specified, use the current round
    const currentRound = round !== undefined ? round : session.current_round;
    
    const participants = Session.getParticipants(sessionId);
    const voters = Vote.getVotersByRound(sessionId, currentRound);
    const voteCount = Vote.countVotesInRound(sessionId, currentRound);
    
    return {
      totalParticipants: participants.length,
      participantsVoted: voters.length,
      voteCount,
      voters,
      round: currentRound,
      isComplete: voters.length >= participants.length
    };
  } catch (error) {
    console.error('Error getting vote status:', error);
    throw new Error('Failed to get vote status');
  }
}

/**
 * Get vote results for a round
 * @param {string} sessionId - Session ID
 * @param {number} round - Voting round number (optional, defaults to current round)
 * @returns {Array} Array of ideas with vote counts
 */
export function getVoteResults(sessionId, round) {
  if (!sessionId) {
    throw new Error('Session ID is required');
  }
  
  try {
    const session = Session.getSessionById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    
    // If round is not specified, use the current round
    const currentRound = round !== undefined ? round : session.current_round;
    
    return Vote.getVoteCountsByIdea(sessionId, currentRound);
  } catch (error) {
    console.error('Error getting vote results:', error);
    throw new Error('Failed to get vote results');
  }
} 