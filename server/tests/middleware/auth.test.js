import { describe, it, expect, vi } from 'vitest';
import {
  authMiddleware,
  optionalAuthMiddleware,
  sessionOwnerMiddleware,
  sessionParticipantMiddleware
} from '../../api/middleware/auth.js';
import { User } from '../../models/User.js';
import { Session } from '../../models/Session.js';

describe('Authentication Middleware', () => {

  describe('authMiddleware', () => {
    it('should pass authentication when session contains valid userId', () => {
      const user = User.createUser('Test User');

      const req = {
        session: { userId: user.id }
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };
      const next = vi.fn();

      authMiddleware(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user.id).toBe(user.id);
      expect(req.user.name).toBe('Test User');
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject request when no session exists', () => {
      const req = {
        session: {}
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };
      const next = vi.fn();

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized - Please login first'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request when session is undefined', () => {
      const req = {};
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };
      const next = vi.fn();

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized - Please login first'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject and destroy session when userId is invalid', () => {
      const req = {
        session: {
          userId: 'invalid-user-id',
          destroy: vi.fn()
        }
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };
      const next = vi.fn();

      authMiddleware(req, res, next);

      expect(req.session.destroy).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized - Invalid user'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', () => {
      // Create a spy on getUserById that throws an error
      const getUserByIdSpy = vi.spyOn(User, 'getUserById').mockImplementation(() => {
        throw new Error('Database error');
      });

      const req = {
        session: { userId: 'some-id' }
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };
      const next = vi.fn();

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error'
      });
      expect(next).not.toHaveBeenCalled();

      getUserByIdSpy.mockRestore();
    });
  });

  describe('optionalAuthMiddleware', () => {
    it('should add user to request when session is valid', () => {
      const user = User.createUser('Optional User');

      const req = {
        session: { userId: user.id }
      };
      const res = {};
      const next = vi.fn();

      optionalAuthMiddleware(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user.id).toBe(user.id);
      expect(next).toHaveBeenCalled();
    });

    it('should continue without user when no session exists', () => {
      const req = {
        session: {}
      };
      const res = {};
      const next = vi.fn();

      optionalAuthMiddleware(req, res, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });

    it('should continue without user when session is undefined', () => {
      const req = {};
      const res = {};
      const next = vi.fn();

      optionalAuthMiddleware(req, res, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });

    it('should destroy session but continue when userId is invalid', () => {
      const req = {
        session: {
          userId: 'invalid-id',
          destroy: vi.fn()
        }
      };
      const res = {};
      const next = vi.fn();

      optionalAuthMiddleware(req, res, next);

      expect(req.session.destroy).toHaveBeenCalled();
      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });

    it('should continue even when database error occurs', () => {
      const getUserByIdSpy = vi.spyOn(User, 'getUserById').mockImplementation(() => {
        throw new Error('Database error');
      });

      const req = {
        session: { userId: 'some-id' }
      };
      const res = {};
      const next = vi.fn();

      optionalAuthMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeUndefined();

      getUserByIdSpy.mockRestore();
    });
  });

  describe('sessionOwnerMiddleware', () => {
    it('should allow session owner to proceed', () => {
      const owner = User.createUser('Owner');
      const session = Session.createSession(owner.id);

      const req = {
        session: { userId: owner.id },
        params: { id: session.id },
        app: { locals: { Session } }
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };
      const next = vi.fn();

      sessionOwnerMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject when user is not session owner', () => {
      const owner = User.createUser('Owner');
      const otherUser = User.createUser('Other User');
      const session = Session.createSession(owner.id);

      const req = {
        session: { userId: otherUser.id },
        params: { id: session.id },
        app: { locals: { Session } }
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };
      const next = vi.fn();

      sessionOwnerMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Forbidden - Only the session owner can perform this action'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject when session ID is missing', () => {
      const user = User.createUser('User');

      const req = {
        session: { userId: user.id },
        params: {},
        body: {},
        app: { locals: { Session } }
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };
      const next = vi.fn();

      sessionOwnerMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Session ID is required'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject when session does not exist', () => {
      const user = User.createUser('User');

      const req = {
        session: { userId: user.id },
        params: { id: 'non-existent-session' },
        app: { locals: { Session } }
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };
      const next = vi.fn();

      sessionOwnerMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Session not found'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', () => {
      const user = User.createUser('User');
      const getSessionByIdSpy = vi.spyOn(Session, 'getSessionById').mockImplementation(() => {
        throw new Error('Database error');
      });

      const req = {
        session: { userId: user.id },
        params: { id: 'some-session-id' },
        app: { locals: { Session } }
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };
      const next = vi.fn();

      sessionOwnerMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error'
      });
      expect(next).not.toHaveBeenCalled();

      getSessionByIdSpy.mockRestore();
    });
  });

  describe('sessionParticipantMiddleware', () => {
    it('should allow participant to proceed', () => {
      const owner = User.createUser('Owner');
      const participant = User.createUser('Participant');
      const session = Session.createSession(owner.id);
      Session.addParticipant(session.id, participant.id);

      const req = {
        session: { userId: participant.id },
        params: { id: session.id },
        app: { locals: { Session } }
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };
      const next = vi.fn();

      sessionParticipantMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(req.participants).toBeDefined();
    });

    it('should allow session owner to proceed', () => {
      const owner = User.createUser('Owner');
      const session = Session.createSession(owner.id);

      const req = {
        session: { userId: owner.id },
        params: { id: session.id },
        app: { locals: { Session } }
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };
      const next = vi.fn();

      sessionParticipantMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject when user is not a participant', () => {
      const owner = User.createUser('Owner');
      const outsider = User.createUser('Outsider');
      const session = Session.createSession(owner.id);

      const req = {
        session: { userId: outsider.id },
        params: { id: session.id },
        app: { locals: { Session } }
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };
      const next = vi.fn();

      sessionParticipantMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Forbidden - You are not a participant in this session'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject when session ID is missing', () => {
      const user = User.createUser('User');

      const req = {
        session: { userId: user.id },
        params: {},
        body: {},
        app: { locals: { Session } }
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };
      const next = vi.fn();

      sessionParticipantMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Session ID is required'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject when session does not exist', () => {
      const user = User.createUser('User');

      const req = {
        session: { userId: user.id },
        params: { id: 'non-existent-session' },
        app: { locals: { Session } }
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };
      const next = vi.fn();

      sessionParticipantMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Session not found'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', () => {
      const user = User.createUser('User');
      const getSessionByIdSpy = vi.spyOn(Session, 'getSessionById').mockImplementation(() => {
        throw new Error('Database error');
      });

      const req = {
        session: { userId: user.id },
        params: { id: 'some-session-id' },
        app: { locals: { Session } }
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };
      const next = vi.fn();

      sessionParticipantMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error'
      });
      expect(next).not.toHaveBeenCalled();

      getSessionByIdSpy.mockRestore();
    });
  });
});
