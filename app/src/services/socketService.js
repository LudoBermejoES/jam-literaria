import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.userId = null;
    this.callbacks = {
      onUserJoined: null,
      onUserLeft: null,
      onSessionState: null,
      onSessionStarted: null,
      onError: null
    };
  }

  init(userId) {
    if (this.socket) {
      this.disconnect();
    }

    this.userId = userId;
    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    this.socket = io(socketUrl, {
      withCredentials: true,
      auth: {
        userId
      }
    });

    // Set up event listeners
    this.socket.on('connect', () => {
      console.log('Socket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      if (this.callbacks.onError) {
        this.callbacks.onError(error);
      }
    });

    this.socket.on('user-joined', (data) => {
      console.log('User joined:', data);
      if (this.callbacks.onUserJoined) {
        this.callbacks.onUserJoined(data);
      }
    });

    this.socket.on('user-left', (data) => {
      console.log('User left:', data);
      if (this.callbacks.onUserLeft) {
        this.callbacks.onUserLeft(data);
      }
    });

    this.socket.on('session-state', (data) => {
      console.log('Session state:', data);
      if (this.callbacks.onSessionState) {
        this.callbacks.onSessionState(data);
      }
    });

    this.socket.on('session-started', (data) => {
      console.log('Session started:', data);
      if (this.callbacks.onSessionStarted) {
        this.callbacks.onSessionStarted(data);
      }
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Join a session room
  joinSession(sessionId) {
    if (!this.socket) {
      console.error('Socket not initialized');
      return;
    }
    
    this.socket.emit('join-session', { sessionId });
  }

  // Leave a session room
  leaveSession(sessionId) {
    if (!this.socket) {
      console.error('Socket not initialized');
      return;
    }
    
    this.socket.emit('leave-session', { sessionId });
  }

  // Start a session (admin only)
  startSession(sessionId) {
    if (!this.socket) {
      console.error('Socket not initialized');
      return;
    }
    
    this.socket.emit('start-session', { sessionId });
  }

  // Set event callbacks
  on(event, callback) {
    if (this.callbacks[event] !== undefined) {
      this.callbacks[event] = callback;
    }
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService; 