import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import Button from './common/Button';
import './VotingScreen.css';

const VotingScreen = () => {
  const { sessionId } = useParams();
  const { user } = useAuth();
  const { socket } = useContext(SocketContext);
  const navigate = useNavigate();
  
  const [sessionInfo, setSessionInfo] = useState(null);
  const [ideas, setIdeas] = useState([]);
  const [selectedIdeas, setSelectedIdeas] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [requiredVotes, setRequiredVotes] = useState(3);
  
  // Debug logging for required votes changes
  useEffect(() => {
    console.log('Required votes changed to:', requiredVotes);
  }, [requiredVotes]);
  const [isOwner, setIsOwner] = useState(false);
  
  useEffect(() => {
    if (!socket || !sessionId) return;
    
    // Join session room
    socket.emit('join-session', { sessionId });
    
    // Get ideas for voting
    socket.emit('get-ideas', { sessionId });
    
    // CRITICAL FIX: Get user's voting status for state recovery
    socket.emit('get-user-vote-status', { sessionId });
    
    // Listen for session state
    socket.on('session-state', (data) => {
      setSessionInfo(data);
      setIsOwner(data.owner_id === user?.id);
      setLoading(false);
      
      // Redirect if session is not in voting state
      if (data.status !== 'VOTING') {
        if (data.status === 'WAITING') {
          navigate(`/session/${sessionId}`);
        } else if (data.status === 'SUBMITTING_IDEAS') {
          navigate(`/session/${sessionId}/post-ideas`);
        }
      }
    });
    
    // Listen for ideas
    socket.on('ideas', (data) => {
      if (data.sessionId === sessionId) {
        console.log(`Received ${data.ideas?.length || 0} ideas for session ${sessionId}, round ${data.round}, status: ${data.sessionStatus}`);
        setIdeas(data.ideas || []);
      }
    });
    
    // Listen for voting started event (includes requiredVotes)
    socket.on('voting-started', (data) => {
      if (data.requiredVotes !== undefined) {
        setRequiredVotes(data.requiredVotes);
      }
      if (data.ideas) {
        setIdeas(data.ideas);
      }
    });
    
    // Listen for vote confirmation
    socket.on('vote-confirmed', (data) => {
      setHasVoted(true);
      setSubmitting(false);
      if (data.requiredVotes !== undefined) {
        setRequiredVotes(data.requiredVotes);
      }
    });
    
    // Listen for voting completion
    socket.on('voting-complete', () => {
      navigate(`/session/${sessionId}/results`);
    });
    
    // Listen for new voting round
    socket.on('new-voting-round', (data) => {
      console.log('Received new-voting-round event:', data);
      setIdeas(data.candidateIdeas || []);
      setSelectedIdeas(new Set());
      setHasVoted(false);
      if (data.requiredVotes !== undefined) {
        console.log('Setting required votes to:', data.requiredVotes);
        setRequiredVotes(data.requiredVotes);
      }
      
      // Request updated vote status for the new round
      socket.emit('get-user-vote-status', { sessionId });
    });
    
    // CRITICAL FIX: Listen for user vote status (state recovery)
    socket.on('user-vote-status', (data) => {
      console.log('Received user-vote-status:', data);
      
      if (data.sessionId === sessionId) {
        // Update required votes
        if (data.requiredVotes !== undefined) {
          setRequiredVotes(data.requiredVotes);
        }
        
        // Recover voting state
        if (data.hasVoted) {
          setHasVoted(true);
          setSubmitting(false);
          
          // Recover selected ideas if available
          if (data.userVotes && data.userVotes.length > 0) {
            const votedIdeaIds = new Set(data.userVotes.map(vote => vote.ideaId));
            setSelectedIdeas(votedIdeaIds);
            console.log('Recovered voting state:', { 
              hasVoted: true, 
              selectedIdeas: Array.from(votedIdeaIds) 
            });
          }
        } else {
          // User hasn't voted yet
          setHasVoted(false);
          setSelectedIdeas(new Set());
          console.log('User has not voted yet in round', data.round);
        }
      }
    });
    
    // Error handling
    socket.on('error', (error) => {
      setError(error.message);
      setSubmitting(false);
    });
    
    return () => {
      socket.off('session-state');
      socket.off('ideas');
      socket.off('voting-started');
      socket.off('vote-confirmed');
      socket.off('voting-complete');
      socket.off('new-voting-round');
      socket.off('user-vote-status');
      socket.off('error');
    };
  }, [socket, sessionId, user?.id, navigate]);
  
  // Handle idea selection
  const handleIdeaSelect = (ideaId) => {
    if (hasVoted) return;
    
    const newSelection = new Set(selectedIdeas);
    
    if (newSelection.has(ideaId)) {
      // Deselect if already selected
      newSelection.delete(ideaId);
    } else if (newSelection.size < requiredVotes) {
      // Select if under limit
      newSelection.add(ideaId);
    }
    
    setSelectedIdeas(newSelection);
  };
  
  // Submit votes
  const handleSubmitVotes = () => {
    if (selectedIdeas.size !== requiredVotes || hasVoted) return;
    
    setSubmitting(true);
    
    // Submit all selected ideas in a single call
    const ideaIds = Array.from(selectedIdeas);
    socket.emit('submit-votes', { sessionId, ideaIds });
  };
  
  // Loading state
  if (loading) {
    return <div className="voting-screen loading">Loading voting information...</div>;
  }
  
  // Error state
  if (error) {
    return (
      <div className="voting-screen error">
        <div className="error-message">{error}</div>
        <Button onClick={() => navigate(`/session/${sessionId}`)}>Back to Session</Button>
      </div>
    );
  }
  
  // Voted state
  if (hasVoted) {
    return (
      <div className="voting-screen voted">
        <h2>Vote Submitted!</h2>
        <div className="waiting-message">
          <p>You have successfully submitted your votes.</p>
          <p>Waiting for other participants to vote...</p>
          <div className="progress-container">
            <div className="spinner"></div>
          </div>
        </div>
        
        <div className="session-info">
          <p>Session: {sessionInfo?.code}</p>
          <p>Your selected ideas: {selectedIdeas.size}</p>
        </div>
        
        {/* Show selected ideas for confirmation */}
        {selectedIdeas.size > 0 && (
          <div className="selected-ideas-summary">
            <h3>Your Selected Ideas:</h3>
            <div className="selected-ideas-list">
              {ideas.filter(idea => selectedIdeas.has(idea.id)).map((idea, index) => (
                <div key={idea.id || index} className="selected-idea-summary">
                  <div className="idea-content">{idea.content}</div>
                  <div className="selection-badge">✓ Selected</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className="voting-screen">
      <h2>Vote for Ideas</h2>
      
      <div className="voting-instructions">
        <p>Select exactly <strong>{requiredVotes} ideas</strong> that you think are the best.</p>
        <p className="selection-counter">
          Selected: {selectedIdeas.size} / {requiredVotes}
        </p>
      </div>
      
      <div className="ideas-grid">
        {ideas.map((idea, index) => {
          const isSelected = selectedIdeas.has(idea.id);
          const canSelect = selectedIdeas.size < requiredVotes || isSelected;
          
          return (
            <div 
              key={idea.id || index} 
              className={`idea-card ${isSelected ? 'selected' : ''} ${!canSelect ? 'disabled' : ''}`}
              onClick={() => handleIdeaSelect(idea.id)}
            >
              <div className="idea-content">{idea.content}</div>
              <div className="idea-meta">
                {isOwner && (
                  <span className="idea-author">— {idea.author_name}</span>
                )}
                {isSelected && (
                  <span className="selection-badge">✓ Selected</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {ideas.length === 0 && (
        <div className="no-ideas">
          <p>No ideas available for voting.</p>
        </div>
      )}
      
      <div className="voting-controls">
        <Button 
          onClick={handleSubmitVotes}
          disabled={selectedIdeas.size !== requiredVotes || submitting}
          className="submit-votes-button"
          variant="primary"
          size="large"
        >
          {submitting 
            ? "Submitting votes..." 
            : selectedIdeas.size === requiredVotes
              ? `Submit ${requiredVotes} votes`
              : `Select ${requiredVotes - selectedIdeas.size} more idea${requiredVotes - selectedIdeas.size > 1 ? 's' : ''}`
          }
        </Button>
      </div>
    </div>
  );
};

export default VotingScreen;