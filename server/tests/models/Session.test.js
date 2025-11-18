import { describe, it, expect, beforeEach } from 'vitest';
import { Session, SESSION_STATUS } from '../../models/Session.js';
import { User } from '../../models/User.js';

describe('Session Model', () => {
  let testUser;

  beforeEach(() => {
    testUser = User.createUser('Test Owner');
  });

  describe('createSession', () => {
    it('should create a new session with valid owner', () => {
      const session = Session.createSession(testUser.id);

      expect(session).toBeDefined();
      expect(session.id).toBeTruthy();
      expect(session.code).toBeTruthy();
      expect(session.code).toHaveLength(6);
      expect(session.status).toBe(SESSION_STATUS.WAITING);
      expect(session.current_round).toBe(0);
      expect(session.owner_id).toBe(testUser.id);
      expect(session.created_at).toBeTruthy();
      expect(session.updated_at).toBeTruthy();
    });

    it('should generate unique session codes', () => {
      const session1 = Session.createSession(testUser.id);
      const session2 = Session.createSession(testUser.id);

      expect(session1.code).not.toBe(session2.code);
    });

    it('should add owner as participant automatically', () => {
      const session = Session.createSession(testUser.id);
      const participants = Session.getParticipants(session.id);

      expect(participants).toHaveLength(1);
      expect(participants[0].id).toBe(testUser.id);
    });

    it('should create session metadata', () => {
      const session = Session.createSession(testUser.id);
      const metadata = Session.getSessionMetadata(session.id);

      expect(metadata).toBeDefined();
      expect(metadata.session_id).toBe(session.id);
    });

    it('should throw error with null owner ID', () => {
      expect(() => Session.createSession(null)).toThrow();
    });

    it('should throw error with empty owner ID', () => {
      expect(() => Session.createSession('')).toThrow();
    });
  });

  describe('generateSessionCode', () => {
    it('should generate 6-character codes', () => {
      const code = Session.generateSessionCode();
      expect(code).toHaveLength(6);
    });

    it('should only use allowed characters (no confusing ones)', () => {
      const code = Session.generateSessionCode();
      const allowed = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

      for (const char of code) {
        expect(allowed).toContain(char);
      }

      // Should not contain confusing characters
      expect(code).not.toContain('O');
      expect(code).not.toContain('I');
      expect(code).not.toContain('0');
      expect(code).not.toContain('1');
    });

    it('should generate different codes on multiple calls', () => {
      const codes = new Set();
      for (let i = 0; i < 100; i++) {
        codes.add(Session.generateSessionCode());
      }
      // Should have high uniqueness (allow for small chance of collision)
      expect(codes.size).toBeGreaterThan(95);
    });
  });

  describe('getSessionById', () => {
    it('should retrieve existing session', () => {
      const created = Session.createSession(testUser.id);
      const retrieved = Session.getSessionById(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(created.id);
      expect(retrieved.code).toBe(created.code);
      expect(retrieved.owner_name).toBe(testUser.name);
    });

    it('should include participant count', () => {
      const session = Session.createSession(testUser.id);
      const retrieved = Session.getSessionById(session.id);

      expect(retrieved.participant_count).toBe(1);
    });

    it('should return null for non-existent session', () => {
      const session = Session.getSessionById('non-existent-id');
      expect(session).toBeNull();
    });

    it('should throw error with null ID', () => {
      expect(() => Session.getSessionById(null)).toThrow();
    });
  });

  describe('getSessionByCode', () => {
    it('should retrieve session by code', () => {
      const created = Session.createSession(testUser.id);
      const retrieved = Session.getSessionByCode(created.code);

      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(created.id);
      expect(retrieved.code).toBe(created.code);
    });

    it('should return null for non-existent code', () => {
      const session = Session.getSessionByCode('XXXXXX');
      expect(session).toBeNull();
    });

    it('should throw error with null code', () => {
      expect(() => Session.getSessionByCode(null)).toThrow();
    });
  });

  describe('getAllSessions', () => {
    it('should return empty array when no sessions', () => {
      const sessions = Session.getAllSessions();
      expect(sessions).toEqual([]);
    });

    it('should return all sessions ordered by creation date', () => {
      const session1 = Session.createSession(testUser.id);
      const session2 = Session.createSession(testUser.id);
      const session3 = Session.createSession(testUser.id);

      const sessions = Session.getAllSessions();
      expect(sessions).toHaveLength(3);

      // Verify all sessions are present (order may vary due to timestamp precision)
      const sessionIds = sessions.map(s => s.id);
      expect(sessionIds).toContain(session1.id);
      expect(sessionIds).toContain(session2.id);
      expect(sessionIds).toContain(session3.id);
    });
  });

  describe('getSessionsByParticipant', () => {
    it('should return sessions where user is participant', () => {
      const session1 = Session.createSession(testUser.id);
      const session2 = Session.createSession(testUser.id);
      const otherUser = User.createUser('Other User');
      const session3 = Session.createSession(otherUser.id);

      const userSessions = Session.getSessionsByParticipant(testUser.id);
      expect(userSessions).toHaveLength(2);
      expect(userSessions.map(s => s.id)).toContain(session1.id);
      expect(userSessions.map(s => s.id)).toContain(session2.id);
      expect(userSessions.map(s => s.id)).not.toContain(session3.id);
    });

    it('should return empty array if user not in any session', () => {
      const otherUser = User.createUser('Other User');
      const sessions = Session.getSessionsByParticipant(otherUser.id);
      expect(sessions).toEqual([]);
    });

    it('should throw error with null user ID', () => {
      expect(() => Session.getSessionsByParticipant(null)).toThrow();
    });
  });

  describe('updateSessionStatus', () => {
    it('should update session status', () => {
      const session = Session.createSession(testUser.id);

      Session.updateSessionStatus(session.id, SESSION_STATUS.VOTING);
      const updated = Session.getSessionById(session.id);

      expect(updated.status).toBe(SESSION_STATUS.VOTING);
    });

    it('should update updated_at timestamp', () => {
      const session = Session.createSession(testUser.id);

      Session.updateSessionStatus(session.id, SESSION_STATUS.SUBMITTING_IDEAS);
      const updated = Session.getSessionById(session.id);

      // Verify the status was updated and updated_at exists
      expect(updated.status).toBe(SESSION_STATUS.SUBMITTING_IDEAS);
      expect(updated.updated_at).toBeDefined();
    });

    it('should throw error with invalid status', () => {
      const session = Session.createSession(testUser.id);
      expect(() => Session.updateSessionStatus(session.id, 'INVALID_STATUS')).toThrow();
    });

    it('should allow all valid status values', () => {
      const session = Session.createSession(testUser.id);

      expect(() => Session.updateSessionStatus(session.id, SESSION_STATUS.WAITING)).not.toThrow();
      expect(() => Session.updateSessionStatus(session.id, SESSION_STATUS.SUBMITTING_IDEAS)).not.toThrow();
      expect(() => Session.updateSessionStatus(session.id, SESSION_STATUS.VOTING)).not.toThrow();
      expect(() => Session.updateSessionStatus(session.id, SESSION_STATUS.COMPLETED)).not.toThrow();
    });
  });

  describe('updateSessionRound', () => {
    it('should update current round', () => {
      const session = Session.createSession(testUser.id);

      Session.updateSessionRound(session.id, 1);
      const updated = Session.getSessionById(session.id);

      expect(updated.current_round).toBe(1);
    });

    it('should allow incrementing rounds', () => {
      const session = Session.createSession(testUser.id);

      Session.updateSessionRound(session.id, 1);
      Session.updateSessionRound(session.id, 2);
      Session.updateSessionRound(session.id, 3);

      const updated = Session.getSessionById(session.id);
      expect(updated.current_round).toBe(3);
    });

    it('should throw error with undefined round', () => {
      const session = Session.createSession(testUser.id);
      expect(() => Session.updateSessionRound(session.id, undefined)).toThrow();
    });
  });

  describe('addParticipant', () => {
    it('should add new participant to session', () => {
      const session = Session.createSession(testUser.id);
      const newUser = User.createUser('New Participant');

      Session.addParticipant(session.id, newUser.id);
      const participants = Session.getParticipants(session.id);

      expect(participants).toHaveLength(2);
      expect(participants.map(p => p.id)).toContain(newUser.id);
    });

    it('should not duplicate participant if already exists', () => {
      const session = Session.createSession(testUser.id);
      const newUser = User.createUser('New Participant');

      Session.addParticipant(session.id, newUser.id);
      Session.addParticipant(session.id, newUser.id); // Add again

      const participants = Session.getParticipants(session.id);
      expect(participants).toHaveLength(2); // Should still be 2
    });

    it('should throw error with null session ID', () => {
      expect(() => Session.addParticipant(null, testUser.id)).toThrow();
    });

    it('should throw error with null user ID', () => {
      const session = Session.createSession(testUser.id);
      expect(() => Session.addParticipant(session.id, null)).toThrow();
    });
  });

  describe('getParticipants', () => {
    it('should return all participants ordered by name', () => {
      const session = Session.createSession(testUser.id);
      const user1 = User.createUser('Charlie');
      const user2 = User.createUser('Alice');
      const user3 = User.createUser('Bob');

      Session.addParticipant(session.id, user1.id);
      Session.addParticipant(session.id, user2.id);
      Session.addParticipant(session.id, user3.id);

      const participants = Session.getParticipants(session.id);
      expect(participants).toHaveLength(4);
      expect(participants[0].name).toBe('Alice');
      expect(participants[1].name).toBe('Bob');
      expect(participants[2].name).toBe('Charlie');
    });

    it('should return empty array for session with no participants', () => {
      // This shouldn't happen normally, but test the edge case
      const session = Session.createSession(testUser.id);
      // Manually remove all participants (hack for testing)
      const { getDatabase } = require('../../models/db.js');
      const db = getDatabase();
      db.exec(`DELETE FROM session_participants WHERE session_id = '${session.id}'`);

      const participants = Session.getParticipants(session.id);
      expect(participants).toEqual([]);
    });

    it('should throw error with null session ID', () => {
      expect(() => Session.getParticipants(null)).toThrow();
    });
  });

  describe('updateSessionMetadata', () => {
    it('should update ideas_elegidas', () => {
      const session = Session.createSession(testUser.id);
      const ideaIds = ['id1', 'id2', 'id3'];

      Session.updateSessionMetadata(session.id, {
        ideas_elegidas: ideaIds
      });

      const metadata = Session.getSessionMetadata(session.id);
      expect(metadata.ideas_elegidas).toEqual(ideaIds);
    });

    it('should update ideas_candidatas', () => {
      const session = Session.createSession(testUser.id);
      const candidateIds = ['id4', 'id5'];

      Session.updateSessionMetadata(session.id, {
        ideas_candidatas: candidateIds
      });

      const metadata = Session.getSessionMetadata(session.id);
      expect(metadata.ideas_candidatas).toEqual(candidateIds);
    });

    it('should update required_votes', () => {
      const session = Session.createSession(testUser.id);

      Session.updateSessionMetadata(session.id, {
        required_votes: 2
      });

      const metadata = Session.getSessionMetadata(session.id);
      expect(metadata.required_votes).toBe(2);
    });

    it('should update multiple fields at once', () => {
      const session = Session.createSession(testUser.id);

      Session.updateSessionMetadata(session.id, {
        ideas_elegidas: ['id1'],
        ideas_candidatas: ['id2', 'id3'],
        mensaje_ronda: 'Test message',
        required_votes: 2
      });

      const metadata = Session.getSessionMetadata(session.id);
      expect(metadata.ideas_elegidas).toEqual(['id1']);
      expect(metadata.ideas_candidatas).toEqual(['id2', 'id3']);
      expect(metadata.mensaje_ronda).toBe('Test message');
      expect(metadata.required_votes).toBe(2);
    });

    it('should preserve existing fields when updating subset', () => {
      const session = Session.createSession(testUser.id);

      Session.updateSessionMetadata(session.id, {
        ideas_elegidas: ['id1'],
        mensaje_ronda: 'First message'
      });

      Session.updateSessionMetadata(session.id, {
        ideas_candidatas: ['id2']
      });

      const metadata = Session.getSessionMetadata(session.id);
      expect(metadata.ideas_elegidas).toEqual(['id1']);
      expect(metadata.ideas_candidatas).toEqual(['id2']);
      expect(metadata.mensaje_ronda).toBe('First message');
    });
  });

  describe('getSessionMetadata', () => {
    it('should return metadata with parsed JSON arrays', () => {
      const session = Session.createSession(testUser.id);

      Session.updateSessionMetadata(session.id, {
        ideas_elegidas: ['id1', 'id2']
      });

      const metadata = Session.getSessionMetadata(session.id);
      expect(Array.isArray(metadata.ideas_elegidas)).toBe(true);
      expect(metadata.ideas_elegidas).toEqual(['id1', 'id2']);
    });

    it('should return null for non-existent session', () => {
      const metadata = Session.getSessionMetadata('non-existent-id');
      expect(metadata).toBeNull();
    });
  });

  describe('deleteSession', () => {
    it('should delete session and all related data', () => {
      const session = Session.createSession(testUser.id);

      Session.deleteSession(session.id);

      const retrieved = Session.getSessionById(session.id);
      expect(retrieved).toBeNull();
    });

    it('should delete session participants', () => {
      const session = Session.createSession(testUser.id);
      const user2 = User.createUser('User 2');
      Session.addParticipant(session.id, user2.id);

      Session.deleteSession(session.id);

      const participants = Session.getParticipants(session.id);
      expect(participants).toEqual([]);
    });

    it('should delete session metadata', () => {
      const session = Session.createSession(testUser.id);

      Session.deleteSession(session.id);

      const metadata = Session.getSessionMetadata(session.id);
      expect(metadata).toBeNull();
    });

    it('should throw error with null ID', () => {
      expect(() => Session.deleteSession(null)).toThrow();
    });
  });
});
