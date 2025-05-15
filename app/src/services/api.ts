import { User, Session, Idea } from '../hooks/useSession';

// Usar la variable de entorno para la URL de la API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

// User Auth
export const registerUser = async (name: string): Promise<User> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to register user:', error);
    throw error;
  }
};

// Session Management
export const createSession = async (userId: string): Promise<Session> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/sessions/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to create session:', error);
    throw error;
  }
};

export const joinSession = async (userId: string, sessionCode: string): Promise<Session> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/sessions/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, code: sessionCode }),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to join session:', error);
    throw error;
  }
};

export const getSessionStatus = async (sessionId: string): Promise<Session> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/status`);

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to get session status:', error);
    throw error;
  }
};

export const startSession = async (sessionId: string): Promise<Session> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to start session:', error);
    throw error;
  }
};

export const startVoting = async (sessionId: string): Promise<Session> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/voting`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to start voting:', error);
    throw error;
  }
};

// Ideas Management
export const submitIdeas = async (
  sessionId: string,
  userId: string,
  ideas: string[],
): Promise<{ success: boolean }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ideas/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId, userId, ideas }),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to submit ideas:', error);
    throw error;
  }
};

// Voting Management
export const submitVotes = async (
  sessionId: string,
  userId: string,
  ideaIds: string[],
): Promise<{ success: boolean }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/votes/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId, userId, ideaIds }),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to submit votes:', error);
    throw error;
  }
};

// Results Management
export const getResults = async (
  sessionId: string,
): Promise<{
  status: string;
  ideas: Idea[];
  selectedIdeas?: Idea[];
  candidateIdeas?: Idea[];
}> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/results`);

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to get results:', error);
    throw error;
  }
}
