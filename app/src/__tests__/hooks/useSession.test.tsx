import { renderHook, act } from '@testing-library/react';
import { waitFor } from '@testing-library/react';
import useSession from '../../hooks/useSession';
import * as apiModule from '../../services/api';
import type { Socket } from 'socket.io-client';

// Define socket event handler types
type EventHandler = (...args: any[]) => void;

// Define the events we expect to be registered
const EXPECTED_EVENTS = ['user-joined', 'session-started', 'idea-submitted', 'vote-submitted', 'voting-results'];

// Create sets to track registered and removed events
let registeredEvents: Set<string>;
let removedEvents: Set<string>;

// Create properly typed mock socket object 
const createMockSocket = () => {
  registeredEvents = new Set<string>();
  removedEvents = new Set<string>();
  
  const mockSocketOn = jest.fn((event: string, callback: EventHandler) => {
    registeredEvents.add(event);
    return mockSocket;
  });
  
  const mockSocketOff = jest.fn((event: string) => {
    removedEvents.add(event);
    return mockSocket;
  });
  
  const mockSocketEmit = jest.fn();
  const mockSocketDisconnect = jest.fn();
  
  const mockSocket = {
    on: mockSocketOn,
    off: mockSocketOff,
    emit: mockSocketEmit,
    disconnect: mockSocketDisconnect
  } as unknown as Socket;
  
  return { 
    mockSocket,
    mockSocketOn,
    mockSocketOff,
    mockSocketEmit,
    mockSocketDisconnect
  };
};

// Mock used to hold mock socket data
let mockSocketData = createMockSocket();

// Mock socket.io-client
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => mockSocketData.mockSocket)
}));

// Mock session API service
jest.mock('../../services/api', () => ({
  getSessionStatus: jest.fn(),
  startSession: jest.fn(),
  startVoting: jest.fn(),
}));

describe('useSession hook', () => {
  const mockSessionId = 'session123';
  const mockUserId = 'user1';
  const mockIsOwner = true;

  beforeEach(() => {
    // Reset and recreate all mocks
    jest.clearAllMocks();
    mockSocketData = createMockSocket();
    
    // Reset the mock IO function to return our new mockSocket
    (require('socket.io-client').io as jest.Mock).mockImplementation(() => mockSocketData.mockSocket);
    
    // Setup API mock implementations
    (apiModule.getSessionStatus as jest.Mock).mockResolvedValue({
      id: mockSessionId,
      status: 'WAITING',
      participants: [
        { id: 'user1', name: 'John' },
        { id: 'user2', name: 'Jane' },
      ],
    });
    
    (apiModule.startSession as jest.Mock).mockResolvedValue({
      id: mockSessionId,
      status: 'COLLECTING_IDEAS',
    });
    
    (apiModule.startVoting as jest.Mock).mockResolvedValue({
      id: mockSessionId,
      status: 'VOTING',
    });
  });

  it('should initialize and connect to the socket', async () => {
    await act(async () => {
      renderHook(() => useSession(mockSessionId, mockUserId, mockIsOwner));
      // Wait a bit for socket initialization to complete
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Verify that io() was called to create a socket
    const socketIoModule = require('socket.io-client');
    expect(socketIoModule.io).toHaveBeenCalledWith(expect.any(String), {
      query: { sessionId: mockSessionId, userId: mockUserId },
    });
  });

  it('should load session status on mount', async () => {
    // Render the hook inside act to capture the initial effects
    let result: any;
    
    await act(async () => {
      const rendered = renderHook(() => useSession(mockSessionId, mockUserId, mockIsOwner));
      result = rendered.result;
      // Wait for loadSessionData to be called
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Now check that API was called
    expect(apiModule.getSessionStatus).toHaveBeenCalledWith(mockSessionId);
    
    // Initially it might still be loading, wait for that to finish
    if (result.current.isLoading) {
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    }
    
    // Check the session data
    expect(result.current.session).toEqual({
      id: mockSessionId,
      status: 'WAITING',
      participants: [
        { id: 'user1', name: 'John' },
        { id: 'user2', name: 'Jane' },
      ],
    });
  });

  it('should allow owner to start the session', async () => {
    let result: any;
    
    // First render and wait for initial load
    await act(async () => {
      const rendered = renderHook(() => useSession(mockSessionId, mockUserId, true));
      result = rendered.result;
      // Wait for loadSessionData to be called
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Wait for loading to complete if needed
    if (result.current.isLoading) {
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    }
    
    // Then call startSession
    let updatedSession;
    await act(async () => {
      updatedSession = await result.current.startSession();
      // Wait for state updates
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Check the API call
    expect(apiModule.startSession).toHaveBeenCalledWith(mockSessionId);
    
    // Verify results
    expect(updatedSession).toEqual({
      id: mockSessionId,
      status: 'COLLECTING_IDEAS',
    });
  });

  it('should not allow non-owner to start the session', async () => {
    let result: any;
    
    // Render with isOwner = false
    await act(async () => {
      const rendered = renderHook(() => useSession(mockSessionId, mockUserId, false));
      result = rendered.result;
      // Wait for loadSessionData to be called
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Wait for loading to complete if needed
    if (result.current.isLoading) {
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    }
    
    // Non-owners shouldn't have startSession
    expect(result.current.startSession).toBeUndefined();
  });

  it('should register socket event listeners', async () => {
    // Render the hook and wait for setup
    await act(async () => {
      renderHook(() => useSession(mockSessionId, mockUserId, mockIsOwner));
      // Let useEffect run fully
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    // Verify all expected events were registered
    for (const event of EXPECTED_EVENTS) {
      expect(mockSocketData.mockSocketOn).toHaveBeenCalledWith(event, expect.any(Function));
    }
  });

  it('should clean up on unmount', async () => {
    // Render the hook
    let unmount: (() => void) | undefined;
    
    await act(async () => {
      const rendered = renderHook(() => useSession(mockSessionId, mockUserId, mockIsOwner));
      unmount = rendered.unmount;
      // Let useEffect run fully
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    // Unmount to trigger cleanup
    if (unmount) {
      unmount();
    }
    
    // Verify socket disconnected
    expect(mockSocketData.mockSocketDisconnect).toHaveBeenCalled();
    
    // Verify all expected events were removed
    for (const event of EXPECTED_EVENTS) {
      expect(mockSocketData.mockSocketOff).toHaveBeenCalledWith(event);
    }
  });
}); 