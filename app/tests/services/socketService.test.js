import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock socket.io-client
const mockSocket = {
  on: vi.fn(),
  emit: vi.fn(),
  disconnect: vi.fn()
};

const mockIo = vi.fn(() => mockSocket);

vi.mock('socket.io-client', () => ({
  io: mockIo
}));

describe('SocketService', () => {
  let socketService;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Reset the module to get a fresh instance
    vi.resetModules();
    const module = await import('../../src/services/socketService');
    socketService = module.default;
  });

  afterEach(() => {
    if (socketService.socket) {
      socketService.disconnect();
    }
  });

  describe('init', () => {
    it('should initialize socket with userId', () => {
      socketService.init('user-123');

      expect(mockIo).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          withCredentials: true,
          auth: { userId: 'user-123' }
        })
      );
      expect(socketService.userId).toBe('user-123');
      expect(socketService.socket).toBeDefined();
    });

    it('should set up event listeners on init', () => {
      socketService.init('user-123');

      expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('user-joined', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('user-left', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('session-state', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('session-started', expect.any(Function));
    });

    it('should disconnect existing socket before reinitializing', () => {
      socketService.init('user-1');
      const firstSocket = socketService.socket;

      socketService.init('user-2');

      expect(firstSocket.disconnect).toHaveBeenCalled();
      expect(socketService.userId).toBe('user-2');
    });
  });

  describe('disconnect', () => {
    it('should disconnect and clear socket', () => {
      socketService.init('user-123');
      socketService.disconnect();

      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect(socketService.socket).toBeNull();
    });

    it('should handle disconnect when socket is not initialized', () => {
      expect(() => {
        socketService.disconnect();
      }).not.toThrow();
    });
  });

  describe('joinSession', () => {
    it('should emit join-session event with sessionId', () => {
      socketService.init('user-123');
      socketService.joinSession('session-456');

      expect(mockSocket.emit).toHaveBeenCalledWith('join-session', {
        sessionId: 'session-456'
      });
    });

    it('should not emit when socket is not initialized', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      socketService.joinSession('session-456');

      expect(mockSocket.emit).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Socket not initialized');

      consoleSpy.mockRestore();
    });
  });

  describe('leaveSession', () => {
    it('should emit leave-session event with sessionId', () => {
      socketService.init('user-123');
      socketService.leaveSession('session-456');

      expect(mockSocket.emit).toHaveBeenCalledWith('leave-session', {
        sessionId: 'session-456'
      });
    });

    it('should not emit when socket is not initialized', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      socketService.leaveSession('session-456');

      expect(mockSocket.emit).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Socket not initialized');

      consoleSpy.mockRestore();
    });
  });

  describe('startSession', () => {
    it('should emit start-session event with sessionId', () => {
      socketService.init('user-123');
      socketService.startSession('session-456');

      expect(mockSocket.emit).toHaveBeenCalledWith('start-session', {
        sessionId: 'session-456'
      });
    });

    it('should not emit when socket is not initialized', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      socketService.startSession('session-456');

      expect(mockSocket.emit).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Socket not initialized');

      consoleSpy.mockRestore();
    });
  });

  describe('on - event callbacks', () => {
    it('should register onUserJoined callback', () => {
      const callback = vi.fn();
      socketService.on('onUserJoined', callback);

      expect(socketService.callbacks.onUserJoined).toBe(callback);
    });

    it('should register onUserLeft callback', () => {
      const callback = vi.fn();
      socketService.on('onUserLeft', callback);

      expect(socketService.callbacks.onUserLeft).toBe(callback);
    });

    it('should register onSessionState callback', () => {
      const callback = vi.fn();
      socketService.on('onSessionState', callback);

      expect(socketService.callbacks.onSessionState).toBe(callback);
    });

    it('should register onSessionStarted callback', () => {
      const callback = vi.fn();
      socketService.on('onSessionStarted', callback);

      expect(socketService.callbacks.onSessionStarted).toBe(callback);
    });

    it('should register onError callback', () => {
      const callback = vi.fn();
      socketService.on('onError', callback);

      expect(socketService.callbacks.onError).toBe(callback);
    });

    it('should not register callback for unknown event', () => {
      const callback = vi.fn();
      socketService.on('unknownEvent', callback);

      expect(socketService.callbacks.unknownEvent).toBeUndefined();
    });
  });

  describe('event handlers', () => {
    it('should call onUserJoined callback when user-joined event is received', () => {
      const callback = vi.fn();
      socketService.init('user-123');
      socketService.on('onUserJoined', callback);

      // Find and call the user-joined handler
      const onCalls = mockSocket.on.mock.calls;
      const userJoinedHandler = onCalls.find(call => call[0] === 'user-joined')?.[1];

      const testData = { userId: 'user-456', userName: 'Test User' };
      userJoinedHandler?.(testData);

      expect(callback).toHaveBeenCalledWith(testData);
    });

    it('should call onUserLeft callback when user-left event is received', () => {
      const callback = vi.fn();
      socketService.init('user-123');
      socketService.on('onUserLeft', callback);

      const onCalls = mockSocket.on.mock.calls;
      const userLeftHandler = onCalls.find(call => call[0] === 'user-left')?.[1];

      const testData = { userId: 'user-456' };
      userLeftHandler?.(testData);

      expect(callback).toHaveBeenCalledWith(testData);
    });

    it('should call onSessionState callback when session-state event is received', () => {
      const callback = vi.fn();
      socketService.init('user-123');
      socketService.on('onSessionState', callback);

      const onCalls = mockSocket.on.mock.calls;
      const sessionStateHandler = onCalls.find(call => call[0] === 'session-state')?.[1];

      const testData = { status: 'WAITING', participants: 3 };
      sessionStateHandler?.(testData);

      expect(callback).toHaveBeenCalledWith(testData);
    });

    it('should call onSessionStarted callback when session-started event is received', () => {
      const callback = vi.fn();
      socketService.init('user-123');
      socketService.on('onSessionStarted', callback);

      const onCalls = mockSocket.on.mock.calls;
      const sessionStartedHandler = onCalls.find(call => call[0] === 'session-started')?.[1];

      const testData = { sessionId: 'session-123' };
      sessionStartedHandler?.(testData);

      expect(callback).toHaveBeenCalledWith(testData);
    });

    it('should call onError callback when error event is received', () => {
      const callback = vi.fn();
      socketService.init('user-123');
      socketService.on('onError', callback);

      const onCalls = mockSocket.on.mock.calls;
      const errorHandler = onCalls.find(call => call[0] === 'error')?.[1];

      const testError = new Error('Test error');
      errorHandler?.(testError);

      expect(callback).toHaveBeenCalledWith(testError);
    });

    it('should not throw when callback is not registered and event is received', () => {
      socketService.init('user-123');

      const onCalls = mockSocket.on.mock.calls;
      const userJoinedHandler = onCalls.find(call => call[0] === 'user-joined')?.[1];

      expect(() => {
        userJoinedHandler?.({ userId: 'test' });
      }).not.toThrow();
    });
  });

  describe('singleton behavior', () => {
    it('should maintain state across multiple imports', async () => {
      const module1 = await import('../../src/services/socketService');
      const module2 = await import('../../src/services/socketService');

      expect(module1.default).toBe(module2.default);
    });
  });
});
