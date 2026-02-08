import { describe, it, expect, beforeEach } from 'vitest';
import * as userService from '../../services/userService.js';
import { User } from '../../models/User.js';
import { Session } from '../../models/Session.js';

describe('User Service', () => {
  describe('createUser', () => {
    it('should create a new user', () => {
      const user = userService.createUser('Test User');

      expect(user).toBeDefined();
      expect(user.name).toBe('Test User');
    });

    it('should throw error with null name', () => {
      expect(() => userService.createUser(null)).toThrow('required');
    });

    it('should throw error with empty name', () => {
      expect(() => userService.createUser('')).toThrow('required');
    });

    it('should throw error with whitespace-only name', () => {
      expect(() => userService.createUser('   ')).toThrow('required');
    });
  });

  describe('getUserById', () => {
    it('should return user when exists', () => {
      const created = userService.createUser('Test User');
      const retrieved = userService.getUserById(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(created.id);
    });

    it('should return null when user does not exist', () => {
      const user = userService.getUserById('non-existent');
      expect(user).toBeNull();
    });

    it('should throw error with null ID', () => {
      expect(() => userService.getUserById(null)).toThrow();
    });
  });

  describe('updateUserLastActive', () => {
    it('should update user last active timestamp', () => {
      const user = userService.createUser('Test User');
      const result = userService.updateUserLastActive(user.id);

      expect(result).toBe(true);
    });

    it('should throw error with null ID', () => {
      expect(() => userService.updateUserLastActive(null)).toThrow();
    });
  });

  describe('getAllUsers', () => {
    it('should return all users', () => {
      userService.createUser('User 1');
      userService.createUser('User 2');

      const users = userService.getAllUsers();
      expect(users.length).toBeGreaterThanOrEqual(2);
    });

    it('should return array', () => {
      const users = userService.getAllUsers();
      expect(Array.isArray(users)).toBe(true);
    });
  });

  describe('getUsersBySessionId', () => {
    let testUser;
    let testSession;

    beforeEach(() => {
      testUser = userService.createUser('Session User');
      testSession = Session.createSession(testUser.id);
    });

    it('should return users in session', () => {
      const users = userService.getUsersBySessionId(testSession.id);

      expect(users).toBeDefined();
      expect(users.length).toBeGreaterThanOrEqual(1);
      expect(users.some(u => u.id === testUser.id)).toBe(true);
    });

    it('should throw error with null session ID', () => {
      expect(() => userService.getUsersBySessionId(null)).toThrow();
    });
  });

  describe('validateUserSessionAccess', () => {
    let testUser1;
    let testUser2;
    let testSession;

    beforeEach(() => {
      testUser1 = userService.createUser('User 1');
      testUser2 = userService.createUser('User 2');
      testSession = Session.createSession(testUser1.id);
    });

    it('should return true when user is participant', () => {
      const hasAccess = userService.validateUserSessionAccess(testUser1.id, testSession.id);
      expect(hasAccess).toBe(true);
    });

    it('should return false when user is not participant', () => {
      const hasAccess = userService.validateUserSessionAccess(testUser2.id, testSession.id);
      expect(hasAccess).toBe(false);
    });

    it('should return true after user joins session', () => {
      Session.addParticipant(testSession.id, testUser2.id);

      const hasAccess = userService.validateUserSessionAccess(testUser2.id, testSession.id);
      expect(hasAccess).toBe(true);
    });

    it('should throw error with null user ID', () => {
      expect(() => {
        userService.validateUserSessionAccess(null, testSession.id);
      }).toThrow('required');
    });

    it('should throw error with null session ID', () => {
      expect(() => {
        userService.validateUserSessionAccess(testUser1.id, null);
      }).toThrow('required');
    });
  });
});
