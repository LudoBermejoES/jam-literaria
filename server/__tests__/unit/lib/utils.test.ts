import { jest, describe, it, expect } from '@jest/globals';

describe('Basic test setup', () => {
  it('should pass a simple test', () => {
    expect(true).toBe(true);
  });

  it('should handle simple math operations', () => {
    expect(1 + 1).toBe(2);
    expect(5 * 5).toBe(25);
  });
}); 