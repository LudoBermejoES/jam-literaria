import { describe, it, expect } from 'vitest';

describe('Test Setup', () => {
  it('should be able to run tests', () => {
    expect(true).toBe(true);
  });

  it('should have access to global objects', () => {
    expect(window).toBeDefined();
    expect(document).toBeDefined();
  });

  it('should support assertions', () => {
    const value = 42;
    expect(value).toBe(42);
    expect(value).toBeGreaterThan(40);
    expect(value).toBeLessThan(50);
  });
});
