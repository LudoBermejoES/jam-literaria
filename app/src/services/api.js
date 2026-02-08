import axios from 'axios';
import i18n from '../i18n';

const API_URL = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

// Create axios instance with credentials
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth services
export const authService = {
  // Register a new user
  register: async (name) => {
    try {
      const response = await api.post('/auth/register', { name });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: i18n.t('errors.registerFailed') };
    }
  },

  // Get current authenticated user
  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch {
      return null; // Return null if not authenticated
    }
  },

  // Log out the current user
  logout: async () => {
    try {
      const response = await api.post('/auth/logout');
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: i18n.t('errors.logoutFailed') };
    }
  },
};

// Session services
export const sessionService = {
  // Create a new session
  createSession: async () => {
    try {
      const response = await api.post('/sessions');
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: i18n.t('home.createFailed') };
    }
  },

  // Get user's sessions
  getUserSessions: async () => {
    try {
      const response = await api.get('/sessions');
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to fetch your sessions' };
    }
  },

  // Get sessions the user has joined
  getJoinedSessions: async () => {
    try {
      const response = await api.get('/sessions/joined');
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to fetch joined sessions' };
    }
  },

  // Join an existing session using code
  joinSession: async (code) => {
    try {
      const response = await api.post('/sessions/join', { code });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: i18n.t('home.joinFailed') };
    }
  },
  
  // Get session details by ID
  getSession: async (sessionId) => {
    try {
      const response = await api.get(`/sessions/${sessionId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: i18n.t('session.fetchFailed') };
    }
  },
  
  // Get session status with participants and ideas
  getSessionStatus: async (sessionId) => {
    try {
      const response = await api.get(`/sessions/${sessionId}/status`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: i18n.t('session.statusFailed') };
    }
  },
  
  // Start a session (for admin only)
  startSession: async (sessionId) => {
    try {
      const response = await api.post(`/sessions/${sessionId}/start`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: i18n.t('session.startFailed') };
    }
  },
  
  // Delete a session (for admin only)
  deleteSession: async (sessionId) => {
    try {
      const response = await api.delete(`/sessions/${sessionId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: i18n.t('session.deleteFailed') };
    }
  }
};

export default api; 