import { describe, it, expect, beforeEach } from 'vitest';
import { Vote } from '../../models/Vote.js';
import { Idea } from '../../models/Idea.js';
import { User } from '../../models/User.js';
import { Session } from '../../models/Session.js';

describe('Vote Model', () => {
  let testUser1;
  let testUser2;
  let testSession;
  let testIdea1;
  let testIdea2;

  beforeEach(() => {
    testUser1 = User.createUser('Voter 1');
    testUser2 = User.createUser('Voter 2');
    testSession = Session.createSession(testUser1.id);
    Session.addParticipant(testSession.id, testUser2.id);

    testIdea1 = Idea.createIdea('Test Idea 1', testUser1.id, testSession.id);
    testIdea2 = Idea.createIdea('Test Idea 2', testUser2.id, testSession.id);
  });

  describe('createVote', () => {
    it('should create a new vote with valid parameters', () => {
      const vote = Vote.createVote(testUser1.id, testIdea1.id, testSession.id, 0);

      expect(vote).toBeDefined();
      expect(vote.id).toBeTruthy();
      expect(vote.user_id).toBe(testUser1.id);
      expect(vote.idea_id).toBe(testIdea1.id);
      expect(vote.session_id).toBe(testSession.id);
      expect(vote.round).toBe(0);
      expect(vote.voter_name).toBe(testUser1.name);
      expect(vote.idea_content).toBe(testIdea1.content);
      expect(vote.created_at).toBeTruthy();
    });

    it('should allow round 0', () => {
      const vote = Vote.createVote(testUser1.id, testIdea1.id, testSession.id, 0);
      expect(vote.round).toBe(0);
    });

    it('should allow multiple rounds', () => {
      const vote1 = Vote.createVote(testUser1.id, testIdea1.id, testSession.id, 0);
      const vote2 = Vote.createVote(testUser1.id, testIdea2.id, testSession.id, 1);

      expect(vote1.round).toBe(0);
      expect(vote2.round).toBe(1);
    });

    it('should throw error when user votes for same idea twice in same round', () => {
      Vote.createVote(testUser1.id, testIdea1.id, testSession.id, 0);

      expect(() => {
        Vote.createVote(testUser1.id, testIdea1.id, testSession.id, 0);
      }).toThrow('already voted');
    });

    it('should allow different users to vote for same idea in same round', () => {
      const vote1 = Vote.createVote(testUser1.id, testIdea1.id, testSession.id, 0);
      const vote2 = Vote.createVote(testUser2.id, testIdea1.id, testSession.id, 0);

      expect(vote1.user_id).toBe(testUser1.id);
      expect(vote2.user_id).toBe(testUser2.id);
      expect(vote1.idea_id).toBe(vote2.idea_id);
    });

    it('should throw error with null user ID', () => {
      expect(() => Vote.createVote(null, testIdea1.id, testSession.id, 0)).toThrow();
    });

    it('should throw error with null idea ID', () => {
      expect(() => Vote.createVote(testUser1.id, null, testSession.id, 0)).toThrow();
    });

    it('should throw error with null session ID', () => {
      expect(() => Vote.createVote(testUser1.id, testIdea1.id, null, 0)).toThrow();
    });

    it('should throw error with undefined round', () => {
      expect(() => Vote.createVote(testUser1.id, testIdea1.id, testSession.id, undefined)).toThrow();
    });
  });

  describe('getVoteById', () => {
    it('should retrieve existing vote', () => {
      const created = Vote.createVote(testUser1.id, testIdea1.id, testSession.id, 0);
      const retrieved = Vote.getVoteById(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(created.id);
      expect(retrieved.user_id).toBe(testUser1.id);
      expect(retrieved.voter_name).toBe(testUser1.name);
      expect(retrieved.idea_content).toBe(testIdea1.content);
    });

    it('should return null for non-existent vote', () => {
      const vote = Vote.getVoteById('non-existent-id');
      expect(vote).toBeNull();
    });

    it('should throw error with null ID', () => {
      expect(() => Vote.getVoteById(null)).toThrow();
    });
  });

  describe('getVotesBySessionAndRound', () => {
    it('should return all votes for a session and round', () => {
      Vote.createVote(testUser1.id, testIdea1.id, testSession.id, 0);
      Vote.createVote(testUser2.id, testIdea2.id, testSession.id, 0);
      Vote.createVote(testUser1.id, testIdea2.id, testSession.id, 1); // Different round

      const votes = Vote.getVotesBySessionAndRound(testSession.id, 0);
      expect(votes).toHaveLength(2);
    });

    it('should only return votes for specified round', () => {
      Vote.createVote(testUser1.id, testIdea1.id, testSession.id, 0);
      Vote.createVote(testUser2.id, testIdea2.id, testSession.id, 1);

      const round0Votes = Vote.getVotesBySessionAndRound(testSession.id, 0);
      const round1Votes = Vote.getVotesBySessionAndRound(testSession.id, 1);

      expect(round0Votes).toHaveLength(1);
      expect(round1Votes).toHaveLength(1);
    });

    it('should return empty array for session/round with no votes', () => {
      const votes = Vote.getVotesBySessionAndRound(testSession.id, 0);
      expect(votes).toEqual([]);
    });

    it('should throw error with null session ID', () => {
      expect(() => Vote.getVotesBySessionAndRound(null, 0)).toThrow();
    });

    it('should throw error with undefined round', () => {
      expect(() => Vote.getVotesBySessionAndRound(testSession.id, undefined)).toThrow();
    });
  });

  describe('getVotesByUserSessionAndRound', () => {
    it('should return votes for specific user, session, and round', () => {
      Vote.createVote(testUser1.id, testIdea1.id, testSession.id, 0);
      Vote.createVote(testUser1.id, testIdea2.id, testSession.id, 0);
      Vote.createVote(testUser2.id, testIdea1.id, testSession.id, 0);

      const user1Votes = Vote.getVotesByUserSessionAndRound(testUser1.id, testSession.id, 0);
      expect(user1Votes).toHaveLength(2);
      expect(user1Votes.every(v => v.user_id === testUser1.id)).toBe(true);
    });

    it('should return empty array when user has no votes', () => {
      const votes = Vote.getVotesByUserSessionAndRound(testUser2.id, testSession.id, 0);
      expect(votes).toEqual([]);
    });

    it('should throw error with null user ID', () => {
      expect(() => Vote.getVotesByUserSessionAndRound(null, testSession.id, 0)).toThrow();
    });

    it('should throw error with null session ID', () => {
      expect(() => Vote.getVotesByUserSessionAndRound(testUser1.id, null, 0)).toThrow();
    });

    it('should throw error with undefined round', () => {
      expect(() => Vote.getVotesByUserSessionAndRound(testUser1.id, testSession.id, undefined)).toThrow();
    });
  });

  describe('getVoteCountsByIdea', () => {
    it('should return vote counts grouped by idea', () => {
      const user3 = User.createUser('Voter 3');
      Session.addParticipant(testSession.id, user3.id);

      Vote.createVote(testUser1.id, testIdea1.id, testSession.id, 0);
      Vote.createVote(testUser2.id, testIdea1.id, testSession.id, 0);
      Vote.createVote(user3.id, testIdea2.id, testSession.id, 0);

      const counts = Vote.getVoteCountsByIdea(testSession.id, 0);
      expect(counts).toHaveLength(2);

      const idea1Count = counts.find(c => c.idea_id === testIdea1.id);
      const idea2Count = counts.find(c => c.idea_id === testIdea2.id);

      expect(idea1Count.vote_count).toBe(2);
      expect(idea2Count.vote_count).toBe(1);
    });

    it('should order results by vote count (descending)', () => {
      const user3 = User.createUser('Voter 3');
      Session.addParticipant(testSession.id, user3.id);

      Vote.createVote(testUser1.id, testIdea1.id, testSession.id, 0);
      Vote.createVote(testUser2.id, testIdea1.id, testSession.id, 0);
      Vote.createVote(user3.id, testIdea1.id, testSession.id, 0);
      Vote.createVote(testUser1.id, testIdea2.id, testSession.id, 0);

      const counts = Vote.getVoteCountsByIdea(testSession.id, 0);
      expect(counts[0].vote_count).toBeGreaterThan(counts[1].vote_count);
    });

    it('should return empty array when no votes', () => {
      const counts = Vote.getVoteCountsByIdea(testSession.id, 0);
      expect(counts).toEqual([]);
    });

    it('should throw error with null session ID', () => {
      expect(() => Vote.getVoteCountsByIdea(null, 0)).toThrow();
    });

    it('should throw error with undefined round', () => {
      expect(() => Vote.getVoteCountsByIdea(testSession.id, undefined)).toThrow();
    });
  });

  describe('hasUserVotedInRound', () => {
    it('should return true when user has voted', () => {
      Vote.createVote(testUser1.id, testIdea1.id, testSession.id, 0);

      const hasVoted = Vote.hasUserVotedInRound(testUser1.id, testSession.id, 0);
      expect(hasVoted).toBe(true);
    });

    it('should return false when user has not voted', () => {
      const hasVoted = Vote.hasUserVotedInRound(testUser2.id, testSession.id, 0);
      expect(hasVoted).toBe(false);
    });

    it('should be round-specific', () => {
      Vote.createVote(testUser1.id, testIdea1.id, testSession.id, 0);

      const hasVotedRound0 = Vote.hasUserVotedInRound(testUser1.id, testSession.id, 0);
      const hasVotedRound1 = Vote.hasUserVotedInRound(testUser1.id, testSession.id, 1);

      expect(hasVotedRound0).toBe(true);
      expect(hasVotedRound1).toBe(false);
    });

    it('should throw error with null user ID', () => {
      expect(() => Vote.hasUserVotedInRound(null, testSession.id, 0)).toThrow();
    });

    it('should throw error with null session ID', () => {
      expect(() => Vote.hasUserVotedInRound(testUser1.id, null, 0)).toThrow();
    });

    it('should throw error with undefined round', () => {
      expect(() => Vote.hasUserVotedInRound(testUser1.id, testSession.id, undefined)).toThrow();
    });
  });

  describe('countVotesInRound', () => {
    it('should return correct count of votes in round', () => {
      Vote.createVote(testUser1.id, testIdea1.id, testSession.id, 0);
      Vote.createVote(testUser2.id, testIdea2.id, testSession.id, 0);
      Vote.createVote(testUser1.id, testIdea2.id, testSession.id, 1); // Different round

      const count = Vote.countVotesInRound(testSession.id, 0);
      expect(count).toBe(2);
    });

    it('should return 0 when no votes in round', () => {
      const count = Vote.countVotesInRound(testSession.id, 0);
      expect(count).toBe(0);
    });

    it('should throw error with null session ID', () => {
      expect(() => Vote.countVotesInRound(null, 0)).toThrow();
    });

    it('should throw error with undefined round', () => {
      expect(() => Vote.countVotesInRound(testSession.id, undefined)).toThrow();
    });
  });

  describe('getVotersByRound', () => {
    it('should return unique user IDs who voted in round', () => {
      Vote.createVote(testUser1.id, testIdea1.id, testSession.id, 0);
      Vote.createVote(testUser1.id, testIdea2.id, testSession.id, 0); // Same user, different idea
      Vote.createVote(testUser2.id, testIdea1.id, testSession.id, 0);

      const voters = Vote.getVotersByRound(testSession.id, 0);
      expect(voters).toHaveLength(2);
      expect(voters).toContain(testUser1.id);
      expect(voters).toContain(testUser2.id);
    });

    it('should return empty array when no votes in round', () => {
      const voters = Vote.getVotersByRound(testSession.id, 0);
      expect(voters).toEqual([]);
    });

    it('should be round-specific', () => {
      Vote.createVote(testUser1.id, testIdea1.id, testSession.id, 0);
      Vote.createVote(testUser2.id, testIdea1.id, testSession.id, 1);

      const round0Voters = Vote.getVotersByRound(testSession.id, 0);
      const round1Voters = Vote.getVotersByRound(testSession.id, 1);

      expect(round0Voters).toEqual([testUser1.id]);
      expect(round1Voters).toEqual([testUser2.id]);
    });

    it('should throw error with null session ID', () => {
      expect(() => Vote.getVotersByRound(null, 0)).toThrow();
    });

    it('should throw error with undefined round', () => {
      expect(() => Vote.getVotersByRound(testSession.id, undefined)).toThrow();
    });
  });

  describe('deleteUserVotesInRound', () => {
    it('should delete all votes by user in round', () => {
      Vote.createVote(testUser1.id, testIdea1.id, testSession.id, 0);
      Vote.createVote(testUser1.id, testIdea2.id, testSession.id, 0);
      Vote.createVote(testUser2.id, testIdea1.id, testSession.id, 0);

      const result = Vote.deleteUserVotesInRound(testUser1.id, testSession.id, 0);
      expect(result).toBe(true);

      const user1Votes = Vote.getVotesByUserSessionAndRound(testUser1.id, testSession.id, 0);
      const user2Votes = Vote.getVotesByUserSessionAndRound(testUser2.id, testSession.id, 0);

      expect(user1Votes).toHaveLength(0);
      expect(user2Votes).toHaveLength(1);
    });

    it('should not affect votes in other rounds', () => {
      Vote.createVote(testUser1.id, testIdea1.id, testSession.id, 0);
      Vote.createVote(testUser1.id, testIdea2.id, testSession.id, 1);

      Vote.deleteUserVotesInRound(testUser1.id, testSession.id, 0);

      const round0Votes = Vote.getVotesByUserSessionAndRound(testUser1.id, testSession.id, 0);
      const round1Votes = Vote.getVotesByUserSessionAndRound(testUser1.id, testSession.id, 1);

      expect(round0Votes).toHaveLength(0);
      expect(round1Votes).toHaveLength(1);
    });

    it('should throw error with null user ID', () => {
      expect(() => Vote.deleteUserVotesInRound(null, testSession.id, 0)).toThrow();
    });

    it('should throw error with null session ID', () => {
      expect(() => Vote.deleteUserVotesInRound(testUser1.id, null, 0)).toThrow();
    });

    it('should throw error with undefined round', () => {
      expect(() => Vote.deleteUserVotesInRound(testUser1.id, testSession.id, undefined)).toThrow();
    });
  });

  describe('deleteVotesBySession', () => {
    it('should delete all votes in a session', () => {
      Vote.createVote(testUser1.id, testIdea1.id, testSession.id, 0);
      Vote.createVote(testUser2.id, testIdea2.id, testSession.id, 0);

      const result = Vote.deleteVotesBySession(testSession.id);
      expect(result).toBe(true);

      const votes = Vote.getVotesBySessionAndRound(testSession.id, 0);
      expect(votes).toHaveLength(0);
    });

    it('should not affect votes in other sessions', () => {
      const otherUser = User.createUser('Other User');
      const otherSession = Session.createSession(otherUser.id);
      const otherIdea = Idea.createIdea('Other Idea', otherUser.id, otherSession.id);

      Vote.createVote(testUser1.id, testIdea1.id, testSession.id, 0);
      Vote.createVote(otherUser.id, otherIdea.id, otherSession.id, 0);

      Vote.deleteVotesBySession(testSession.id);

      const session1Votes = Vote.getVotesBySessionAndRound(testSession.id, 0);
      const session2Votes = Vote.getVotesBySessionAndRound(otherSession.id, 0);

      expect(session1Votes).toHaveLength(0);
      expect(session2Votes).toHaveLength(1);
    });

    it('should throw error with null session ID', () => {
      expect(() => Vote.deleteVotesBySession(null)).toThrow();
    });
  });

  describe('deleteVotesByRound', () => {
    it('should delete all votes in a specific round', () => {
      Vote.createVote(testUser1.id, testIdea1.id, testSession.id, 0);
      Vote.createVote(testUser2.id, testIdea2.id, testSession.id, 0);
      Vote.createVote(testUser1.id, testIdea2.id, testSession.id, 1);

      const result = Vote.deleteVotesByRound(testSession.id, 0);
      expect(result).toBe(true);

      const round0Votes = Vote.getVotesBySessionAndRound(testSession.id, 0);
      const round1Votes = Vote.getVotesBySessionAndRound(testSession.id, 1);

      expect(round0Votes).toHaveLength(0);
      expect(round1Votes).toHaveLength(1);
    });

    it('should throw error with null session ID', () => {
      expect(() => Vote.deleteVotesByRound(null, 0)).toThrow();
    });

    it('should throw error with undefined round', () => {
      expect(() => Vote.deleteVotesByRound(testSession.id, undefined)).toThrow();
    });
  });

  describe('getTotalVoteCountsForIdeas', () => {
    it('should return total vote counts across all rounds', () => {
      Vote.createVote(testUser1.id, testIdea1.id, testSession.id, 0);
      Vote.createVote(testUser2.id, testIdea1.id, testSession.id, 0);
      Vote.createVote(testUser1.id, testIdea1.id, testSession.id, 1);
      Vote.createVote(testUser2.id, testIdea2.id, testSession.id, 0);

      const counts = Vote.getTotalVoteCountsForIdeas(testSession.id, [testIdea1.id, testIdea2.id]);

      const idea1Count = counts.find(c => c.idea_id === testIdea1.id);
      const idea2Count = counts.find(c => c.idea_id === testIdea2.id);

      expect(idea1Count.total_vote_count).toBe(3); // 2 in round 0, 1 in round 1
      expect(idea2Count.total_vote_count).toBe(1);
    });

    it('should only return counts for specified ideas', () => {
      const idea3 = Idea.createIdea('Idea 3', testUser1.id, testSession.id);

      Vote.createVote(testUser1.id, testIdea1.id, testSession.id, 0);
      Vote.createVote(testUser2.id, idea3.id, testSession.id, 0);

      const counts = Vote.getTotalVoteCountsForIdeas(testSession.id, [testIdea1.id]);

      expect(counts).toHaveLength(1);
      expect(counts[0].idea_id).toBe(testIdea1.id);
    });

    it('should throw error with null session ID', () => {
      expect(() => Vote.getTotalVoteCountsForIdeas(null, [testIdea1.id])).toThrow();
    });

    it('should throw error with empty idea IDs array', () => {
      expect(() => Vote.getTotalVoteCountsForIdeas(testSession.id, [])).toThrow();
    });

    it('should throw error with non-array idea IDs', () => {
      expect(() => Vote.getTotalVoteCountsForIdeas(testSession.id, null)).toThrow();
    });
  });

  describe('Edge cases', () => {
    it('should handle user voting for multiple ideas in same round', () => {
      const idea3 = Idea.createIdea('Idea 3', testUser1.id, testSession.id);

      Vote.createVote(testUser1.id, testIdea1.id, testSession.id, 0);
      Vote.createVote(testUser1.id, testIdea2.id, testSession.id, 0);
      Vote.createVote(testUser1.id, idea3.id, testSession.id, 0);

      const votes = Vote.getVotesByUserSessionAndRound(testUser1.id, testSession.id, 0);
      expect(votes).toHaveLength(3);
    });

    it('should handle same user voting in multiple rounds', () => {
      Vote.createVote(testUser1.id, testIdea1.id, testSession.id, 0);
      Vote.createVote(testUser1.id, testIdea1.id, testSession.id, 1);
      Vote.createVote(testUser1.id, testIdea1.id, testSession.id, 2);

      const allVotes = [
        ...Vote.getVotesBySessionAndRound(testSession.id, 0),
        ...Vote.getVotesBySessionAndRound(testSession.id, 1),
        ...Vote.getVotesBySessionAndRound(testSession.id, 2)
      ];

      expect(allVotes).toHaveLength(3);
    });

    it('should handle high round numbers', () => {
      const vote = Vote.createVote(testUser1.id, testIdea1.id, testSession.id, 999);
      expect(vote.round).toBe(999);
    });
  });
});
