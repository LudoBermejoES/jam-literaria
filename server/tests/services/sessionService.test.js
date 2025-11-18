import { describe, it, expect, beforeEach } from 'vitest';
import * as sessionService from '../../services/sessionService.js';
import { User } from '../../models/User.js';
import { Session, SESSION_STATUS } from '../../models/Session.js';
import { Idea } from '../../models/Idea.js';

describe('Session Service', () => {
  let testUser1;
  let testUser2;

  beforeEach(() => {
    testUser1 = User.createUser('Owner');
    testUser2 = User.createUser('Participant');
  });

  describe('createSession', () => {
    it('should create a new session', () => {
      const session = sessionService.createSession(testUser1.id);

      expect(session).toBeDefined();
      expect(session.id).toBeTruthy();
      expect(session.code).toBeTruthy();
      expect(session.owner_id).toBe(testUser1.id);
      expect(session.status).toBe(SESSION_STATUS.WAITING);
    });

    it('should throw error with null owner ID', () => {
      expect(() => sessionService.createSession(null)).toThrow('required');
    });
  });

  describe('getSessionById', () => {
    it('should return session when it exists', () => {
      const created = sessionService.createSession(testUser1.id);
      const retrieved = sessionService.getSessionById(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(created.id);
    });

    it('should return null when session does not exist', () => {
      const session = sessionService.getSessionById('non-existent');
      expect(session).toBeNull();
    });

    it('should throw error with null ID', () => {
      expect(() => sessionService.getSessionById(null)).toThrow();
    });
  });

  describe('getSessionByCode', () => {
    it('should return session by code', () => {
      const created = sessionService.createSession(testUser1.id);
      const retrieved = sessionService.getSessionByCode(created.code);

      expect(retrieved).toBeDefined();
      expect(retrieved.code).toBe(created.code);
    });

    it('should return null for non-existent code', () => {
      const session = sessionService.getSessionByCode('XXXXXX');
      expect(session).toBeNull();
    });

    it('should throw error with null code', () => {
      expect(() => sessionService.getSessionByCode(null)).toThrow();
    });
  });

  describe('getAllSessions', () => {
    it('should return all sessions', () => {
      sessionService.createSession(testUser1.id);
      sessionService.createSession(testUser2.id);

      const sessions = sessionService.getAllSessions();
      expect(sessions.length).toBeGreaterThanOrEqual(2);
    });

    it('should return empty array when no sessions', () => {
      const sessions = sessionService.getAllSessions();
      expect(Array.isArray(sessions)).toBe(true);
    });
  });

  describe('getSessionsByParticipant', () => {
    it('should return sessions where user is participant', () => {
      const session1 = sessionService.createSession(testUser1.id);
      const session2 = sessionService.createSession(testUser2.id);

      sessionService.joinSession(session2.id, testUser1.id);

      const sessions = sessionService.getSessionsByParticipant(testUser1.id);
      expect(sessions.length).toBeGreaterThanOrEqual(2);
    });

    it('should throw error with null user ID', () => {
      expect(() => sessionService.getSessionsByParticipant(null)).toThrow();
    });
  });

  describe('joinSession', () => {
    let session;

    beforeEach(() => {
      session = sessionService.createSession(testUser1.id);
    });

    it('should allow user to join session in WAITING state', () => {
      const result = sessionService.joinSession(session.id, testUser2.id);

      expect(result).toBeDefined();
      expect(result.participants).toBeDefined();
      expect(result.participants.length).toBe(2);
    });

    it('should return session with participants', () => {
      const result = sessionService.joinSession(session.id, testUser2.id);

      expect(result.participants).toBeDefined();
      expect(result.metadata).toBeDefined();
    });

    it('should throw error when session does not exist', () => {
      expect(() => {
        sessionService.joinSession('non-existent', testUser2.id);
      }).toThrow('Session not found');
    });

    it('should throw error when session not in WAITING state', () => {
      Session.updateSessionStatus(session.id, SESSION_STATUS.SUBMITTING_IDEAS);

      expect(() => {
        sessionService.joinSession(session.id, testUser2.id);
      }).toThrow('Cannot join session in current state');
    });

    it('should throw error with null session ID', () => {
      expect(() => {
        sessionService.joinSession(null, testUser2.id);
      }).toThrow('required');
    });

    it('should throw error with null user ID', () => {
      expect(() => {
        sessionService.joinSession(session.id, null);
      }).toThrow('required');
    });

    it('should allow same user to join multiple times without duplicating', () => {
      sessionService.joinSession(session.id, testUser2.id);
      sessionService.joinSession(session.id, testUser2.id);

      const result = sessionService.getSessionWithParticipants(session.id);
      expect(result.participants.length).toBe(2);
    });
  });

  describe('startSession', () => {
    let session;

    beforeEach(() => {
      session = sessionService.createSession(testUser1.id);
      sessionService.joinSession(session.id, testUser2.id);
    });

    it('should start session when owner requests and has 2+ participants', () => {
      const result = sessionService.startSession(session.id, testUser1.id);

      expect(result).toBeDefined();
      expect(result.status).toBe(SESSION_STATUS.SUBMITTING_IDEAS);
    });

    it('should throw error when non-owner tries to start', () => {
      expect(() => {
        sessionService.startSession(session.id, testUser2.id);
      }).toThrow('Only the session owner can start');
    });

    it('should throw error when session does not exist', () => {
      expect(() => {
        sessionService.startSession('non-existent', testUser1.id);
      }).toThrow('Session not found');
    });

    it('should throw error when session already started', () => {
      sessionService.startSession(session.id, testUser1.id);

      expect(() => {
        sessionService.startSession(session.id, testUser1.id);
      }).toThrow('already started');
    });

    it('should throw error when less than 2 participants', () => {
      const soloSession = sessionService.createSession(testUser1.id);

      expect(() => {
        sessionService.startSession(soloSession.id, testUser1.id);
      }).toThrow('at least 2 participants');
    });

    it('should throw error with null session ID', () => {
      expect(() => {
        sessionService.startSession(null, testUser1.id);
      }).toThrow('required');
    });

    it('should throw error with null owner ID', () => {
      expect(() => {
        sessionService.startSession(session.id, null);
      }).toThrow('required');
    });
  });

  describe('updateSessionStatus', () => {
    let session;

    beforeEach(() => {
      session = sessionService.createSession(testUser1.id);
    });

    it('should update session status to valid value', () => {
      const result = sessionService.updateSessionStatus(session.id, SESSION_STATUS.SUBMITTING_IDEAS);

      expect(result.status).toBe(SESSION_STATUS.SUBMITTING_IDEAS);
    });

    it('should throw error with invalid status', () => {
      expect(() => {
        sessionService.updateSessionStatus(session.id, 'INVALID_STATUS');
      }).toThrow('Invalid session status');
    });

    it('should throw error with null session ID', () => {
      expect(() => {
        sessionService.updateSessionStatus(null, SESSION_STATUS.VOTING);
      }).toThrow('required');
    });

    it('should throw error with null status', () => {
      expect(() => {
        sessionService.updateSessionStatus(session.id, null);
      }).toThrow('required');
    });

    it('should allow all valid status values', () => {
      sessionService.updateSessionStatus(session.id, SESSION_STATUS.WAITING);
      sessionService.updateSessionStatus(session.id, SESSION_STATUS.SUBMITTING_IDEAS);
      sessionService.updateSessionStatus(session.id, SESSION_STATUS.VOTING);
      sessionService.updateSessionStatus(session.id, SESSION_STATUS.COMPLETED);

      const result = sessionService.getSessionById(session.id);
      expect(result.status).toBe(SESSION_STATUS.COMPLETED);
    });
  });

  describe('updateSessionRound', () => {
    let session;

    beforeEach(() => {
      session = sessionService.createSession(testUser1.id);
    });

    it('should update session round', () => {
      const result = sessionService.updateSessionRound(session.id, 1);

      expect(result.current_round).toBe(1);
    });

    it('should allow incrementing rounds', () => {
      sessionService.updateSessionRound(session.id, 1);
      sessionService.updateSessionRound(session.id, 2);
      const result = sessionService.updateSessionRound(session.id, 3);

      expect(result.current_round).toBe(3);
    });

    it('should throw error with null session ID', () => {
      expect(() => {
        sessionService.updateSessionRound(null, 1);
      }).toThrow('required');
    });

    it('should throw error with undefined round', () => {
      expect(() => {
        sessionService.updateSessionRound(session.id, undefined);
      }).toThrow('required');
    });
  });

  describe('getSessionWithParticipants', () => {
    let session;

    beforeEach(() => {
      session = sessionService.createSession(testUser1.id);
      sessionService.joinSession(session.id, testUser2.id);
    });

    it('should return session with participants array', () => {
      const result = sessionService.getSessionWithParticipants(session.id);

      expect(result).toBeDefined();
      expect(result.participants).toBeDefined();
      expect(Array.isArray(result.participants)).toBe(true);
      expect(result.participants.length).toBe(2);
    });

    it('should return session with metadata', () => {
      const result = sessionService.getSessionWithParticipants(session.id);

      expect(result.metadata).toBeDefined();
    });

    it('should return null when session does not exist', () => {
      const result = sessionService.getSessionWithParticipants('non-existent');
      expect(result).toBeNull();
    });

    it('should throw error with null session ID', () => {
      expect(() => {
        sessionService.getSessionWithParticipants(null);
      }).toThrow('required');
    });
  });

  describe('getSessionMetadata', () => {
    let session;

    beforeEach(() => {
      session = sessionService.createSession(testUser1.id);
    });

    it('should return session metadata', () => {
      const metadata = sessionService.getSessionMetadata(session.id);

      expect(metadata).toBeDefined();
      expect(metadata.session_id).toBe(session.id);
    });

    it('should throw error with null session ID', () => {
      expect(() => sessionService.getSessionMetadata(null)).toThrow();
    });
  });

  describe('updateSessionMetadata', () => {
    let session;

    beforeEach(() => {
      session = sessionService.createSession(testUser1.id);
    });

    it('should update session metadata', () => {
      const result = sessionService.updateSessionMetadata(session.id, {
        ideas_elegidas: ['id1', 'id2', 'id3']
      });

      expect(result.ideas_elegidas).toEqual(['id1', 'id2', 'id3']);
    });

    it('should throw error with null session ID', () => {
      expect(() => {
        sessionService.updateSessionMetadata(null, {});
      }).toThrow('required');
    });

    it('should throw error with null metadata', () => {
      expect(() => {
        sessionService.updateSessionMetadata(session.id, null);
      }).toThrow('required');
    });
  });

  describe('deleteSession', () => {
    let session;

    beforeEach(() => {
      session = sessionService.createSession(testUser1.id);
    });

    it('should allow owner to delete session', () => {
      const result = sessionService.deleteSession(session.id, testUser1.id);
      expect(result).toBe(true);

      const deleted = sessionService.getSessionById(session.id);
      expect(deleted).toBeNull();
    });

    it('should throw error when non-owner tries to delete', () => {
      expect(() => {
        sessionService.deleteSession(session.id, testUser2.id);
      }).toThrow('Only the session owner can delete');
    });

    it('should throw error when session does not exist', () => {
      expect(() => {
        sessionService.deleteSession('non-existent', testUser1.id);
      }).toThrow('Session not found');
    });

    it('should throw error with null session ID', () => {
      expect(() => {
        sessionService.deleteSession(null, testUser1.id);
      }).toThrow('required');
    });

    it('should throw error with null owner ID', () => {
      expect(() => {
        sessionService.deleteSession(session.id, null);
      }).toThrow('required');
    });
  });

  describe('startVotingPhase', () => {
    let session;

    beforeEach(() => {
      session = sessionService.createSession(testUser1.id);
      sessionService.joinSession(session.id, testUser2.id);
      sessionService.startSession(session.id, testUser1.id);
    });

    it('should start voting phase when session is in SUBMITTING_IDEAS state', () => {
      const result = sessionService.startVotingPhase(session.id);

      expect(result).toBeDefined();
      expect(result.status).toBe(SESSION_STATUS.VOTING);
    });

    it('should throw error when session not found', () => {
      expect(() => {
        sessionService.startVotingPhase('non-existent');
      }).toThrow('Session not found');
    });

    it('should throw error when session not in SUBMITTING_IDEAS state', () => {
      Session.updateSessionStatus(session.id, SESSION_STATUS.VOTING);

      expect(() => {
        sessionService.startVotingPhase(session.id);
      }).toThrow('must be in the SUBMITTING_IDEAS phase');
    });

    it('should return session with participants', () => {
      const result = sessionService.startVotingPhase(session.id);

      expect(result.participants).toBeDefined();
      expect(result.participants.length).toBeGreaterThanOrEqual(2);
    });
  });
});
