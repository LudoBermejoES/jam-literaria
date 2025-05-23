import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { sessionService } from '../services/api';
import '../styles/JoinSession.css';

const JoinSession = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (code) {
      joinSessionWithCode(code);
    }
  }, [code]);

  const joinSessionWithCode = async (sessionCode) => {
    try {
      setIsLoading(true);
      setError('');
      
      const response = await sessionService.joinSession(sessionCode);
      
      if (response.success && response.data && response.data.session) {
        // Navigate to the session
        navigate(`/session/${response.data.session.id}`, { replace: true });
      } else {
        setError(response.error || t('home.joinFailed'));
        // If error, navigate to home after 3 seconds
        setTimeout(() => navigate('/'), 3000);
      }
    } catch (err) {
      console.error('Error joining session:', err);
      setError(err.error || t('home.joinError'));
      // If error, navigate to home after 3 seconds
      setTimeout(() => navigate('/'), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="join-session-container">
      <div className="join-session-card">
        <h2>{t('home.joinTitle')}</h2>
        
        {isLoading ? (
          <p className="joining-message">{t('home.joiningButton')} {code}...</p>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : null}
        
        <button 
          onClick={() => navigate('/')}
          className="back-button"
        >
          {t('session.backToHome')}
        </button>
      </div>
    </div>
  );
};

export default JoinSession; 