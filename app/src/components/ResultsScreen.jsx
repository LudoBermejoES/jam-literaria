import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import { useTranslation } from 'react-i18next';
import { sessionService } from '../services/api';
import Button from './common/Button';
import './ResultsScreen.css';

const ResultsScreen = () => {
  const { sessionId } = useParams();
  const { user } = useAuth();
  const { socket } = useContext(SocketContext);
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [sessionInfo, setSessionInfo] = useState(null);
  const [finalResults, setFinalResults] = useState([]);
  const [allIdeas, setAllIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [creatingNewSession, setCreatingNewSession] = useState(false);

  useEffect(() => {
    if (!socket || !sessionId) return;

    // Join session room
    socket.emit('join-session', { sessionId });
    
    // Get session state
    socket.emit('get-session-state', { sessionId });
    
    // Get vote results
    socket.emit('get-vote-results', { sessionId });
    
    // Get all ideas from the session
    socket.emit('get-ideas', { sessionId });

    // Listen for session state updates
    socket.on('session-state', (data) => {
      setSessionInfo(data);
      setIsOwner(data.owner_id === user?.id);
      setLoading(false);
      
      // Redirect if session is not completed
      if (data.status !== 'COMPLETED') {
        if (data.status === 'WAITING') {
          navigate(`/session/${sessionId}`);
        } else if (data.status === 'SUBMITTING_IDEAS') {
          navigate(`/session/${sessionId}/post-ideas`);
        } else if (data.status === 'VOTING') {
          navigate(`/session/${sessionId}/voting`);
        }
      }
    });

    // Listen for vote results
    socket.on('vote-results', (data) => {
      setFinalResults(data.results || []);
    });
    
    // Listen for all ideas
    socket.on('ideas', (data) => {
      if (data.sessionId === sessionId) {
        setAllIdeas(data.ideas || []);
      }
    });

    // Error handling
    socket.on('error', (error) => {
      setError(error.message);
      setLoading(false);
    });

    return () => {
      socket.off('session-state');
      socket.off('vote-results');
      socket.off('ideas');
      socket.off('error');
    };
  }, [socket, sessionId, user?.id, navigate]);

  // Create a new session
  const handleCreateNewSession = async () => {
    try {
      setCreatingNewSession(true);
      const response = await sessionService.createSession();
      
      if (response.success && response.data) {
        navigate(`/session/${response.data.session.id}`);
      } else {
        setError(response.error || t('home.createFailed'));
      }
    } catch (err) {
      console.error('Error creating new session:', err);
      setError(err.error || t('home.createError'));
    } finally {
      setCreatingNewSession(false);
    }
  };

  // Go to home
  const handleGoHome = () => {
    navigate('/');
  };

  // Share session results
  const handleShareResults = () => {
    const shareUrl = `${window.location.origin}/session/${sessionId}/results`;
    
    if (navigator.share) {
      navigator.share({
        title: t('resultsScreen.shareTitle'),
        text: t('resultsScreen.shareText'),
        url: shareUrl,
      });
    } else {
      // Fallback to copying to clipboard
      navigator.clipboard.writeText(shareUrl).then(() => {
        alert(t('resultsScreen.linkCopied'));
      });
    }
  };

  // Get winning ideas (top 3)
  const getWinningIdeas = () => {
    return finalResults.slice(0, 3);
  };

  // Get other ideas that didn't win
  const getOtherIdeas = () => {
    const winningIdeaIds = new Set(getWinningIdeas().map(idea => idea.idea_id));
    return allIdeas.filter(idea => !winningIdeaIds.has(idea.id));
  };

  // Loading state
  if (loading) {
    return (
      <div className="results-screen loading">
        <div className="loading-content">
          <div className="spinner"></div>
          <p>{t('resultsScreen.loading')}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="results-screen error">
        <div className="error-content">
          <h2>{t('common.error')}</h2>
          <p>{error}</p>
          <Button onClick={() => navigate('/')}>
            {t('common.goHome')}
          </Button>
        </div>
      </div>
    );
  }

  const winningIdeas = getWinningIdeas();
  const otherIdeas = getOtherIdeas();

  return (
    <div className="results-screen">
      <div className="results-header">
        <h1>{t('resultsScreen.title')}</h1>
        <div className="session-info">
          <p>{t('common.session')}: {sessionInfo?.code}</p>
          <p>{t('resultsScreen.completedAt')}: {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {/* Winning Ideas */}
      <div className="winning-ideas">
        <h2>{t('resultsScreen.winningIdeas')}</h2>
        <div className="winners-grid">
          {winningIdeas.map((result, index) => (
            <div key={result.idea_id} className={`winner-card position-${index + 1}`}>
              <div className="winner-position">
                <span className="position-number">#{index + 1}</span>
                <div className="winner-trophy">
                  {index === 0 && '🥇'}
                  {index === 1 && '🥈'}
                  {index === 2 && '🥉'}
                </div>
              </div>
              <div className="winner-content">
                <p className="idea-text">{result.content}</p>
                <div className="winner-meta">
                  <div className="winner-badge">
                    <span className="winner-text">{t('resultsScreen.winner')}</span>
                  </div>
                  <div className="vote-count">
                    <span className="vote-count-number">{result.vote_count}</span>
                    <span className="vote-count-label">
                      {result.vote_count === 1 ? t('common.vote') : t('common.votes')}
                    </span>
                  </div>
                  {isOwner && (
                    <div className="author-info">
                      <span className="author">— {result.author_name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      

      {/* Other Ideas (non-winning) */}
      {otherIdeas.length > 0 && (
        <div className="other-ideas">
          <h3>{t('resultsScreen.otherIdeas')}</h3>
          <div className="other-ideas-grid">
            {otherIdeas.map((idea) => (
              <div key={idea.id} className="other-idea-card">
                <p className="idea-text">{idea.content}</p>
                {isOwner && (
                  <div className="idea-author">— {idea.author_name}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="results-actions">
        <div className="primary-actions">
          {isOwner && (
            <Button
              onClick={handleCreateNewSession}
              disabled={creatingNewSession}
              variant="primary"
              size="large"
              className="new-session-button"
            >
              {creatingNewSession ? t('common.creating') : t('resultsScreen.startNewJam')}
            </Button>
          )}
          
          <Button
            onClick={handleShareResults}
            variant="secondary"
            size="large"
            className="share-button"
          >
            {t('resultsScreen.shareResults')}
          </Button>
        </div>
        
        <div className="secondary-actions">
          <Button
            onClick={handleGoHome}
            variant="outline"
            size="medium"
            className="home-button"
          >
            {t('common.goHome')}
          </Button>
                </div>      </div>      {/* Session Statistics */}      <div className="session-stats">        <h3>{t('resultsScreen.sessionStats')}</h3>        <div className="stats-grid">          <div className="stat-item">            <span className="stat-number">{allIdeas.length}</span>            <span className="stat-label">{t('resultsScreen.totalIdeas')}</span>          </div>          <div className="stat-item">            <span className="stat-number">{sessionInfo?.participant_count || 0}</span>            <span className="stat-label">{t('resultsScreen.participants')}</span>          </div>          <div className="stat-item">            <span className="stat-number">{finalResults.length}</span>            <span className="stat-label">{t('resultsScreen.winnersSelected')}</span>          </div>        </div>      </div>    </div>  );};export default ResultsScreen; 