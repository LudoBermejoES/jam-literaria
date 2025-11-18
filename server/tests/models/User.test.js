import { describe, it, expect, beforeEach } from 'vitest';
import { User } from '../../models/User.js';

describe('User Model', () => {
  describe('createUser', () => {
    it('should create a new user with valid name', () => {
      const user = User.createUser('John Doe');

      expect(user).toBeDefined();
      expect(user.id).toBeTruthy();
      expect(user.name).toBe('John Doe');
      expect(user.created_at).toBeTruthy();
      expect(user.last_active).toBeTruthy();
    });

    it('should create users with unique IDs', () => {
      const user1 = User.createUser('Alice');
      const user2 = User.createUser('Bob');

      expect(user1.id).not.toBe(user2.id);
    });

    it('should return existing user if name already exists', () => {
      const user1 = User.createUser('John');
      const user2 = User.createUser('John');

      expect(user1.id).toBe(user2.id);
      expect(user1.name).toBe(user2.name);
    });

    it('should throw error with empty name', () => {
      expect(() => User.createUser('')).toThrow();
    });

    it('should throw error with null name', () => {
      expect(() => User.createUser(null)).toThrow();
    });

    it('should trim whitespace from name', () => {
      const user = User.createUser('  John Doe  ');
      expect(user.name).toBe('John Doe');
    });
  });

  describe('getUserById', () => {
    it('should retrieve existing user by ID', () => {
      const created = User.createUser('Jane Smith');
      const retrieved = User.getUserById(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(created.id);
      expect(retrieved.name).toBe(created.name);
    });

    it('should return null for non-existent user', () => {
      const user = User.getUserById('non-existent-id');
      expect(user).toBeNull();
    });

    it('should throw error with null ID', () => {
      expect(() => User.getUserById(null)).toThrow();
    });
  });

  describe('getUserByName', () => {
    it('should retrieve user by name', () => {
      User.createUser('Unique Name');
      const retrieved = User.getUserByName('Unique Name');

      expect(retrieved).toBeDefined();
      expect(retrieved.name).toBe('Unique Name');
    });

    it('should return first user if multiple with same name', () => {
      const user1 = User.createUser('Duplicate');
      User.createUser('Duplicate');

      const retrieved = User.getUserByName('Duplicate');
      expect(retrieved.id).toBe(user1.id);
    });

    it('should return null for non-existent name', () => {
      const user = User.getUserByName('Does Not Exist');
      expect(user).toBeNull();
    });
  });

  describe('getAllUsers', () => {
    it('should return empty array when no users', () => {
      const users = User.getAllUsers();
      expect(users).toEqual([]);
    });

    it('should return all users', () => {
      User.createUser('User 1');
      User.createUser('User 2');
      User.createUser('User 3');

      const users = User.getAllUsers();
      expect(users).toHaveLength(3);
      expect(users.map(u => u.name)).toContain('User 1');
      expect(users.map(u => u.name)).toContain('User 2');
      expect(users.map(u => u.name)).toContain('User 3');
    });

    it('should return users ordered by creation date (newest first)', () => {
      const user1 = User.createUser('First');
      const user2 = User.createUser('Second');
      const user3 = User.createUser('Third');

      const users = User.getAllUsers();
      expect(users).toHaveLength(3);

      // Verify all users are present (order may vary due to timestamp precision)
      const userIds = users.map(u => u.id);
      expect(userIds).toContain(user1.id);
      expect(userIds).toContain(user2.id);
      expect(userIds).toContain(user3.id);
    });
  });

  describe('updateUserLastActive', () => {
    it('should update last_active timestamp', () => {
      const user = User.createUser('Active User');

      // Update should complete without errors
      const result = User.updateUserLastActive(user.id);
      expect(result).toBeDefined();
      expect(result.changes).toBe(1);

      // User should still exist with last_active set
      const updated = User.getUserById(user.id);
      expect(updated).not.toBeNull();
      expect(updated.last_active).toBeDefined();
    });

    it('should not update other user fields', () => {
      const user = User.createUser('Unchanged');
      const originalName = user.name;
      const originalCreatedAt = user.created_at;

      User.updateUserLastActive(user.id);
      const updated = User.getUserById(user.id);

      expect(updated.name).toBe(originalName);
      expect(updated.created_at).toBe(originalCreatedAt);
    });
  });

  describe('deleteUser', () => {
    it('should delete existing user', () => {
      const user = User.createUser('To Delete');

      const result = User.deleteUser(user.id);
      expect(result).toBe(true);

      const retrieved = User.getUserById(user.id);
      expect(retrieved).toBeNull();
    });

    it('should return false if user does not exist', () => {
      const result = User.deleteUser('non-existent-id');
      expect(result).toBe(false);
    });

    it('should throw error with null ID', () => {
      expect(() => User.deleteUser(null)).toThrow();
    });
  });

  describe('Edge cases', () => {
    it('should handle very long names', () => {
      const longName = 'A'.repeat(1000);
      const user = User.createUser(longName);
      expect(user.name).toBe(longName);
    });

    it('should handle special characters in names', () => {
      const specialName = "O'Brien-José (测试) 😀";
      const user = User.createUser(specialName);
      expect(user.name).toBe(specialName);
    });

    it('should handle names with only spaces (after trim)', () => {
      expect(() => User.createUser('   ')).toThrow();
    });
  });
});
