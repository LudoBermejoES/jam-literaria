import React, { createContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import AuthContext from './AuthContext';

// Create context
export const SocketContext = createContext(null);

// Socket.IO server URL
const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Inner component to use the Auth Context
const SocketConnection = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const authContext = React.useContext(AuthContext);
  const { user, isAuthenticated } = authContext || {};

  useEffect(() => {
    let socketInstance = null;

    // Only connect if the user is authenticated
    if (isAuthenticated && user?.id) {
      // Create socket connection with auth data in handshake
      socketInstance = io(SOCKET_URL, {
        withCredentials: true,
        autoConnect: true,
        auth: {
          userId: user.id
        }
      });

      // Connection events
      socketInstance.on('connect', () => {
        console.log('Socket connected successfully');
      });

      socketInstance.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

      socketInstance.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
      });

      socketInstance.on('error', (error) => {
        console.error('Socket error:', error);
      });

      // Save socket instance
      setSocket(socketInstance);
    }

    // Cleanup function
    return () => {
      if (socketInstance) {
        console.log('Cleaning up socket connection');
        socketInstance.disconnect();
      }
    };
  }, [isAuthenticated, user?.id]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

// Main provider wrapper
export const SocketProvider = ({ children }) => {
  return <SocketConnection>{children}</SocketConnection>;
};

export default SocketContext; 