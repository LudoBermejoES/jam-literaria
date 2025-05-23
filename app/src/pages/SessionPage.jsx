import React, { useState, useEffect, useContext } from 'react';
import { Routes, Route, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';

// Import existing components
import PostIdeasWaiting from '../components/PostIdeasWaiting';
import LoadingSpinner from '../components/common/LoadingSpinner';
import './SessionPage.css';

const SessionPage = () => {
  const { sessionId } = useParams();
  const { user } = useAuth();
  const { socket } = useContext(SocketContext);
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!socket || !sessionId || !user) return;
    
    // Set up authentication for socket connection
    socket.auth = { userId: user.id };
    
    // Connect if not already connected
    if (!socket.connected) {
      socket.connect();
    }
    
    // Join session room
    socket.emit('join-session', { sessionId });
    
    // Listen for session state
    socket.on('session-state', (data) => {
      setLoading(false);
      
      // Get current path to avoid unnecessary redirects
      const currentPath = window.location.pathname;
      const isOnPostIdeas = currentPath.includes('/post-ideas');
      
      // Route to the appropriate page based on session status
      if (data.session) {
        switch (data.session.status) {
          case 'WAITING':
            if (!currentPath.endsWith(`/${sessionId}`)) {
              navigate(`/session/${sessionId}`, { replace: true });
            }
            break;
          case 'SUBMITTING_IDEAS':
            // Allow staying on post-ideas if already there (for participants who finished submitting)
            // Only redirect to ideas page if not on post-ideas
            if (!currentPath.includes('/ideas') && !isOnPostIdeas) {
              navigate(`/session/${sessionId}/ideas`, { replace: true });
            }
            break;
          case 'VOTING':
            // Allow staying on post-ideas if already there, or redirect to post-ideas
            if (!isOnPostIdeas) {
              navigate(`/session/${sessionId}/post-ideas`, { replace: true });
            }
            break;
          case 'COMPLETED':
            // Allow staying on post-ideas if already there, or redirect to post-ideas  
            if (!isOnPostIdeas) {
              navigate(`/session/${sessionId}/post-ideas`, { replace: true });
            }
            break;
          default:
            if (!currentPath.endsWith(`/${sessionId}`)) {
              navigate(`/session/${sessionId}`, { replace: true });
            }
        }
      }
    });
    
    // Listen for ideation started
    socket.on('ideation-started', () => {
      navigate(`/session/${sessionId}/ideas`, { replace: true });
    });
    
    // Listen for voting started
    socket.on('voting-started', () => {
      navigate(`/session/${sessionId}/post-ideas`, { replace: true });
    });
    
    // Listen for session completed
    socket.on('session-completed', () => {
      navigate(`/session/${sessionId}/post-ideas`, { replace: true });
    });
    
    // Handle errors
    socket.on('error', (error) => {
      setError(error.message);
      setLoading(false);
    });
    
    // Cleanup on unmount
    return () => {
      socket.off('session-state');
      socket.off('ideation-started');
      socket.off('voting-started');
      socket.off('session-completed');
      socket.off('error');
      socket.emit('leave-session', { sessionId });
    };
  }, [socket, sessionId, user, navigate]);
  
  if (loading) {
    return (
      <div className="session-page loading">
        <LoadingSpinner />
        <p>Loading session...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="session-page error">
        <div className="error-container">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/')}>Back to Home</button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="session-page">
      <Routes>
        <Route path="post-ideas" element={<PostIdeasWaiting />} />
        {/* For now, redirect any other routes to the main session page */}
        <Route path="*" element={
          <div className="redirect-message">
            <p>Redirecting to session...</p>
            <button onClick={() => navigate(`/session/${sessionId}`)}>
              Go to Session
            </button>
          </div>
        } />
      </Routes>
    </div>
  );
};

export default SessionPage; 