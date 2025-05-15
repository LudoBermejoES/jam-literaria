import { renderHook, act } from '@testing-library/react';
import { waitFor } from '@testing-library/react';
import useAuth from '../../hooks/useAuth';
import * as apiModule from '../../services/api';

// Mock the implementation of localStorage for testing
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock the API calls
jest.mock('../../services/api', () => ({
  registerUser: jest.fn(),
  joinSession: jest.fn(),
  createSession: jest.fn(),
}));

describe('useAuth hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Setup mock implementations for each test
    (apiModule.registerUser as jest.Mock).mockResolvedValue({ id: 'user123', name: 'John Doe' });
    (apiModule.createSession as jest.Mock).mockResolvedValue({
      id: 'session456',
      code: 'EXAMPLE_CODE',
      ownerId: 'user123',
    });
    (apiModule.joinSession as jest.Mock).mockResolvedValue({
      id: 'session123',
      code: 'ABC123',
    });

    // Clear localStorage between tests
    localStorageMock.clear();
  });

  it('should start with initial state', () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should register a user and store in localStorage', async () => {
    const { result } = renderHook(() => useAuth());

    // Act phase
    let returnedUser;
    await act(async () => {
      returnedUser = await result.current.registerUser('John Doe');
      // Wait a bit for state updates
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Assert phase
    expect(returnedUser).toEqual({ id: 'user123', name: 'John Doe' });
    expect(result.current.user).toEqual({ id: 'user123', name: 'John Doe' });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();

    // Check localStorage
    expect(JSON.parse(localStorageMock.getItem('user') || '{}')).toEqual({
      id: 'user123',
      name: 'John Doe',
    });
  });

  it('should create a session', async () => {
    const { result } = renderHook(() => useAuth());

    // First register a user
    await act(async () => {
      await result.current.registerUser('John Doe');
      // Wait for state updates
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Then create a session
    let returnedSession;
    await act(async () => {
      returnedSession = await result.current.createSession();
      // Wait for state updates
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Verify the returned session value
    expect(returnedSession).toEqual({
      id: 'session456',
      code: 'EXAMPLE_CODE',
      ownerId: 'user123',
    });

    // Check the hook state
    expect(result.current.session).toEqual({
      id: 'session456',
      code: 'EXAMPLE_CODE',
      ownerId: 'user123',
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();

    // Check localStorage
    expect(JSON.parse(localStorageMock.getItem('session') || '{}')).toEqual({
      id: 'session456',
      code: 'EXAMPLE_CODE',
      ownerId: 'user123',
    });
  });

  it('should join a session', async () => {
    const { result } = renderHook(() => useAuth());

    // First register a user
    await act(async () => {
      await result.current.registerUser('John Doe');
      // Wait for state updates
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Then join a session
    let returnedSession;
    await act(async () => {
      returnedSession = await result.current.joinSession('ABC123');
      // Wait for state updates
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Verify the returned session value
    expect(returnedSession).toEqual({
      id: 'session123',
      code: 'ABC123',
    });

    // Check the hook state
    expect(result.current.session).toEqual({
      id: 'session123',
      code: 'ABC123',
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();

    // Check localStorage
    expect(JSON.parse(localStorageMock.getItem('session') || '{}')).toEqual({
      id: 'session123',
      code: 'ABC123',
    });
  });

  it('should handle errors during user registration', async () => {
    // Override the mock to simulate an error
    (apiModule.registerUser as jest.Mock).mockRejectedValueOnce(new Error('Registration failed'));

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      try {
        await result.current.registerUser('John Doe');
      } catch (error) {
        // Ignore error as we're testing the error handling
      }
      // Wait for state updates
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Check the hook state
    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe('Registration failed');
  });

  it('should logout and clear user and session data', async () => {
    const { result } = renderHook(() => useAuth());

    // Setup user
    await act(async () => {
      await result.current.registerUser('John Doe');
      // Wait for state updates
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Setup session
    await act(async () => {
      await result.current.createSession();
      // Wait for state updates
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Verify we have data before logout
    expect(result.current.user).not.toBeNull();
    expect(result.current.session).not.toBeNull();

    // Then logout
    act(() => {
      result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
    expect(localStorageMock.getItem('user')).toBeNull();
    expect(localStorageMock.getItem('session')).toBeNull();
  });
});
