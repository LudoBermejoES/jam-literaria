import { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/api';

// Create the authentication context
const AuthContext = createContext(null);

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await authService.getCurrentUser();
        if (response && response.success) {
          setUser(response.data.user);
        }
      } catch (error) {
        // User is not authenticated
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Register a new user
  const register = async (name) => {
    try {
      setLoading(true);
      const response = await authService.register(name);
      if (response && response.success) {
        setUser(response.data.user);
      }
      return response;
    } finally {
      setLoading(false);
    }
  };

  // Logout current user
  const logout = async () => {
    try {
      setLoading(true);
      await authService.logout();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook for using auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 