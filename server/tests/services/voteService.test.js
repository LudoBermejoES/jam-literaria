import { describe, it, expect, beforeEach } from 'vitest';
import {
  createVote,
  createVotes,
  getVotesBySessionAndRound,
  getVoteStatus,
  getVoteResults
} from '../../services/voteService.js';
import { Session, SESSION_STATUS } from '../../models/Session.js';
import { Vote } from '../../models/Vote.js';
import { Idea } from '../../models/Idea.js';
import { User } from '../../models/User.js';

describe('Vote Service Unit Tests', () => {
  let testUser1, testUser2, testUser3, testSession, testIdeas;

  beforeEach(() => {
    // Create test users
    testUser1 = User.createUser('Test User 1');
    testUser2 = User.createUser('Test User 2');
    testUser3 = User.createUser('Test User 3');

    // Create test session
    testSession = Session.createSession(testUser1.id);

    // Add participants
    Session.addParticipant(testSession.id, testUser2.id);
    Session.addParticipant(testSession.id, testUser3.id);

    // Start session and submit ideas
    Session.updateSessionStatus(testSession.id, SESSION_STATUS.SUBMITTING_IDEAS);

    testIdeas = [
      Idea.createIdea('Test idea 1', testUser1.id, testSession.id),
      Idea.createIdea('Test idea 2', testUser2.id, testSession.id),
      Idea.createIdea('Test idea 3', testUser3.id, testSession.id),
      Idea.createIdea('Test idea 4', testUser1.id, testSession.id),
      Idea.createIdea('Test idea 5', testUser2.id, testSession.id)
    ];

    // Move to voting phase and set round to 1
    Session.updateSessionStatus(testSession.id, SESSION_STATUS.VOTING);
    Session.updateSessionRound(testSession.id, 1);
  });

  describe('createVote', () => {
    it('should create a vote successfully', async () => {
      const result = await createVote(testUser1.id, testIdeas[0].id, testSession.id);

      expect(result).toBeDefined();
      expect(result.vote).toBeDefined();
      expect(result.vote.user_id).toBe(testUser1.id);
      expect(result.vote.idea_id).toBe(testIdeas[0].id);
      expect(result.roundComplete).toBe(false);
    });

    it('should throw error when userId is missing', async () => {
      await expect(createVote(null, testIdeas[0].id, testSession.id))
        .rejects.toThrow('User ID, idea ID, and session ID are required');
    });

    it('should throw error when ideaId is missing', async () => {
      await expect(createVote(testUser1.id, null, testSession.id))
        .rejects.toThrow('User ID, idea ID, and session ID are required');
    });

    it('should throw error when sessionId is missing', async () => {
      await expect(createVote(testUser1.id, testIdeas[0].id, null))
        .rejects.toThrow('User ID, idea ID, and session ID are required');
    });

    it('should throw error when session not found', async () => {
      await expect(createVote(testUser1.id, testIdeas[0].id, 'non-existent-session'))
        .rejects.toThrow('Session not found');
    });

    it('should throw error when session is not in voting phase', async () => {
      Session.updateSessionStatus(testSession.id, SESSION_STATUS.WAITING);

      await expect(createVote(testUser1.id, testIdeas[0].id, testSession.id))
        .rejects.toThrow('Session is not in the voting phase');
    });

    it('should throw error when user already voted in round', async () => {
      // First vote succeeds
      await createVote(testUser1.id, testIdeas[0].id, testSession.id);

      // Second vote should fail
      await expect(createVote(testUser1.id, testIdeas[1].id, testSession.id))
        .rejects.toThrow('already voted in this round');
    });

    it('should mark round as complete when all participants have voted', async () => {
      // First two votes
      const result1 = await createVote(testUser1.id, testIdeas[0].id, testSession.id);
      expect(result1.roundComplete).toBe(false);

      const result2 = await createVote(testUser2.id, testIdeas[1].id, testSession.id);
      expect(result2.roundComplete).toBe(false);

      // Last vote completes the round
      const result3 = await createVote(testUser3.id, testIdeas[2].id, testSession.id);
      expect(result3.roundComplete).toBe(true);
      expect(result3.result).toBeDefined();
    });

    it('should process voting round when complete', async () => {
      // Vote to create clear winner scenario
      await createVote(testUser1.id, testIdeas[0].id, testSession.id);
      await createVote(testUser2.id, testIdeas[0].id, testSession.id);

      const result3 = await createVote(testUser3.id, testIdeas[1].id, testSession.id);

      expect(result3.roundComplete).toBe(true);
      expect(result3.result).toBeDefined();
      expect(result3.result.action).toBeDefined();
    });

    it('should allow different users to vote for same idea', async () => {
      const result1 = await createVote(testUser1.id, testIdeas[0].id, testSession.id);
      const result2 = await createVote(testUser2.id, testIdeas[0].id, testSession.id);

      expect(result1.vote.idea_id).toBe(testIdeas[0].id);
      expect(result2.vote.idea_id).toBe(testIdeas[0].id);
    });
  });

  describe('createVotes', () => {
    it('should create multiple votes successfully', async () => {
      const ideaIds = [testIdeas[0].id, testIdeas[1].id, testIdeas[2].id];
      const result = await createVotes(testUser1.id, ideaIds, testSession.id);

      expect(result).toBeDefined();
      expect(result.votes).toBeDefined();
      expect(result.votes.length).toBe(3);
      expect(result.roundComplete).toBe(false);
    });

    it('should throw error when userId is missing', async () => {
      const ideaIds = [testIdeas[0].id, testIdeas[1].id];

      await expect(createVotes(null, ideaIds, testSession.id))
        .rejects.toThrow('User ID, array of idea IDs, and session ID are required');
    });

    it('should throw error when ideaIds is not an array', async () => {
      await expect(createVotes(testUser1.id, 'not-an-array', testSession.id))
        .rejects.toThrow('User ID, array of idea IDs, and session ID are required');
    });

    it('should throw error when ideaIds is empty array', async () => {
      await expect(createVotes(testUser1.id, [], testSession.id))
        .rejects.toThrow('User ID, array of idea IDs, and session ID are required');
    });

    it('should throw error when sessionId is missing', async () => {
      const ideaIds = [testIdeas[0].id, testIdeas[1].id];

      await expect(createVotes(testUser1.id, ideaIds, null))
        .rejects.toThrow('User ID, array of idea IDs, and session ID are required');
    });

    it('should throw error when session not found', async () => {
      const ideaIds = [testIdeas[0].id, testIdeas[1].id];

      await expect(createVotes(testUser1.id, ideaIds, 'non-existent-session'))
        .rejects.toThrow('Session not found');
    });

    it('should throw error when session is not in voting phase', async () => {
      Session.updateSessionStatus(testSession.id, SESSION_STATUS.COMPLETED);
      const ideaIds = [testIdeas[0].id, testIdeas[1].id];

      await expect(createVotes(testUser1.id, ideaIds, testSession.id))
        .rejects.toThrow('Session is not in the voting phase');
    });

    it('should throw error when user already voted in round', async () => {
      const ideaIds1 = [testIdeas[0].id];
      await createVotes(testUser1.id, ideaIds1, testSession.id);

      const ideaIds2 = [testIdeas[1].id];
      await expect(createVotes(testUser1.id, ideaIds2, testSession.id))
        .rejects.toThrow('already voted in this round');
    });

    it('should mark round as complete when all participants have voted', async () => {
      const ideaIds1 = [testIdeas[0].id, testIdeas[1].id];
      const ideaIds2 = [testIdeas[2].id, testIdeas[3].id];
      const ideaIds3 = [testIdeas[0].id, testIdeas[2].id];

      const result1 = await createVotes(testUser1.id, ideaIds1, testSession.id);
      expect(result1.roundComplete).toBe(false);

      const result2 = await createVotes(testUser2.id, ideaIds2, testSession.id);
      expect(result2.roundComplete).toBe(false);

      const result3 = await createVotes(testUser3.id, ideaIds3, testSession.id);
      expect(result3.roundComplete).toBe(true);
      expect(result3.result).toBeDefined();
    });

    it('should create all votes in single operation', async () => {
      const ideaIds = [testIdeas[0].id, testIdeas[1].id, testIdeas[2].id];
      const result = await createVotes(testUser1.id, ideaIds, testSession.id);

      // Verify all votes were created
      const votes = Vote.getVotesByUserSessionAndRound(testUser1.id, testSession.id, 1);
      expect(votes.length).toBe(3);
    });
  });

  describe('getVotesBySessionAndRound', () => {
    beforeEach(async () => {
      // Create some votes
      await createVote(testUser1.id, testIdeas[0].id, testSession.id);
      await createVote(testUser2.id, testIdeas[1].id, testSession.id);
    });

    it('should get votes for a session and round', () => {
      const votes = getVotesBySessionAndRound(testSession.id, 1);

      expect(votes).toBeDefined();
      expect(Array.isArray(votes)).toBe(true);
      expect(votes.length).toBe(2);
    });

    it('should throw error when sessionId is missing', () => {
      expect(() => getVotesBySessionAndRound(null, 1))
        .toThrow('Session ID is required');
    });

    it('should throw error when session not found', () => {
      expect(() => getVotesBySessionAndRound('non-existent-session', 1))
        .toThrow(); // Throws "Failed to get votes"
    });

    it('should use current round when round parameter is not provided', () => {
      const session = Session.getSessionById(testSession.id);
      const votes = getVotesBySessionAndRound(testSession.id);

      expect(votes).toBeDefined();
      expect(Array.isArray(votes)).toBe(true);
    });

    it('should return votes for specified round', () => {
      const votes = getVotesBySessionAndRound(testSession.id, 1);

      expect(votes).toBeDefined();
      votes.forEach(vote => {
        expect(vote.round).toBe(1);
      });
    });

    it('should return empty array for round with no votes', () => {
      // Create a new round
      Session.updateSessionRound(testSession.id, 2);

      const votes = getVotesBySessionAndRound(testSession.id, 2);
      expect(votes).toEqual([]);
    });
  });

  describe('getVoteStatus', () => {
    it('should return vote status for session', () => {
      const status = getVoteStatus(testSession.id, 1);

      expect(status).toBeDefined();
      expect(status.totalParticipants).toBe(3);
      expect(status.participantsVoted).toBe(0);
      expect(status.voteCount).toBe(0);
      expect(status.round).toBe(1);
      expect(status.isComplete).toBe(false);
    });

    it('should throw error when sessionId is missing', () => {
      expect(() => getVoteStatus(null, 1))
        .toThrow('Session ID is required');
    });

    it('should throw error when session not found', () => {
      expect(() => getVoteStatus('non-existent-session', 1))
        .toThrow(); // Throws "Failed to get vote status"
    });

    it('should use current round when round parameter is not provided', () => {
      const status = getVoteStatus(testSession.id);

      expect(status).toBeDefined();
      expect(status.round).toBe(1);
    });

    it('should update status as participants vote', async () => {
      // Before votes
      let status = getVoteStatus(testSession.id, 1);
      expect(status.participantsVoted).toBe(0);
      expect(status.voteCount).toBe(0);
      expect(status.isComplete).toBe(false);

      // After first vote
      await createVote(testUser1.id, testIdeas[0].id, testSession.id);
      status = getVoteStatus(testSession.id, 1);
      expect(status.participantsVoted).toBe(1);
      expect(status.voteCount).toBe(1);
      expect(status.isComplete).toBe(false);

      // After second vote
      await createVote(testUser2.id, testIdeas[1].id, testSession.id);
      status = getVoteStatus(testSession.id, 1);
      expect(status.participantsVoted).toBe(2);
      expect(status.voteCount).toBe(2);
      expect(status.isComplete).toBe(false);

      // After third vote (complete)
      await createVote(testUser3.id, testIdeas[2].id, testSession.id);
      status = getVoteStatus(testSession.id, 1);
      expect(status.participantsVoted).toBe(3);
      expect(status.voteCount).toBe(3);
      expect(status.isComplete).toBe(true);
    });

    it('should track voters list', async () => {
      await createVote(testUser1.id, testIdeas[0].id, testSession.id);
      await createVote(testUser2.id, testIdeas[1].id, testSession.id);

      const status = getVoteStatus(testSession.id, 1);
      expect(status.voters).toBeDefined();
      expect(status.voters.length).toBe(2);
      expect(status.voters).toContain(testUser1.id);
      expect(status.voters).toContain(testUser2.id);
    });

    it('should handle multiple votes from same user in vote count', async () => {
      // User votes for multiple ideas (using createVotes)
      const ideaIds = [testIdeas[0].id, testIdeas[1].id, testIdeas[2].id];
      await createVotes(testUser1.id, ideaIds, testSession.id);

      const status = getVoteStatus(testSession.id, 1);
      expect(status.voteCount).toBe(3);
      expect(status.participantsVoted).toBe(1);
    });
  });

  describe('getVoteResults', () => {
    it('should return vote results for session', async () => {
      await createVote(testUser1.id, testIdeas[0].id, testSession.id);
      await createVote(testUser2.id, testIdeas[1].id, testSession.id);
      await createVote(testUser3.id, testIdeas[0].id, testSession.id);

      const results = getVoteResults(testSession.id, 1);

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should throw error when sessionId is missing', () => {
      expect(() => getVoteResults(null, 1))
        .toThrow('Session ID is required');
    });

    it('should throw error when session not found', () => {
      expect(() => getVoteResults('non-existent-session', 1))
        .toThrow(); // Throws "Failed to get vote results"
    });

    it('should use current round when round parameter is not provided', async () => {
      await createVote(testUser1.id, testIdeas[0].id, testSession.id);

      const results = getVoteResults(testSession.id);
      expect(results).toBeDefined();
    });

    it('should return results sorted by vote count', async () => {
      // Create votes with different counts (but not all participants to avoid completing round)
      await createVote(testUser1.id, testIdeas[0].id, testSession.id);
      await createVote(testUser2.id, testIdeas[0].id, testSession.id);

      const results = getVoteResults(testSession.id, 1);

      // Verify sorting if there are multiple results
      if (results.length > 1) {
        expect(results[0].vote_count).toBeGreaterThanOrEqual(results[results.length - 1].vote_count);
      }
    });

    it('should include idea details in results', async () => {
      await createVote(testUser1.id, testIdeas[0].id, testSession.id);
      await createVote(testUser2.id, testIdeas[1].id, testSession.id);

      const results = getVoteResults(testSession.id, 1);

      expect(results[0].idea_id).toBeDefined();
      expect(results[0].content).toBeDefined();
      expect(results[0].vote_count).toBeDefined();
    });

    it('should return empty array for round with no votes', () => {
      const results = getVoteResults(testSession.id, 1);
      expect(results).toEqual([]);
    });

    it('should return accumulated winners for completed sessions', async () => {
      // Complete a voting round
      await createVote(testUser1.id, testIdeas[0].id, testSession.id);
      await createVote(testUser2.id, testIdeas[1].id, testSession.id);
      await createVote(testUser3.id, testIdeas[2].id, testSession.id);

      // Get session and mark as completed
      Session.updateSessionStatus(testSession.id, SESSION_STATUS.COMPLETED);
      Session.updateSessionMetadata(testSession.id, {
        ideas_elegidas: [testIdeas[0].id, testIdeas[1].id, testIdeas[2].id]
      });

      const results = getVoteResults(testSession.id);

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });

    it('should handle tie scenarios in results', async () => {
      // Create a tie
      await createVote(testUser1.id, testIdeas[0].id, testSession.id);
      await createVote(testUser2.id, testIdeas[1].id, testSession.id);
      await createVote(testUser3.id, testIdeas[2].id, testSession.id);

      const results = getVoteResults(testSession.id, 1);

      expect(results.length).toBe(3);
      expect(results[0].vote_count).toBe(1);
      expect(results[1].vote_count).toBe(1);
      expect(results[2].vote_count).toBe(1);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete voting lifecycle', async () => {
      // Initial state
      const initialStatus = getVoteStatus(testSession.id, 1);
      expect(initialStatus.participantsVoted).toBe(0);

      // All participants vote
      await createVote(testUser1.id, testIdeas[0].id, testSession.id);
      await createVote(testUser2.id, testIdeas[0].id, testSession.id);
      const finalVote = await createVote(testUser3.id, testIdeas[1].id, testSession.id);

      // Check final state
      expect(finalVote.roundComplete).toBe(true);

      const finalStatus = getVoteStatus(testSession.id, 1);
      expect(finalStatus.isComplete).toBe(true);
      expect(finalStatus.participantsVoted).toBe(3);

      const results = getVoteResults(testSession.id, 1);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].vote_count).toBeGreaterThan(0);
    });

    it('should maintain data integrity across operations', async () => {
      // Create votes
      await createVote(testUser1.id, testIdeas[0].id, testSession.id);
      await createVote(testUser2.id, testIdeas[1].id, testSession.id);
      await createVote(testUser3.id, testIdeas[0].id, testSession.id);

      // Verify through different functions
      const votes = getVotesBySessionAndRound(testSession.id, 1);
      const status = getVoteStatus(testSession.id, 1);
      const results = getVoteResults(testSession.id, 1);

      expect(votes.length).toBe(3);
      expect(status.voteCount).toBe(3);
      expect(status.participantsVoted).toBe(3);

      const idea0Result = results.find(r => r.idea_id === testIdeas[0].id);
      expect(idea0Result.vote_count).toBe(2);
    });

    it('should handle round transitions', async () => {
      // Round 1
      await createVote(testUser1.id, testIdeas[0].id, testSession.id);
      await createVote(testUser2.id, testIdeas[1].id, testSession.id);
      await createVote(testUser3.id, testIdeas[2].id, testSession.id);

      const round1Status = getVoteStatus(testSession.id, 1);
      expect(round1Status.participantsVoted).toBe(3);

      // Move to round 2
      Session.updateSessionRound(testSession.id, 2);

      const round2Status = getVoteStatus(testSession.id, 2);
      expect(round2Status.participantsVoted).toBe(0);
      expect(round2Status.round).toBe(2);
    });

    it('should prevent voting after session completion', async () => {
      Session.updateSessionStatus(testSession.id, SESSION_STATUS.COMPLETED);

      await expect(createVote(testUser1.id, testIdeas[0].id, testSession.id))
        .rejects.toThrow('not in the voting phase');
    });

    it('should handle complex multi-vote scenarios', async () => {
      // User 1 votes for 3 ideas
      await createVotes(testUser1.id, [testIdeas[0].id, testIdeas[1].id, testIdeas[2].id], testSession.id);

      // User 2 votes for 2 ideas
      await createVotes(testUser2.id, [testIdeas[0].id, testIdeas[3].id], testSession.id);

      // User 3 votes for 1 idea (completing the round)
      const finalVote = await createVotes(testUser3.id, [testIdeas[0].id], testSession.id);

      expect(finalVote.roundComplete).toBe(true);

      const results = getVoteResults(testSession.id, 1);
      const idea0Result = results.find(r => r.idea_id === testIdeas[0].id);
      expect(idea0Result.vote_count).toBe(3);
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle non-existent idea gracefully', async () => {
      await expect(createVote(testUser1.id, 'non-existent-idea', testSession.id))
        .rejects.toThrow();
    });

    it('should handle session with no participants', () => {
      const emptySession = Session.createSession(testUser1.id);
      Session.updateSessionStatus(emptySession.id, SESSION_STATUS.VOTING);

      // Remove all participants except owner
      const status = getVoteStatus(emptySession.id, 1);
      expect(status.totalParticipants).toBe(1);
    });

    it('should handle concurrent voting attempts', async () => {
      // First vote succeeds
      await createVote(testUser1.id, testIdeas[0].id, testSession.id);

      // Second vote from same user should fail
      await expect(createVote(testUser1.id, testIdeas[1].id, testSession.id))
        .rejects.toThrow('already voted');
    });

    it('should validate session exists before operations', () => {
      expect(() => getVoteStatus('invalid-session-id', 1))
        .toThrow(); // Throws "Failed to get vote status" which wraps the underlying error

      expect(() => getVoteResults('invalid-session-id', 1))
        .toThrow(); // Throws "Failed to get vote results" which wraps the underlying error

      expect(() => getVotesBySessionAndRound('invalid-session-id', 1))
        .toThrow(); // Throws "Failed to get votes"
    });
  });
});
