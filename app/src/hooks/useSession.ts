import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { getSessionStatus, startSession, startVoting } from '../services/api';

// Socket.io server URL
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || '';

interface User {
  id: string;
  name: string;
}

interface Idea {
  id: string;
  content: string;
  authorId: string;
}

interface Session {
  id: string;
  code: string;
  status: string;
  ownerId: string;
  participants?: User[];
  ideas?: Idea[];
}

const useSession = (sessionId: string, userId: string, isOwner: boolean) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // Load session data
  const loadSessionData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const sessionData = await getSessionStatus(sessionId);
      setSession(sessionData);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to load session data';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  // Initialize socket connection
  useEffect(() => {
    // Connect to Socket.io server
    try {
      socketRef.current = io(SOCKET_URL, {
        query: { sessionId, userId }
      });

      // Setup event listeners
      const socket = socketRef.current;

      if (socket) {
        // Handle user joining the session
        socket.on('user-joined', (user: User) => {
          setSession(prevSession => {
            if (!prevSession) return prevSession;
            const participants = [...(prevSession.participants || [])];
            
            // Add user if not already in participants list
            if (!participants.some(p => p.id === user.id)) {
              participants.push(user);
            }
            
            return { ...prevSession, participants };
          });
        });

        // Handle session status changes
        socket.on('session-started', (updatedSession: Session) => {
          setSession(updatedSession);
        });

        // Handle idea submissions
        socket.on('idea-submitted', ({ userId, count }: { userId: string, count: number }) => {
          // Could update a local state to track which users have submitted ideas
          console.log(`User ${userId} submitted ${count} ideas`);
        });

        // Handle voting updates
        socket.on('vote-submitted', ({ userId, timestamp }: { userId: string, timestamp: string }) => {
          // Could update a local state to track which users have voted
          console.log(`User ${userId} voted at ${timestamp}`);
        });

        // Handle voting results
        socket.on('voting-results', (results: {
          action: 'FINALIZAR' | 'NUEVA_RONDA';
          elegidas?: Idea[];
          candidatas?: Idea[];
        }) => {
          setSession(prevSession => {
            if (!prevSession) return prevSession;
            
            return {
              ...prevSession,
              status: results.action === 'FINALIZAR' ? 'FINISHED' : 'REVOTING',
              ideasElegidas: results.elegidas || [],
              ideasCandidatas: results.candidatas || []
            };
          });
        });
      }

      // Load initial session data
      loadSessionData();

      // Cleanup on unmount
      return () => {
        if (socket) {
          // Remove all event listeners
          socket.off('user-joined');
          socket.off('session-started');
          socket.off('idea-submitted');
          socket.off('vote-submitted');
          socket.off('voting-results');
          
          // Disconnect socket
          socket.disconnect();
        }
      };
    } catch (e) {
      console.error("Error setting up socket:", e);
      setError("Failed to connect to session");
      return () => {};
    }
  }, [sessionId, userId, loadSessionData]);

  // Owner-only functions
  const ownerActions = isOwner ? {
    startSession: async () => {
      setIsLoading(true);
      setError(null);

      try {
        const updatedSession = await startSession(sessionId);
        setSession(updatedSession);
        return updatedSession;
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'Failed to start session';
        setError(errorMessage);
        throw e;
      } finally {
        setIsLoading(false);
      }
    },

    startVoting: async () => {
      setIsLoading(true);
      setError(null);

      try {
        const updatedSession = await startVoting(sessionId);
        setSession(updatedSession);
        return updatedSession;
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'Failed to start voting';
        setError(errorMessage);
        throw e;
      } finally {
        setIsLoading(false);
      }
    }
  } : {};

  return {
    session,
    isLoading,
    error,
    ...ownerActions,
    reload: loadSessionData
  };
};

export default useSession; 