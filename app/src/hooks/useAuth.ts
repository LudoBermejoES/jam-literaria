import { useState, useEffect } from 'react';
import { registerUser, joinSession, createSession } from '../services/api';

interface User {
  id: string;
  name: string;
}

interface Session {
  id: string;
  code: string;
  ownerId?: string;
  status?: string;
}

const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load user and session from localStorage on init
    const storedUser = localStorage.getItem('user');
    const storedSession = localStorage.getItem('session');

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Error parsing stored user:', e);
      }
    }

    if (storedSession) {
      try {
        setSession(JSON.parse(storedSession));
      } catch (e) {
        console.error('Error parsing stored session:', e);
      }
    }
  }, []);

  const handleRegisterUser = async (name: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const newUser = await registerUser(name);
      setUser(newUser);

      // Store user in localStorage
      localStorage.setItem('user', JSON.stringify(newUser));

      return newUser;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Error registering user';
      setError(errorMessage);
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSession = async () => {
    if (!user) {
      setError('User must be registered before creating a session');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const newSession = await createSession(user.id);
      setSession(newSession);

      // Store session in localStorage
      localStorage.setItem('session', JSON.stringify(newSession));

      return newSession;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Error creating session';
      setError(errorMessage);
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinSession = async (code: string) => {
    if (!user) {
      setError('User must be registered before joining a session');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const joinedSession = await joinSession(user.id, code);
      setSession(joinedSession);

      // Store session in localStorage
      localStorage.setItem('session', JSON.stringify(joinedSession));

      return joinedSession;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Error joining session';
      setError(errorMessage);
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setSession(null);
    setError(null);

    // Clear stored data
    localStorage.removeItem('user');
    localStorage.removeItem('session');
  };

  return {
    user,
    session,
    isLoading,
    error,
    registerUser: handleRegisterUser,
    createSession: handleCreateSession,
    joinSession: handleJoinSession,
    logout: handleLogout,
  };
};

export default useAuth;
