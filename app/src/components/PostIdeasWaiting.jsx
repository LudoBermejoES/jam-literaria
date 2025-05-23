import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import Button from './common/Button';
import './PostIdeasWaiting.css';

const PostIdeasWaiting = () => {
  const { sessionId } = useParams();
  const { user } = useAuth();
  const { socket } = useContext(SocketContext);
  const navigate = useNavigate();
  
  const [sessionInfo, setSessionInfo] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [ideas, setIdeas] = useState([]);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startingVoting, setStartingVoting] = useState(false);
  
  useEffect(() => {
    if (!socket || !sessionId) return;
    
    // Join session room
    socket.emit('join-session', { sessionId });
    
    // Get ideas for the session
    socket.emit('get-ideas', { sessionId });
    
    // Listen for session state
    socket.on('session-state', (data) => {
      console.log('PostIdeasWaiting - Session state received:', data);
      console.log('PostIdeasWaiting - Current user:', user);
      
      setSessionInfo(data);
      setParticipants(data.participants || []);
      
      const ownerCheck = data.owner_id === user?.id;
      console.log('PostIdeasWaiting - Owner check:', {
        sessionOwnerId: data.owner_id,
        userId: user?.id,
        isOwner: ownerCheck
      });
      
      setIsOwner(ownerCheck);
      setLoading(false);
      
      // Only redirect if session is in an incompatible state
      // Allow SUBMITTING_IDEAS state since users might still be on this screen
      if (data.status === 'WAITING') {
        navigate(`/session/${sessionId}`);
      }
      // Note: Removed automatic redirect for VOTING status since this screen 
      // is also used during voting phase for owners to manage the transition
    });
    
    // Listen for ideas list
    socket.on('ideas', (data) => {
      console.log('PostIdeasWaiting - Ideas received:', data);
      if (data.sessionId === sessionId) {
        setIdeas(data.ideas || []);
      }
    });
    
    // Listen for new ideas being submitted
    socket.on('idea-submitted', () => {
      socket.emit('get-ideas', { sessionId });
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
    
    // Cleanup on unmount
    return () => {
      socket.off('session-state');
      socket.off('ideas');
      socket.off('idea-submitted');
      socket.off('voting-started');
      socket.off('error');
    };
  }, [socket, sessionId, user?.id, navigate]);
  
  // Re-check ownership when user becomes available
  useEffect(() => {
    if (sessionInfo && user?.id) {
      const ownerCheck = sessionInfo.owner_id === user.id;
      console.log('PostIdeasWaiting - Re-checking ownership:', {
        sessionOwnerId: sessionInfo.owner_id,
        userId: user.id,
        isOwner: ownerCheck
      });
      setIsOwner(ownerCheck);
    }
  }, [user?.id, sessionInfo]);
  
  // Start voting (owner only)
  const handleStartVoting = () => {
    if (!isOwner || !sessionId) return;
    
    setStartingVoting(true);
    socket.emit('start-voting', { sessionId });
  };
  
  // Group ideas by author
  const getParticipantsWithIdeasCount = () => {
    const ideasByAuthor = {};
    
    // Count ideas for each author
    ideas.forEach(idea => {
      if (!ideasByAuthor[idea.author_id]) {
        ideasByAuthor[idea.author_id] = 0;
      }
      ideasByAuthor[idea.author_id]++;
    });
    
    // Add idea counts to participants
    return participants.map(participant => ({
      ...participant,
      ideasCount: ideasByAuthor[participant.id] || 0,
      ideaLimitReached: ideasByAuthor[participant.id] >= sessionInfo?.maxIdeasPerUser
    }));
  };
  
  // Check if all participants have submitted their ideas
  const areAllIdeasSubmitted = () => {
    const participantsWithIdeas = getParticipantsWithIdeasCount();
    return participantsWithIdeas.every(p => p.ideaLimitReached);
  };
  
  // Loading state
  if (loading) {
    return <div className="waiting-screen loading">Loading session information...</div>;
  }
  
  // Error state
  if (error) {
    return (
      <div className="waiting-screen error">
        <div className="error-message">{error}</div>
        <Button onClick={() => navigate(`/session/${sessionId}`)}>Back to Session</Button>
      </div>
    );
  }
  
  // Participant view
  if (!isOwner) {
    console.log('PostIdeasWaiting - Rendering PARTICIPANT view', { isOwner, user, sessionInfo });
    return (
      <div className="waiting-screen participant">
        <h2>Ideas Submitted!</h2>
        <div className="waiting-message">
          <p>You have successfully submitted your ideas.</p>
          <p>Waiting for the session owner to start the voting phase...</p>
          <div className="progress-container">
            <div className="spinner"></div>
            <p>All participants must submit their ideas before voting can begin.</p>
          </div>
        </div>
        
        <div className="session-info">
          <p>Session: {sessionInfo?.session?.code}</p>
          <p>Total ideas submitted: {ideas.length}</p>
          {sessionInfo?.maxIdeasPerUser && participants.length > 0 && (
            <p>
              Progress: {ideas.length} / {participants.length * sessionInfo.maxIdeasPerUser} ideas total
            </p>
          )}
        </div>
      </div>
    );
  }
  
  // Owner view
  console.log('PostIdeasWaiting - Rendering OWNER view', { isOwner, user, sessionInfo, ideas: ideas.length, participants: participants.length });
  const participantsWithIdeas = getParticipantsWithIdeasCount();
  const allIdeasSubmitted = areAllIdeasSubmitted();
  
  return (
    <div className="waiting-screen owner">
      <h2>Ideas Submitted</h2>
      
      <div className="ideas-status">
        <p>
          <strong>Total ideas submitted:</strong> {ideas.length}
          {sessionInfo?.maxIdeasPerUser && (
            <span> / {participants.length * sessionInfo.maxIdeasPerUser} maximum</span>
          )}
        </p>
        
        {allIdeasSubmitted ? (
          <div className="all-submitted">All participants have submitted their ideas!</div>
        ) : (
          <div className="waiting">Waiting for participants to submit their ideas...</div>
        )}
      </div>

      {/* Display all submitted ideas */}
      {ideas.length > 0 && (
        <div className="submitted-ideas-section">
          <h3>All Submitted Ideas</h3>
          <div className="ideas-grid">
            {ideas.map((idea, index) => {
              const author = participants.find(p => p.id === idea.author_id);
              return (
                <div key={idea.id || index} className="idea-card">
                  <div className="idea-content">{idea.content}</div>
                  <div className="idea-author">
                    — {author?.name || 'Unknown Author'}
                    {idea.author_id === sessionInfo?.owner_id && (
                      <span className="owner-badge">You</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      <div className="participant-list">
        <h3>Participant Status</h3>
        <ul>
          {participantsWithIdeas.map(participant => (
            <li 
              key={participant.id} 
              className={participant.ideaLimitReached ? 'completed' : 'pending'}
            >
              <span className="participant-name">
                {participant.name}
                {participant.id === sessionInfo?.owner_id && (
                  <span className="owner-badge">Owner</span>
                )}
              </span>
              <span className="idea-count">
                {participant.ideasCount} / {sessionInfo?.maxIdeasPerUser || '?'} ideas
              </span>
              <span className="status-indicator"></span>
            </li>
          ))}
        </ul>
      </div>
      
      <div className="owner-controls">
        <Button 
          onClick={handleStartVoting}
          disabled={startingVoting || !allIdeasSubmitted}
          className="start-voting-button"
          variant={allIdeasSubmitted ? "primary" : "secondary"}
          size="large"
        >
          {startingVoting 
            ? "Starting voting..." 
            : allIdeasSubmitted 
              ? "Start Voting Phase" 
              : "Waiting for all ideas..."}
        </Button>
        
        {!allIdeasSubmitted && (
          <p className="waiting-note">
            You can start the voting phase when all participants have submitted their ideas.
          </p>
        )}
      </div>
    </div>
  );
};

export default PostIdeasWaiting; 