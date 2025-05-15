import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import * as api from '../services/api';

// Usar la variable de entorno para la URL de Socket.io
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:4000';

export interface User {
  id: string;
  name: string;
}

export interface Idea {
  id: string;
  content: string;
  authorId: string;
}

export interface Session {
  id: string;
  code: string;
  status: string;
  ownerId: string;
  participants?: User[];
  ideas?: Idea[];
  ideasElegidas?: Idea[];
  ideasCandidatas?: Idea[];
}

const useSession = (sessionId: string, userId: string, isOwner: boolean) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const sessionData = await api.getSessionStatus(sessionId);
        setSession(sessionData);
        setError(null);
      } catch (e) {
        setError('Failed to load session');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();

    // Socket.io setup
    try {
      // Usar la URL de Socket.io desde variables de entorno
      const socketConnection = io(SOCKET_URL, {
        query: { sessionId, userId }
      });
      
      setSocket(socketConnection);

      // Handle connection events
      socketConnection.on('connect', () => {
        console.log('Connected to session socket');
      });

      socketConnection.on('user-joined', (user: User) => {
        setSession((prevSession) => {
          if (!prevSession) return prevSession;
            
          const existingParticipant = prevSession.participants?.some(
            (p) => p.id === user.id
          );
              
          if (existingParticipant) {
            return prevSession;
          }
              
          return {
            ...prevSession,
            participants: [...(prevSession.participants || []), user]
          };
        });
      });

      socketConnection.on('idea-submitted', ({ userId, count }: { userId: string; count: number }) => {
        console.log(`User ${userId} submitted ${count} ideas`);
      });

      socketConnection.on(
        'vote-submitted',
        ({ userId, timestamp }: { userId: string; timestamp: string }) => {
          // Could update a local state to track which users have voted
          console.log(`User ${userId} voted at ${timestamp}`);
        },
      );

      socketConnection.on(
        'voting-results',
        (results: {
          action: 'FINALIZAR' | 'NUEVA_RONDA';
          elegidas?: Idea[];
          candidatas?: Idea[];
        }) => {
          setSession((prevSession) => {
            if (!prevSession) return prevSession;
              
            return {
              ...prevSession,
              status: results.action === 'FINALIZAR' ? 'FINISHED' : 'REVOTING',
              ideasElegidas: results.elegidas || [],
              ideasCandidatas: results.candidatas || [],
            };
          });
        },
      );

    } catch (e) {
      console.error('Error setting up socket:', e);
      setError('Failed to connect to session');
      setIsLoading(false); // Ensure loading state is updated even on error
    }

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [sessionId, userId]);

  // Functions that require being the session owner
  const ownerFunctions = isOwner
    ? {
        startSession: async () => {
          setIsLoading(true);
          setError(null);

          try {
            const updatedSession = await api.startSession(sessionId);
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
            const updatedSession = await api.startVoting(sessionId);
            setSession(updatedSession);
            return updatedSession;
          } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'Failed to start voting';
            setError(errorMessage);
            throw e;
          } finally {
            setIsLoading(false);
          }
        },
      }
    : {};

  // Function to reload session data
  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const sessionData = await api.getSessionStatus(sessionId);
      setSession(sessionData);
    } catch (e) {
      setError('Failed to reload session');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  return {
    session,
    isLoading,
    error,
    reload,
    ...ownerFunctions,
  };
};

export default useSession;
