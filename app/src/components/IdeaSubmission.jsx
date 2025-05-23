import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import Button from './common/Button';
import TextArea from './common/TextArea';
import './IdeaSubmission.css';

const IdeaSubmission = () => {
  const { sessionId } = useParams();
  const { user } = useAuth();
  const { socket } = useContext(SocketContext);
  const navigate = useNavigate();
  const navigationAttempted = useRef(false);
  const processedIdeas = useRef(new Set());
  
  const [ideas, setIdeas] = useState(['']);
  const [submitted, setSubmitted] = useState(false);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submittedIdeas, setSubmittedIdeas] = useState([]);
  const [maxIdeasPerUser, setMaxIdeasPerUser] = useState(2); // Default value
  
  useEffect(() => {
    if (!socket || !sessionId) return;
    
    // Get session details when component mounts
    socket.emit('join-session', { sessionId });
    
    // Listen for session state
    socket.on('session-state', (data) => {
      setSessionInfo(data);
      setLoading(false);
      
      // If session is not in SUBMITTING_IDEAS state, redirect
      if (data.status !== 'SUBMITTING_IDEAS') {
        navigate(`/session/${sessionId}`);
      }
      
      // Set maximum ideas per user from server data
      if (data.maxIdeasPerUser) {
        setMaxIdeasPerUser(data.maxIdeasPerUser);
        setIdeas(Array(data.maxIdeasPerUser).fill(''));
      }
    });
    
    // Listen for session status changes
    socket.on('session-started', (data) => {
      setSessionInfo(data.session);
      
      // Update max ideas per user if provided
      if (data.maxIdeasPerUser) {
        setMaxIdeasPerUser(data.maxIdeasPerUser);
        setIdeas(Array(data.maxIdeasPerUser).fill(''));
      }
    });
    
    // Listen for idea submission confirmations
    socket.on('idea-submitted', (data) => {
      console.log('Received idea-submitted:', data);
      if (data.user.id === user.id) {
        // Create a unique key for this idea event
        const ideaKey = `${data.idea.id}-${data.idea.content}-${data.idea.author_id}`;
        
        // Check if we've already processed this exact idea event
        if (processedIdeas.current.has(ideaKey)) {
          console.log('Idea event already processed, skipping:', ideaKey);
          return;
        }
        
        // Mark this idea as processed
        processedIdeas.current.add(ideaKey);
        
        setSubmittedIdeas(prev => {
          // Additional check - if this exact idea already exists, skip
          const exists = prev.some(idea => idea.id === data.idea.id);
          if (exists) {
            console.log('Idea already exists in array, skipping:', data.idea.id);
            return prev;
          }
          
          console.log('Adding new idea to submittedIdeas:', data.idea);
          const newIdeas = [...prev, data.idea];
          console.log('Updated submittedIdeas count:', newIdeas.length);
          return newIdeas;
        });
      }
    });
    
    // Listen for transition to voting phase
    socket.on('voting-started', () => {
      navigate(`/session/${sessionId}/voting`);
    });
    
    // Error handling
    socket.on('error', (error) => {
      setError(error.message);
      setLoading(false);
    });
    
    return () => {
      socket.off('session-state');
      socket.off('session-started');
      socket.off('idea-submitted');
      socket.off('voting-started');
      socket.off('error');
    };
  }, [socket, sessionId, user.id, navigate]);
  
  // Handle navigation to post-ideas screen when user has submitted all ideas
  useEffect(() => {
    // If navigation already attempted, don't try again
    if (navigationAttempted.current) {
      return;
    }
    
    // Check if navigation should happen
    const shouldNavigate = !loading && sessionInfo && (submitted || (submittedIdeas.length >= maxIdeasPerUser && submittedIdeas.length > 0));
    
    console.log('Navigation check:', {
      loading,
      sessionInfo: !!sessionInfo,
      submitted,
      submittedIdeas: submittedIdeas.length,
      maxIdeasPerUser,
      shouldNavigate,
      navigationAttempted: navigationAttempted.current
    });
    
    if (shouldNavigate) {
      console.log('Navigation conditions met, navigating immediately...');
      navigationAttempted.current = true;
      
      // Navigate immediately
      setTimeout(() => {
        console.log('Executing navigation to post-ideas');
        navigate(`/session/${sessionId}/post-ideas`);
      }, 50);
    }
  }, [submitted, submittedIdeas.length, maxIdeasPerUser, loading, sessionInfo, navigate, sessionId]);
  
  // Handle idea input change
  const handleIdeaChange = (index, value) => {
    const newIdeas = [...ideas];
    newIdeas[index] = value;
    setIdeas(newIdeas);
  };
  
  // Submit ideas
  const handleSubmit = () => {
    // Validate ideas
    const nonEmptyIdeas = ideas.filter(idea => idea.trim() !== '');
    if (nonEmptyIdeas.length === 0) {
      setError('Please enter at least one idea');
      return;
    }
    
    // Submit each idea
    setLoading(true);
    
    nonEmptyIdeas.forEach(idea => {
      socket.emit('submit-idea', {
        sessionId,
        content: idea.trim()
      });
    });
    
    setSubmitted(true);
    setLoading(false);
  };
  
  if (loading && !sessionInfo) {
    return <div className="idea-submission loading">Loading session information...</div>;
  }
  
  return (
    <div className="idea-submission">
      <h2>Submit Your Ideas</h2>
      {sessionInfo && (
        <div className="session-info">
          <p>Session: {sessionInfo.code}</p>
          <p>
            Please submit {maxIdeasPerUser} idea{maxIdeasPerUser > 1 ? 's' : ''}
            {submittedIdeas.length > 0 && ` (${submittedIdeas.length} submitted)`}
          </p>
        </div>
      )}
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        {ideas.map((idea, index) => (
          <div key={index} className="idea-input-container">
            <label htmlFor={`idea-${index}`}>Idea {index + 1}</label>
            <TextArea
              id={`idea-${index}`}
              value={idea}
              onChange={(e) => handleIdeaChange(index, e.target.value)}
              placeholder="Write your idea here..."
              disabled={submittedIdeas.some(si => si.content === idea && idea !== '')}
            />
          </div>
        ))}
        
        <Button 
          type="submit" 
          disabled={loading || submittedIdeas.length >= maxIdeasPerUser || submitted}
          className="submit-ideas-button"
        >
          {loading ? 'Submitting...' : submitted ? 'Ideas Submitted!' : 'Submit Ideas'}
        </Button>
      </form>
    </div>
  );
};

export default IdeaSubmission; 