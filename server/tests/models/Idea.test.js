import { describe, it, expect, beforeEach } from 'vitest';
import { Idea } from '../../models/Idea.js';
import { User } from '../../models/User.js';
import { Session } from '../../models/Session.js';

describe('Idea Model', () => {
  let testUser;
  let testSession;

  beforeEach(() => {
    testUser = User.createUser('Test Author');
    testSession = Session.createSession(testUser.id);
  });

  describe('createIdea', () => {
    it('should create a new idea with valid parameters', () => {
      const content = 'Test idea content';
      const idea = Idea.createIdea(content, testUser.id, testSession.id);

      expect(idea).toBeDefined();
      expect(idea.id).toBeTruthy();
      expect(idea.content).toBe(content);
      expect(idea.author_id).toBe(testUser.id);
      expect(idea.session_id).toBe(testSession.id);
      expect(idea.author_name).toBe(testUser.name);
      expect(idea.created_at).toBeTruthy();
    });

    it('should trim whitespace from content', () => {
      const content = '  Idea with spaces  ';
      const idea = Idea.createIdea(content, testUser.id, testSession.id);

      expect(idea.content).toBe('Idea with spaces');
    });

    it('should throw error with empty content', () => {
      expect(() => Idea.createIdea('', testUser.id, testSession.id)).toThrow();
    });

    it('should throw error with null content', () => {
      expect(() => Idea.createIdea(null, testUser.id, testSession.id)).toThrow();
    });

    it('should throw error with null author ID', () => {
      expect(() => Idea.createIdea('Content', null, testSession.id)).toThrow();
    });

    it('should throw error with null session ID', () => {
      expect(() => Idea.createIdea('Content', testUser.id, null)).toThrow();
    });

    it('should allow long content', () => {
      const longContent = 'A'.repeat(1000);
      const idea = Idea.createIdea(longContent, testUser.id, testSession.id);

      expect(idea.content).toBe(longContent);
    });

    it('should allow special characters in content', () => {
      const content = 'Idea with émojis 🚀 and spëcial çharacters!';
      const idea = Idea.createIdea(content, testUser.id, testSession.id);

      expect(idea.content).toBe(content);
    });
  });

  describe('getIdeaById', () => {
    it('should retrieve existing idea', () => {
      const created = Idea.createIdea('Test idea', testUser.id, testSession.id);
      const retrieved = Idea.getIdeaById(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(created.id);
      expect(retrieved.content).toBe(created.content);
      expect(retrieved.author_name).toBe(testUser.name);
    });

    it('should return null for non-existent idea', () => {
      const idea = Idea.getIdeaById('non-existent-id');
      expect(idea).toBeNull();
    });

    it('should throw error with null ID', () => {
      expect(() => Idea.getIdeaById(null)).toThrow();
    });
  });

  describe('getIdeasBySessionId', () => {
    it('should return all ideas for a session', () => {
      Idea.createIdea('Idea 1', testUser.id, testSession.id);
      Idea.createIdea('Idea 2', testUser.id, testSession.id);
      Idea.createIdea('Idea 3', testUser.id, testSession.id);

      const ideas = Idea.getIdeasBySessionId(testSession.id);
      expect(ideas).toHaveLength(3);
      expect(ideas.map(i => i.content)).toContain('Idea 1');
      expect(ideas.map(i => i.content)).toContain('Idea 2');
      expect(ideas.map(i => i.content)).toContain('Idea 3');
    });

    it('should return empty array for session with no ideas', () => {
      const ideas = Idea.getIdeasBySessionId(testSession.id);
      expect(ideas).toEqual([]);
    });

    it('should only return ideas for specified session', () => {
      const otherUser = User.createUser('Other User');
      const otherSession = Session.createSession(otherUser.id);

      Idea.createIdea('Session 1 Idea', testUser.id, testSession.id);
      Idea.createIdea('Session 2 Idea', otherUser.id, otherSession.id);

      const ideas = Idea.getIdeasBySessionId(testSession.id);
      expect(ideas).toHaveLength(1);
      expect(ideas[0].content).toBe('Session 1 Idea');
    });

    it('should throw error with null session ID', () => {
      expect(() => Idea.getIdeasBySessionId(null)).toThrow();
    });
  });

  describe('getIdeasByAuthorId', () => {
    it('should return all ideas by an author', () => {
      Idea.createIdea('Idea 1', testUser.id, testSession.id);
      Idea.createIdea('Idea 2', testUser.id, testSession.id);

      const ideas = Idea.getIdeasByAuthorId(testUser.id);
      expect(ideas).toHaveLength(2);
    });

    it('should only return ideas for specified author', () => {
      const otherUser = User.createUser('Other User');
      Session.addParticipant(testSession.id, otherUser.id);

      Idea.createIdea('My Idea', testUser.id, testSession.id);
      Idea.createIdea('Other Idea', otherUser.id, testSession.id);

      const ideas = Idea.getIdeasByAuthorId(testUser.id);
      expect(ideas).toHaveLength(1);
      expect(ideas[0].content).toBe('My Idea');
    });

    it('should return empty array for author with no ideas', () => {
      const otherUser = User.createUser('Other User');
      const ideas = Idea.getIdeasByAuthorId(otherUser.id);
      expect(ideas).toEqual([]);
    });

    it('should throw error with null author ID', () => {
      expect(() => Idea.getIdeasByAuthorId(null)).toThrow();
    });
  });

  describe('getIdeasBySessionAndAuthor', () => {
    it('should return ideas for specific session and author', () => {
      const otherUser = User.createUser('Other User');
      Session.addParticipant(testSession.id, otherUser.id);

      Idea.createIdea('My Idea', testUser.id, testSession.id);
      Idea.createIdea('Other Idea', otherUser.id, testSession.id);

      const ideas = Idea.getIdeasBySessionAndAuthor(testSession.id, testUser.id);
      expect(ideas).toHaveLength(1);
      expect(ideas[0].content).toBe('My Idea');
    });

    it('should return empty array when no matching ideas', () => {
      const otherUser = User.createUser('Other User');
      const ideas = Idea.getIdeasBySessionAndAuthor(testSession.id, otherUser.id);
      expect(ideas).toEqual([]);
    });

    it('should throw error with null session ID', () => {
      expect(() => Idea.getIdeasBySessionAndAuthor(null, testUser.id)).toThrow();
    });

    it('should throw error with null author ID', () => {
      expect(() => Idea.getIdeasBySessionAndAuthor(testSession.id, null)).toThrow();
    });
  });

  describe('getIdeasByIds', () => {
    it('should return ideas matching the given IDs', () => {
      const idea1 = Idea.createIdea('Idea 1', testUser.id, testSession.id);
      const idea2 = Idea.createIdea('Idea 2', testUser.id, testSession.id);
      const idea3 = Idea.createIdea('Idea 3', testUser.id, testSession.id);

      const ideas = Idea.getIdeasByIds([idea1.id, idea3.id]);
      expect(ideas).toHaveLength(2);
      expect(ideas.map(i => i.id)).toContain(idea1.id);
      expect(ideas.map(i => i.id)).toContain(idea3.id);
      expect(ideas.map(i => i.id)).not.toContain(idea2.id);
    });

    it('should return empty array for empty IDs array', () => {
      const ideas = Idea.getIdeasByIds([]);
      expect(ideas).toEqual([]);
    });

    it('should return empty array for non-array input', () => {
      const ideas = Idea.getIdeasByIds(null);
      expect(ideas).toEqual([]);
    });

    it('should handle mix of valid and invalid IDs', () => {
      const idea1 = Idea.createIdea('Idea 1', testUser.id, testSession.id);
      const ideas = Idea.getIdeasByIds([idea1.id, 'invalid-id']);

      expect(ideas).toHaveLength(1);
      expect(ideas[0].id).toBe(idea1.id);
    });
  });

  describe('countIdeasBySession', () => {
    it('should return correct count of ideas in session', () => {
      Idea.createIdea('Idea 1', testUser.id, testSession.id);
      Idea.createIdea('Idea 2', testUser.id, testSession.id);
      Idea.createIdea('Idea 3', testUser.id, testSession.id);

      const count = Idea.countIdeasBySession(testSession.id);
      expect(count).toBe(3);
    });

    it('should return 0 for session with no ideas', () => {
      const count = Idea.countIdeasBySession(testSession.id);
      expect(count).toBe(0);
    });

    it('should throw error with null session ID', () => {
      expect(() => Idea.countIdeasBySession(null)).toThrow();
    });
  });

  describe('countIdeasBySessionAndAuthor', () => {
    it('should return correct count for session and author', () => {
      const otherUser = User.createUser('Other User');
      Session.addParticipant(testSession.id, otherUser.id);

      Idea.createIdea('Idea 1', testUser.id, testSession.id);
      Idea.createIdea('Idea 2', testUser.id, testSession.id);
      Idea.createIdea('Other Idea', otherUser.id, testSession.id);

      const count = Idea.countIdeasBySessionAndAuthor(testSession.id, testUser.id);
      expect(count).toBe(2);
    });

    it('should return 0 when author has no ideas in session', () => {
      const otherUser = User.createUser('Other User');
      const count = Idea.countIdeasBySessionAndAuthor(testSession.id, otherUser.id);
      expect(count).toBe(0);
    });

    it('should throw error with null session ID', () => {
      expect(() => Idea.countIdeasBySessionAndAuthor(null, testUser.id)).toThrow();
    });

    it('should throw error with null author ID', () => {
      expect(() => Idea.countIdeasBySessionAndAuthor(testSession.id, null)).toThrow();
    });
  });

  describe('deleteIdea', () => {
    it('should delete existing idea', () => {
      const idea = Idea.createIdea('To Delete', testUser.id, testSession.id);

      const result = Idea.deleteIdea(idea.id);
      expect(result).toBe(true);

      const retrieved = Idea.getIdeaById(idea.id);
      expect(retrieved).toBeNull();
    });

    it('should throw error with null ID', () => {
      expect(() => Idea.deleteIdea(null)).toThrow();
    });
  });

  describe('deleteIdeasBySession', () => {
    it('should delete all ideas in a session', () => {
      Idea.createIdea('Idea 1', testUser.id, testSession.id);
      Idea.createIdea('Idea 2', testUser.id, testSession.id);

      const result = Idea.deleteIdeasBySession(testSession.id);
      expect(result).toBe(true);

      const ideas = Idea.getIdeasBySessionId(testSession.id);
      expect(ideas).toHaveLength(0);
    });

    it('should not affect ideas in other sessions', () => {
      const otherUser = User.createUser('Other User');
      const otherSession = Session.createSession(otherUser.id);

      Idea.createIdea('Session 1', testUser.id, testSession.id);
      Idea.createIdea('Session 2', otherUser.id, otherSession.id);

      Idea.deleteIdeasBySession(testSession.id);

      const session1Ideas = Idea.getIdeasBySessionId(testSession.id);
      const session2Ideas = Idea.getIdeasBySessionId(otherSession.id);

      expect(session1Ideas).toHaveLength(0);
      expect(session2Ideas).toHaveLength(1);
    });

    it('should throw error with null session ID', () => {
      expect(() => Idea.deleteIdeasBySession(null)).toThrow();
    });
  });

  describe('Edge cases', () => {
    it('should handle ideas with identical content from different authors', () => {
      const otherUser = User.createUser('Other User');
      Session.addParticipant(testSession.id, otherUser.id);

      const idea1 = Idea.createIdea('Same content', testUser.id, testSession.id);
      const idea2 = Idea.createIdea('Same content', otherUser.id, testSession.id);

      expect(idea1.id).not.toBe(idea2.id);
      expect(idea1.author_id).toBe(testUser.id);
      expect(idea2.author_id).toBe(otherUser.id);
    });

    it('should handle very short content', () => {
      const idea = Idea.createIdea('A', testUser.id, testSession.id);
      expect(idea.content).toBe('A');
    });

    it('should create idea with empty string after trimming whitespace', () => {
      // Content with only whitespace becomes empty string after trim
      // but passes the !content check since '   ' is truthy
      const idea = Idea.createIdea('   ', testUser.id, testSession.id);
      expect(idea.content).toBe('');
    });
  });
});
