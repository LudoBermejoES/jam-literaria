import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { sessionService } from '../services/api';
import socketService from '../services/socketService';
import '../styles/Session.css';

const Session = () => {
  const { sessionId } = useParams();
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [session, setSession] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Fetch session data
  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        setIsLoading(true);
        setError('');
        
        const response = await sessionService.getSessionStatus(sessionId);
        
        if (response.success) {
          setSession(response.data.session);
          setParticipants(response.data.participants);
          setIsAdmin(response.data.session.owner_id === user.id);
        } else {
          setError(response.error || t('session.fetchFailed'));
        }
      } catch (err) {
        setError(err.error || t('session.fetchFailed'));
      } finally {
        setIsLoading(false);
      }
    };
    
    if (sessionId && user) {
      fetchSessionData();
    }
  }, [sessionId, user, t]);
  
  // Setup socket connection
  useEffect(() => {
    if (user && sessionId) {
      // Initialize socket with user ID
      socketService.init(user.id);
      
      // Join session room
      socketService.joinSession(sessionId);
      
      // Set up socket event listeners
      socketService.on('onUserJoined', handleUserJoined);
      socketService.on('onUserLeft', handleUserLeft);
      socketService.on('onSessionState', handleSessionState);
      socketService.on('onSessionStarted', handleSessionStarted);
      socketService.on('onError', handleSocketError);
      
      // Cleanup on unmount
      return () => {
        socketService.leaveSession(sessionId);
        socketService.disconnect();
      };
    }
  }, [user, sessionId]);
  
  // Monitor session status changes and redirect when appropriate
  useEffect(() => {
    if (session && session.status === 'SUBMITTING_IDEAS') {
      navigate(`/session/${sessionId}/ideas`);
    }
  }, [session, sessionId, navigate]);
  
  // Socket event handlers
  const handleUserJoined = (data) => {
    setParticipants(prevParticipants => {
      // Check if user already exists in participants list
      const exists = prevParticipants.some(p => p.id === data.userId);
      if (!exists) {
        return [...prevParticipants, { id: data.userId, name: data.userName }];
      }
      return prevParticipants;
    });
  };
  
  const handleUserLeft = (data) => {
    setParticipants(prevParticipants => 
      prevParticipants.filter(p => p.id !== data.userId)
    );
  };
  
  const handleSessionState = (data) => {
    setSession(data);
    setParticipants(data.participants);
  };
  
  const handleSessionStarted = (data) => {
    setSession(data.session);
    
    // Redirect to idea submission when session starts
    if (data.session.status === 'SUBMITTING_IDEAS') {
      navigate(`/session/${sessionId}/ideas`);
    }
  };
  
  const handleSocketError = (error) => {
    setError(error.message || t('session.socketError'));
  };
  
  // Handler functions
  const handleStartSession = async () => {
    if (!isAdmin) return;
    
    try {
      setIsLoading(true);
      setError('');
      
      const response = await sessionService.startSession(sessionId);
      
      if (response.success) {
        // Socket will handle the update
      } else {
        setError(response.error || t('session.startFailed'));
      }
    } catch (err) {
      setError(err.error || t('session.startFailed'));
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteSession = async () => {
    if (!isAdmin) return;
    
    if (window.confirm(t('session.deleteConfirm'))) {
      try {
        setIsLoading(true);
        setError('');
        
        const response = await sessionService.deleteSession(sessionId);
        
        if (response.success) {
          navigate('/');
        } else {
          setError(response.error || t('session.deleteFailed'));
        }
      } catch (err) {
        setError(err.error || t('session.deleteFailed'));
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  const handleBackToHome = () => {
    navigate('/');
  };

  const handleCopyLink = async () => {
    const shareUrl = `${window.location.origin}/join/${session.code}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert(t('session.linkCopied'));
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert(t('session.linkCopied'));
    }
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="session-container">
        <div className="loading-container">
          <p>{t('session.loading')}</p>
        </div>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="session-container">
        <div className="error-container">
          <h2>{t('session.error')}</h2>
          <p>{error}</p>
          <button onClick={handleBackToHome} className="back-button">
            {t('session.backToHome')}
          </button>
        </div>
      </div>
    );
  }
  
  // Render session not found
  if (!session) {
    return (
      <div className="session-container">
        <div className="error-container">
          <h2>{t('session.notFound')}</h2>
          <button onClick={handleBackToHome} className="back-button">
            {t('session.backToHome')}
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="session-container">
      <header className="session-header">
        <h1>{t('app.name')}</h1>
        <div className="session-info">
          <span className="session-code">{t('session.code')}: <strong>{session.code}</strong></span>
          <button onClick={handleBackToHome} className="back-button">
            {t('session.backToHome')}
          </button>
        </div>
      </header>
      
      <main className="session-content">
        <div className="session-details">
          <h2>{t('session.title')}</h2>
          <p>{t('session.status')}: <strong>{session.status}</strong></p>
          {session.status === 'WAITING' && (
            <p className="waiting-message">
              {isAdmin 
                ? t('session.waitingAdmin') 
                : t('session.waitingParticipant')}
            </p>
          )}
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="session-layout">
          <div className="participants-section">
            <h3>{t('session.participantsTitle')}</h3>
            <ul className="participants-list">
              {participants.map(participant => (
                <li key={participant.id} className={participant.id === session.owner_id ? 'admin' : ''}>
                  {participant.name} {participant.id === session.owner_id && <span className="admin-badge">{t('session.admin')}</span>}
                  {participant.id === user.id && <span className="you-badge">{t('session.you')}</span>}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="session-actions">
            {isAdmin && session.status === 'WAITING' && (
              <div className="admin-controls">
                <h3>{t('session.adminControls')}</h3>
                
                <button 
                  onClick={handleCopyLink} 
                  className="copy-link-button" 
                  disabled={isLoading}
                >
                  {t('session.copyLink')}
                </button>
                
                <button 
                  onClick={handleStartSession} 
                  className="start-session-button" 
                  disabled={isLoading || participants.length < 2}
                >
                  {isLoading ? t('session.starting') : t('session.start')}
                </button>
                
                {participants.length < 2 && (
                  <p className="participants-warning">
                    {t('session.needMoreParticipants')}
                  </p>
                )}
                
                <button 
                  onClick={handleDeleteSession} 
                  className="delete-session-button" 
                  disabled={isLoading}
                >
                  {t('session.delete')}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Session; 