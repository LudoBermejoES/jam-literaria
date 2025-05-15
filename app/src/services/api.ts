// Base API URL
const API_URL = process.env.REACT_APP_API_URL || '/api';

// User API

interface User {
  id: string;
  name: string;
}

export const registerUser = async (name: string): Promise<User> => {
  const response = await fetch(`${API_URL}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to register user');
  }

  return response.json();
};

// Session API

interface Session {
  id: string;
  code: string;
  status: string;
  ownerId: string;
  participants?: User[];
  ideas?: Idea[];
}

interface Idea {
  id: string;
  content: string;
  authorId: string;
}

export const createSession = async (userId: string): Promise<Session> => {
  const response = await fetch(`${API_URL}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create session');
  }

  return response.json();
};

export const joinSession = async (userId: string, code: string): Promise<Session> => {
  const response = await fetch(`${API_URL}/sessions/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, code })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to join session');
  }

  return response.json();
};

export const getSessionStatus = async (sessionId: string): Promise<Session> => {
  const response = await fetch(`${API_URL}/sessions/${sessionId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get session status');
  }

  return response.json();
};

export const startSession = async (sessionId: string): Promise<Session> => {
  const response = await fetch(`${API_URL}/sessions/${sessionId}/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to start session');
  }

  return response.json();
};

// Ideas API

export const submitIdeas = async (sessionId: string, userId: string, ideas: string[]): Promise<{success: boolean}> => {
  const response = await fetch(`${API_URL}/sessions/${sessionId}/ideas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, ideas })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to submit ideas');
  }

  return response.json();
};

// Voting API

export const startVoting = async (sessionId: string): Promise<Session> => {
  const response = await fetch(`${API_URL}/sessions/${sessionId}/voting`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to start voting');
  }

  return response.json();
};

export const submitVotes = async (sessionId: string, userId: string, ideaIds: string[]): Promise<{success: boolean}> => {
  const response = await fetch(`${API_URL}/sessions/${sessionId}/votes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, ideaIds })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to submit votes');
  }

  return response.json();
};

export const processVotes = async (sessionId: string): Promise<{
  action: 'FINALIZAR' | 'NUEVA_RONDA';
  elegidas?: Idea[];
  candidatas?: Idea[];
}> => {
  const response = await fetch(`${API_URL}/sessions/${sessionId}/process-votes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to process votes');
  }

  return response.json();
}; 