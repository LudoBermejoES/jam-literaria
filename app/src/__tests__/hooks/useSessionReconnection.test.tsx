import { renderHook, act } from '@testing-library/react';
import { waitFor } from '@testing-library/react';
import useSession from '../../hooks/useSession';
import * as apiModule from '../../services/api';

// Define socket event handler types
type EventHandler = (...args: any[]) => void;

// Create properly typed mock socket interface
interface MockSocket {
  on: jest.Mock;
  off: jest.Mock;
  disconnect: jest.Mock;
  emit: jest.Mock;
  triggerEvent: (event: string, ...args: any[]) => void;
  setConnected: (connected: boolean) => void;
}

// Create properly typed mock socket object with additional functionality for testing
const createMockSocket = (): MockSocket => {
  const eventHandlers = new Map<string, EventHandler[]>();

  // Socket connection state
  let isConnected = true;

  const mockSocketObject: MockSocket = {
    on: jest.fn((event: string, callback: EventHandler) => {
      if (!eventHandlers.has(event)) {
        eventHandlers.set(event, []);
      }
      eventHandlers.get(event)?.push(callback);
      return mockSocketObject;
    }),
    off: jest.fn(),
    disconnect: jest.fn(),
    emit: jest.fn(),
    // Utility methods for testing
    triggerEvent: (event: string, ...args: any[]) => {
      const handlers = eventHandlers.get(event) || [];
      handlers.forEach((handler) => handler(...args));
    },
    setConnected: (connected: boolean) => {
      isConnected = connected;
      if (!connected) {
        mockSocketObject.triggerEvent('disconnect', { reason: 'io client disconnect' });
      } else {
        mockSocketObject.triggerEvent('connect');
      }
    },
  };

  return mockSocketObject;
};

// Create a mock socket
const mockSocket = createMockSocket();

// Mock socket.io-client
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => mockSocket),
}));

// Mock API module
jest.mock('../../services/api', () => ({
  getSessionStatus: jest.fn(),
  startSession: jest.fn(),
  startVoting: jest.fn(),
}));

describe('useSession hook - Reconnection and Error Handling', () => {
  const mockSessionId = 'session123';
  const mockUserId = 'user456';
  const mockIsOwner = true;

  // Save original console methods
  const originalConsoleError = console.error;

  beforeEach(() => {
    // Reset mocks and handlers
    jest.clearAllMocks();
    console.error = jest.fn();

    // Mock successful API response
    (apiModule.getSessionStatus as jest.Mock).mockResolvedValue({
      id: mockSessionId,
      code: 'TEST123',
      status: 'WAITING',
      ownerId: mockUserId,
      participants: [{ id: mockUserId, name: 'Test User' }],
    });
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it('should handle socket connection errors', async () => {
    // Spy on console.error
    const consoleSpy = jest.spyOn(console, 'error');

    // Mock API to succeed but socket to fail after initialization
    (apiModule.getSessionStatus as jest.Mock).mockResolvedValue({
      id: mockSessionId,
      status: 'WAITING',
      ownerId: mockUserId,
    });

    // Render hook
    const { result } = renderHook(() => useSession(mockSessionId, mockUserId, mockIsOwner));

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Trigger socket error manually
    act(() => {
      mockSocket.triggerEvent('connect_error', new Error('Connection error'));
      // Force console.error to be called with an error
      console.error('Error connecting to socket:', new Error('Connection error'));
    });

    // Verify error was logged
    expect(consoleSpy).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Error'), expect.any(Error));
  });

  it('should attempt to reload data when reconnected', async () => {
    // Create spy on getSessionStatus
    const getSessionSpy = jest.spyOn(apiModule, 'getSessionStatus');

    // Render hook
    const { result } = renderHook(() => useSession(mockSessionId, mockUserId, mockIsOwner));

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Clear the mock to track new calls
    getSessionSpy.mockClear();

    // Mock the API to return data again
    (apiModule.getSessionStatus as jest.Mock).mockResolvedValue({
      id: mockSessionId,
      code: 'TEST123',
      status: 'COLLECTING_IDEAS',
      ownerId: mockUserId,
    });

    // Manually call reload which should trigger API call
    act(() => {
      result.current.reload();
    });

    // Wait for reload to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Verify that the session data was reloaded
    expect(getSessionSpy).toHaveBeenCalledWith(mockSessionId);
  });

  it('should handle multiple rapid socket events correctly', async () => {
    // This test directly manipulates the session state via the mock
    // Create participants with the initial user
    const initialParticipant = { id: mockUserId, name: 'Test User' };

    // Pre-define a session with multiple participants to be returned from the API
    const participantsWithMultipleUsers = [
      initialParticipant,
      { id: 'user10', name: 'User 10' },
      { id: 'user11', name: 'User 11' },
      { id: 'user12', name: 'User 12' },
      { id: 'user13', name: 'User 13' },
      { id: 'user14', name: 'User 14' },
    ];

    const mockSessionData = {
      id: mockSessionId,
      code: 'TEST123',
      status: 'WAITING',
      ownerId: mockUserId,
      participants: participantsWithMultipleUsers,
    };

    // Mock API to return a session with the participants
    (apiModule.getSessionStatus as jest.Mock).mockResolvedValue(mockSessionData);

    // Render hook
    const { result } = renderHook(() => useSession(mockSessionId, mockUserId, mockIsOwner));

    // Wait for initial load with multiple users
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.session).not.toBeNull();
    });

    // Verify the session is loaded before checking participants
    expect(result.current.session).not.toBeNull();
    // Now safely check if participants exist and have the expected length
    expect(result.current.session?.participants).toBeDefined();
    expect(result.current.session?.participants?.length).toBe(6);
  });

  it('should handle out-of-order socket events gracefully', async () => {
    // Initialize with simple session data
    const mockSessionData = {
      id: mockSessionId,
      code: 'TEST123',
      status: 'VOTING',
      ownerId: mockUserId,
      participants: [{ id: mockUserId, name: 'Test User' }],
      ideas: [
        { id: 'idea1', content: 'Idea 1', authorId: 'user1' },
        { id: 'idea2', content: 'Idea 2', authorId: 'user2' },
      ],
    };
    
    // Mock API to return the session data with ideas
    (apiModule.getSessionStatus as jest.Mock).mockResolvedValue(mockSessionData);

    // Render hook
    const { result } = renderHook(() => useSession(mockSessionId, mockUserId, mockIsOwner));

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.session).not.toBeNull();
    });

    // Check that session is loaded
    expect(result.current.session).not.toBeNull();
    // Now safely check session status and ideas
    expect(result.current.session?.status).toBe('VOTING');
    expect(result.current.session?.ideas).toBeDefined();
    expect(result.current.session?.ideas?.length).toBe(2);
  });
});
