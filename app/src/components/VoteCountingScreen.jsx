import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import { useTranslation } from 'react-i18next';
import Button from './common/Button';
import './VoteCountingScreen.css';

const VoteCountingScreen = () => {
  const { sessionId } = useParams();
  const { user } = useAuth();
  const { socket } = useContext(SocketContext);
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [sessionInfo, setSessionInfo] = useState(null);
  const [voteStatus, setVoteStatus] = useState(null);
  const [voteResults, setVoteResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!socket || !sessionId) return;

    // Join session room
    socket.emit('join-session', { sessionId });
    
    // Get initial session state
    socket.emit('get-session-state', { sessionId });
    
    // Get vote status
    socket.emit('get-vote-status', { sessionId });

    // Listen for session state updates
    socket.on('session-state', (data) => {
      setSessionInfo(data);
      setIsOwner(data.owner_id === user?.id);
      setLoading(false);
      
      // Redirect if session is not in voting or completed state
      if (data.status === 'WAITING') {
        navigate(`/session/${sessionId}`);
      } else if (data.status === 'SUBMITTING_IDEAS') {
        navigate(`/session/${sessionId}/post-ideas`);
      }
    });

    // Listen for vote status updates
    socket.on('vote-status', (data) => {
      setVoteStatus(data.status);
      if (data.status?.isComplete) {
        setMessage(t('voteCountingScreen.allVotesReceived'));
      }
    });

    // Listen for vote results
    socket.on('vote-results', (data) => {
      setVoteResults(data.results || []);
    });

        // Listen for voting completion (final results)    socket.on('voting-complete', () => {      navigate(`/session/${sessionId}/results`);    });

    // Listen for new voting round
    socket.on('new-voting-round', (data) => {
      setMessage(data.message || t('voteCountingScreen.newRoundStarted'));
      navigate(`/session/${sessionId}/voting`);
    });

    // Error handling
    socket.on('error', (error) => {
      setError(error.message);
      setProcessing(false);
    });

    return () => {
      socket.off('session-state');
      socket.off('vote-status');
      socket.off('vote-results');
      socket.off('voting-complete');
      socket.off('new-voting-round');
      socket.off('error');
    };
  }, [socket, sessionId, user?.id, navigate, t]);

  // Handle starting a new voting round
  const handleStartNewRound = () => {
    if (!isOwner) return;
    setProcessing(true);
    socket.emit('force-new-voting-round', { sessionId });
  };

  // Handle finishing voting and showing results
  const handleFinishVoting = () => {
    if (!isOwner) return;
    setProcessing(true);
    socket.emit('force-finish-voting', { sessionId });
  };

  // Loading state
  if (loading) {
    return (
      <div className="vote-counting-screen loading">
        <div className="loading-content">
          <div className="spinner"></div>
          <p>{t('voteCountingScreen.loading')}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="vote-counting-screen error">
        <div className="error-content">
          <h2>{t('common.error')}</h2>
          <p>{error}</p>
          <Button onClick={() => navigate(`/session/${sessionId}`)}>
            {t('common.backToSession')}
          </Button>
        </div>
      </div>
    );
  }

  // Participant view - simple waiting screen
  if (!isOwner) {
    return (
      <div className="vote-counting-screen participant">
        <div className="counting-content">
          <h2>{t('voteCountingScreen.countingVotes')}</h2>
          <div className="counting-animation">
            <div className="counting-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
          <div className="counting-message">
            <p>{t('voteCountingScreen.pleaseWait')}</p>
            <p>{message || t('voteCountingScreen.processingResults')}</p>
          </div>
          
          <div className="session-info">
            <p>{t('common.session')}: {sessionInfo?.code}</p>
            {voteStatus && (
              <p>
                {t('voteCountingScreen.votesReceived')}: {voteStatus.participantsVoted} / {voteStatus.totalParticipants}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Owner view - control panel
  return (
    <div className="vote-counting-screen owner">
      <h2>{t('voteCountingScreen.voteCountingControl')}</h2>
      
      <div className="counting-status">
        <div className="status-card">
          <h3>{t('voteCountingScreen.votingStatus')}</h3>
          {voteStatus ? (
            <div className="status-details">
              <p>
                <strong>{t('voteCountingScreen.participantsVoted')}:</strong> 
                {voteStatus.participantsVoted} / {voteStatus.totalParticipants}
              </p>
              <p>
                <strong>{t('voteCountingScreen.totalVotes')}:</strong> {voteStatus.voteCount}
              </p>
              <p>
                <strong>{t('common.round')}:</strong> {voteStatus.round + 1}
              </p>
              {voteStatus.isComplete && (
                <div className="complete-indicator">
                  ✅ {t('voteCountingScreen.allVotesReceived')}
                </div>
              )}
            </div>
          ) : (
            <p>{t('voteCountingScreen.loadingStatus')}</p>
          )}
        </div>
      </div>

      {/* Vote results preview */}
      {voteResults.length > 0 && (
        <div className="results-preview">
          <h3>{t('voteCountingScreen.currentResults')}</h3>
          <div className="results-list">
            {voteResults.map((result, index) => (
              <div key={result.idea_id || index} className="result-item">
                <div className="result-position">#{index + 1}</div>
                <div className="result-content">
                  <p className="idea-text">{result.content}</p>
                  <div className="result-meta">
                    <span className="vote-count">{result.vote_count} {t('common.votes')}</span>
                    <span className="author">— {result.author_name}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Control buttons */}
      <div className="control-actions">
        {message && (
          <div className="action-message">
            <p>{message}</p>
          </div>
        )}
        
        <div className="action-buttons">
          <Button
            onClick={handleStartNewRound}
            disabled={processing || !voteStatus?.isComplete}
            variant="secondary"
            size="large"
            className="new-round-button"
          >
            {processing ? t('common.processing') : t('voteCountingScreen.startNewRound')}
          </Button>
          
          <Button
            onClick={handleFinishVoting}
            disabled={processing || !voteStatus?.isComplete}
            variant="primary"
            size="large"
            className="finish-voting-button"
          >
            {processing ? t('common.processing') : t('voteCountingScreen.finishAndShowResults')}
          </Button>
        </div>
        
        <div className="action-help">
          <p>{t('voteCountingScreen.controlHelp')}</p>
        </div>
      </div>
    </div>
  );
};

export default VoteCountingScreen; 