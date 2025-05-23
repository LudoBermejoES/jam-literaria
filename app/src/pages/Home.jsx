import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { sessionService } from '../services/api';
import '../styles/Home.css';

const Home = () => {
  const { user, logout } = useAuth();
  const [sessionCode, setSessionCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [userSessions, setUserSessions] = useState([]);
  const [joinedSessions, setJoinedSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [joinedSessionsLoading, setJoinedSessionsLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState('');
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    fetchUserSessions();
    fetchJoinedSessions();
  }, []);

  useEffect(() => {
    if (sessionId) {
      console.log('Navigating to session:', sessionId);
      navigate(`/session/${sessionId}`, { replace: true });
    }
  }, [sessionId, navigate]);

  const fetchUserSessions = async () => {
    try {
      setSessionsLoading(true);
      const response = await sessionService.getUserSessions();
      if (response.success && response.data) {
        // Filter to only show sessions created by the current user
        const ownedSessions = response.data.sessions.filter(session => 
          session.owner_id === user.id
        );
        setUserSessions(ownedSessions);
      }
    } catch (err) {
      console.error('Error fetching user sessions:', err);
      setError(t('home.fetchSessionsFailed'));
    } finally {
      setSessionsLoading(false);
    }
  };

  const fetchJoinedSessions = async () => {
    try {
      setJoinedSessionsLoading(true);
      const response = await sessionService.getJoinedSessions();
      if (response.success && response.data) {
        // Filter to only show sessions created by others
        const participatedSessions = response.data.sessions.filter(session => 
          session.owner_id !== user.id
        );
        setJoinedSessions(participatedSessions);
      }
    } catch (err) {
      console.error('Error fetching joined sessions:', err);
      setError('Failed to fetch joined sessions');
    } finally {
      setJoinedSessionsLoading(false);
    }
  };

  const handleCreateSession = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const response = await sessionService.createSession();
      console.log('Create session response:', response);
      
      if (response.success && response.data && response.data.session) {
        console.log('Session created successfully:', response.data.session.id);
        setSessionId(response.data.session.id);
      } else {
        setError(response.error || t('home.createFailed'));
      }
    } catch (err) {
      console.error('Error creating session:', err);
      setError(err.error || t('home.createError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinSession = async (e) => {
    e.preventDefault();
    
    if (!sessionCode.trim()) {
      setError(t('home.codeRequired'));
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      
      const response = await sessionService.joinSession(sessionCode);
      console.log('Join session response:', response);
      
      if (response.success && response.data && response.data.session) {
        console.log('Session joined successfully:', response.data.session.id);
        setSessionId(response.data.session.id);
      } else {
        setError(response.error || t('home.joinFailed'));
      }
    } catch (err) {
      console.error('Error joining session:', err);
      setError(err.error || t('home.joinError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = (code) => {
    const link = `${window.location.origin}/join/${code}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopySuccess(t('home.copySuccess'));
      setTimeout(() => setCopySuccess(''), 3000);
    });
  };

  const handleDeleteSession = async (sessionId) => {
    try {
      setIsLoading(true);
      await sessionService.deleteSession(sessionId);
      // Refresh sessions list
      fetchUserSessions();
    } catch (err) {
      console.error('Error deleting session:', err);
      setError(t('session.deleteFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch {
      setError(t('auth.logoutFailed'));
    }
  };

  return (
    <div className="home-container">
      <header className="home-header">
        <h1>{t('app.name')}</h1>
        <div className="user-info">
          <span>{t('home.welcome', { name: user?.name || 'User' })}</span>
          <button onClick={handleLogout} className="logout-button">{t('home.logout')}</button>
        </div>
      </header>

      <main className="home-content">
        <div className="welcome-section">
          <h2>{t('home.title')}</h2>
          <p>{t('home.subtitle')}</p>
        </div>

        {error && <div className="error-message">{error}</div>}
        {copySuccess && <div className="success-message">{copySuccess}</div>}

        <div className="session-options">
          <div className="option-card">
            <h3>{t('home.createTitle')}</h3>
            <p>{t('home.createDesc')}</p>
            <button 
              onClick={handleCreateSession} 
              disabled={isLoading}
              className="create-session-button"
            >
              {isLoading ? t('home.creatingButton') : t('home.createButton')}
            </button>
          </div>

          <div className="option-card">
            <h3>{t('home.joinTitle')}</h3>
            <p>{t('home.joinDesc')}</p>
            <form onSubmit={handleJoinSession}>
              <input
                type="text"
                value={sessionCode}
                onChange={(e) => setSessionCode(e.target.value)}
                placeholder={t('home.codePlaceholder')}
                disabled={isLoading}
              />
              <button 
                type="submit" 
                disabled={isLoading}
                className="join-session-button"
              >
                {isLoading ? t('home.joiningButton') : t('home.joinButton')}
              </button>
            </form>
          </div>

          <div className="option-card your-sessions-card">
            <h3>{t('home.yourSessionsTitle')}</h3>
            <p>{t('home.yourSessionsDesc')}</p>
            
            {sessionsLoading ? (
              <p>Loading your sessions...</p>
            ) : userSessions.length === 0 ? (
              <p className="no-sessions">{t('home.noSessions')}</p>
            ) : (
              <ul className="user-sessions-list">
                {userSessions.map(session => (
                  <li key={session.id} className="session-item">
                    <div className="session-info">
                      <span className="session-name" onClick={() => setSessionId(session.id)}>
                        {t('home.sessionCode')} {session.code}
                      </span>
                      <span className="session-date">
                        {new Date(session.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="session-actions">
                      <button 
                        onClick={() => handleCopyLink(session.code)}
                        className="share-button"
                      >
                        {t('home.shareLink')}
                      </button>
                      <button 
                        onClick={() => handleDeleteSession(session.id)}
                        className="delete-button"
                        disabled={isLoading}
                      >
                        {t('home.deleteSession')}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="option-card joined-sessions-card">
            <h3>{t('home.joinedSessionsTitle')}</h3>
            <p>{t('home.joinedSessionsDesc')}</p>
            
            {joinedSessionsLoading ? (
              <p>Loading joined sessions...</p>
            ) : joinedSessions.length === 0 ? (
              <p className="no-sessions">{t('home.noJoinedSessions')}</p>
            ) : (
              <ul className="user-sessions-list">
                {joinedSessions.map(session => (
                  <li key={session.id} className="session-item">
                    <div className="session-info">
                      <span className="session-name">
                        {t('home.sessionCode')} {session.code}
                      </span>
                      <span className="session-date">
                        {new Date(session.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="session-actions">
                      <button 
                        onClick={() => setSessionId(session.id)}
                        className="enter-button"
                      >
                        {t('home.enterSession')}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home; 