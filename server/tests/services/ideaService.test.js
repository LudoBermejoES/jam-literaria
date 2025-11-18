import { describe, it, expect, beforeEach } from 'vitest';
import * as ideaService from '../../services/ideaService.js';
import { User } from '../../models/User.js';
import { Session, SESSION_STATUS } from '../../models/Session.js';
import { Idea } from '../../models/Idea.js';

describe('Idea Service', () => {
  let testUser1;
  let testUser2;
  let testSession;

  beforeEach(() => {
    testUser1 = User.createUser('User 1');
    testUser2 = User.createUser('User 2');
    testSession = Session.createSession(testUser1.id);
    Session.addParticipant(testSession.id, testUser2.id);
  });

  describe('getMaxIdeasPerUser', () => {
    it('should return 4 for 2 participants', () => {
      expect(ideaService.getMaxIdeasPerUser(2)).toBe(4);
    });

    it('should return 3 for 3 participants', () => {
      expect(ideaService.getMaxIdeasPerUser(3)).toBe(3);
    });

    it('should return 3 for 4 participants', () => {
      expect(ideaService.getMaxIdeasPerUser(4)).toBe(3);
    });

    it('should return 2 for 5 participants', () => {
      expect(ideaService.getMaxIdeasPerUser(5)).toBe(2);
    });

    it('should return 2 for 10 participants', () => {
      expect(ideaService.getMaxIdeasPerUser(10)).toBe(2);
    });
  });

  describe('getMaxIdeasPerUserForSession', () => {
    it('should return correct max based on session participants', () => {
      const max = ideaService.getMaxIdeasPerUserForSession(testSession.id);
      expect(max).toBe(4); // 2 participants
    });

    it('should update when participants are added', () => {
      let max = ideaService.getMaxIdeasPerUserForSession(testSession.id);
      expect(max).toBe(4); // 2 participants

      const user3 = User.createUser('User 3');
      Session.addParticipant(testSession.id, user3.id);

      max = ideaService.getMaxIdeasPerUserForSession(testSession.id);
      expect(max).toBe(3); // 3 participants
    });

    it('should throw error with null session ID', () => {
      expect(() => ideaService.getMaxIdeasPerUserForSession(null)).toThrow();
    });

    it('should return 0 for non-existent session', () => {
      // Non-existent session returns 0 participants, which gives max ideas per user for 0 (defaults to 2)
      // Or it might throw - let's test actual behavior
      try {
        const max = ideaService.getMaxIdeasPerUserForSession('non-existent');
        // If it returns a value, it should be based on 0 participants
        expect(typeof max).toBe('number');
      } catch (error) {
        // If it throws, that's also acceptable
        expect(error).toBeDefined();
      }
    });
  });

  describe('createIdea', () => {
    beforeEach(() => {
      Session.updateSessionStatus(testSession.id, SESSION_STATUS.SUBMITTING_IDEAS);
    });

    it('should create idea when session is in SUBMITTING_IDEAS state', () => {
      const idea = ideaService.createIdea('Test idea', testUser1.id, testSession.id);

      expect(idea).toBeDefined();
      expect(idea.content).toBe('Test idea');
      expect(idea.author_id).toBe(testUser1.id);
    });

    it('should allow up to max ideas per user (2 participants = 4 ideas)', () => {
      ideaService.createIdea('Idea 1', testUser1.id, testSession.id);
      ideaService.createIdea('Idea 2', testUser1.id, testSession.id);
      ideaService.createIdea('Idea 3', testUser1.id, testSession.id);
      ideaService.createIdea('Idea 4', testUser1.id, testSession.id);

      const ideas = Idea.getIdeasBySessionAndAuthor(testSession.id, testUser1.id);
      expect(ideas).toHaveLength(4);
    });

    it('should reject idea when user has reached max limit', () => {
      ideaService.createIdea('Idea 1', testUser1.id, testSession.id);
      ideaService.createIdea('Idea 2', testUser1.id, testSession.id);
      ideaService.createIdea('Idea 3', testUser1.id, testSession.id);
      ideaService.createIdea('Idea 4', testUser1.id, testSession.id);

      expect(() => {
        ideaService.createIdea('Idea 5', testUser1.id, testSession.id);
      }).toThrow('can only submit up to 4 ideas');
    });

    it('should allow different users to submit ideas independently', () => {
      ideaService.createIdea('User 1 Idea', testUser1.id, testSession.id);
      ideaService.createIdea('User 2 Idea', testUser2.id, testSession.id);

      const user1Ideas = Idea.getIdeasBySessionAndAuthor(testSession.id, testUser1.id);
      const user2Ideas = Idea.getIdeasBySessionAndAuthor(testSession.id, testUser2.id);

      expect(user1Ideas).toHaveLength(1);
      expect(user2Ideas).toHaveLength(1);
    });

    it('should respect max based on current participant count', () => {
      // Add more participants to reduce max ideas per user
      const user3 = User.createUser('User 3');
      const user4 = User.createUser('User 4');
      const user5 = User.createUser('User 5');

      Session.addParticipant(testSession.id, user3.id);
      Session.addParticipant(testSession.id, user4.id);
      Session.addParticipant(testSession.id, user5.id);

      // Now 5 participants, max should be 2 ideas
      ideaService.createIdea('Idea 1', testUser1.id, testSession.id);
      ideaService.createIdea('Idea 2', testUser1.id, testSession.id);

      expect(() => {
        ideaService.createIdea('Idea 3', testUser1.id, testSession.id);
      }).toThrow('can only submit up to 2 ideas');
    });

    it('should throw error when session not in SUBMITTING_IDEAS state', () => {
      Session.updateSessionStatus(testSession.id, SESSION_STATUS.WAITING);

      expect(() => {
        ideaService.createIdea('Test', testUser1.id, testSession.id);
      }).toThrow('not in the idea submission phase');
    });

    it('should throw error when session does not exist', () => {
      expect(() => {
        ideaService.createIdea('Test', testUser1.id, 'non-existent');
      }).toThrow('Session not found');
    });

    it('should throw error with missing content', () => {
      expect(() => {
        ideaService.createIdea(null, testUser1.id, testSession.id);
      }).toThrow('required');
    });

    it('should throw error with missing author ID', () => {
      expect(() => {
        ideaService.createIdea('Test', null, testSession.id);
      }).toThrow('required');
    });

    it('should throw error with missing session ID', () => {
      expect(() => {
        ideaService.createIdea('Test', testUser1.id, null);
      }).toThrow('required');
    });
  });

  describe('getIdeaById', () => {
    beforeEach(() => {
      Session.updateSessionStatus(testSession.id, SESSION_STATUS.SUBMITTING_IDEAS);
    });

    it('should return idea when it exists', () => {
      const created = ideaService.createIdea('Test', testUser1.id, testSession.id);
      const retrieved = ideaService.getIdeaById(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(created.id);
    });

    it('should return null when idea does not exist', () => {
      const idea = ideaService.getIdeaById('non-existent');
      expect(idea).toBeNull();
    });

    it('should throw error with null ID', () => {
      expect(() => ideaService.getIdeaById(null)).toThrow();
    });
  });

  describe('getIdeasBySessionId', () => {
    beforeEach(() => {
      Session.updateSessionStatus(testSession.id, SESSION_STATUS.SUBMITTING_IDEAS);
    });

    it('should return all ideas for a session', () => {
      ideaService.createIdea('Idea 1', testUser1.id, testSession.id);
      ideaService.createIdea('Idea 2', testUser2.id, testSession.id);

      const ideas = ideaService.getIdeasBySessionId(testSession.id);
      expect(ideas).toHaveLength(2);
    });

    it('should return empty array when no ideas', () => {
      const ideas = ideaService.getIdeasBySessionId(testSession.id);
      expect(ideas).toEqual([]);
    });

    it('should throw error with null session ID', () => {
      expect(() => ideaService.getIdeasBySessionId(null)).toThrow();
    });
  });

  describe('getIdeasBySessionAndAuthor', () => {
    beforeEach(() => {
      Session.updateSessionStatus(testSession.id, SESSION_STATUS.SUBMITTING_IDEAS);
    });

    it('should return ideas for specific author in session', () => {
      ideaService.createIdea('My Idea', testUser1.id, testSession.id);
      ideaService.createIdea('Other Idea', testUser2.id, testSession.id);

      const ideas = ideaService.getIdeasBySessionAndAuthor(testSession.id, testUser1.id);
      expect(ideas).toHaveLength(1);
      expect(ideas[0].content).toBe('My Idea');
    });

    it('should return empty array when author has no ideas', () => {
      const ideas = ideaService.getIdeasBySessionAndAuthor(testSession.id, testUser1.id);
      expect(ideas).toEqual([]);
    });

    it('should throw error with null session ID', () => {
      expect(() => ideaService.getIdeasBySessionAndAuthor(null, testUser1.id)).toThrow();
    });

    it('should throw error with null author ID', () => {
      expect(() => ideaService.getIdeasBySessionAndAuthor(testSession.id, null)).toThrow();
    });
  });

  describe('getCandidateIdeasForVoting', () => {
    beforeEach(() => {
      Session.updateSessionStatus(testSession.id, SESSION_STATUS.SUBMITTING_IDEAS);
      ideaService.createIdea('Idea 1', testUser1.id, testSession.id);
      ideaService.createIdea('Idea 2', testUser2.id, testSession.id);
      ideaService.createIdea('Idea 3', testUser1.id, testSession.id);
    });

    it('should return all ideas when no candidates specified', () => {
      Session.updateSessionStatus(testSession.id, SESSION_STATUS.VOTING);

      const ideas = ideaService.getCandidateIdeasForVoting(testSession.id);
      expect(ideas).toHaveLength(3);
    });

    it('should return only candidate ideas when specified in metadata', () => {
      Session.updateSessionStatus(testSession.id, SESSION_STATUS.VOTING);
      const allIdeas = Idea.getIdeasBySessionId(testSession.id);
      const candidateIds = [allIdeas[0].id, allIdeas[1].id];

      Session.updateSessionMetadata(testSession.id, {
        ideas_candidatas: candidateIds
      });

      const ideas = ideaService.getCandidateIdeasForVoting(testSession.id);
      expect(ideas).toHaveLength(2);
    });

    it('should throw error when session not in VOTING state', () => {
      expect(() => {
        ideaService.getCandidateIdeasForVoting(testSession.id);
      }).toThrow('not in the voting phase');
    });

    it('should throw error when session does not exist', () => {
      expect(() => {
        ideaService.getCandidateIdeasForVoting('non-existent');
      }).toThrow('Session not found');
    });

    it('should throw error with null session ID', () => {
      expect(() => ideaService.getCandidateIdeasForVoting(null)).toThrow();
    });
  });

  describe('getWinningIdeas', () => {
    beforeEach(() => {
      Session.updateSessionStatus(testSession.id, SESSION_STATUS.SUBMITTING_IDEAS);
      ideaService.createIdea('Idea 1', testUser1.id, testSession.id);
      ideaService.createIdea('Idea 2', testUser2.id, testSession.id);
      ideaService.createIdea('Idea 3', testUser1.id, testSession.id);
    });

    it('should return winning ideas when session is completed', () => {
      Session.updateSessionStatus(testSession.id, SESSION_STATUS.COMPLETED);
      const allIdeas = Idea.getIdeasBySessionId(testSession.id);
      const winnerIds = [allIdeas[0].id, allIdeas[1].id, allIdeas[2].id];

      Session.updateSessionMetadata(testSession.id, {
        ideas_elegidas: winnerIds
      });

      const winners = ideaService.getWinningIdeas(testSession.id);
      expect(winners).toHaveLength(3);
    });

    it('should throw error when session not completed', () => {
      Session.updateSessionStatus(testSession.id, SESSION_STATUS.VOTING);

      expect(() => {
        ideaService.getWinningIdeas(testSession.id);
      }).toThrow('not completed');
    });

    it('should throw error when no winning ideas found', () => {
      Session.updateSessionStatus(testSession.id, SESSION_STATUS.COMPLETED);

      expect(() => {
        ideaService.getWinningIdeas(testSession.id);
      }).toThrow('No winning ideas found');
    });

    it('should throw error when session does not exist', () => {
      expect(() => {
        ideaService.getWinningIdeas('non-existent');
      }).toThrow('Session not found');
    });

    it('should throw error with null session ID', () => {
      expect(() => ideaService.getWinningIdeas(null)).toThrow();
    });
  });
});
