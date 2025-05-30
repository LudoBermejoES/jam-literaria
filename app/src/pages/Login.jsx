import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import '../styles/Login.css';

const Login = () => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasPendingSession, setHasPendingSession] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Check on component mount if there's a pending session
  useEffect(() => {
    const pendingSessionCode = localStorage.getItem('pendingSessionCode');
    setHasPendingSession(!!pendingSessionCode);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate input
    if (!name.trim()) {
      setError(t('auth.nameRequired'));
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      
      const response = await register(name);
      
      if (response.success) {
        // Check if there's a pending session to join
        const pendingSessionCode = localStorage.getItem('pendingSessionCode');
        
        if (pendingSessionCode) {
          // Clear the stored session code
          localStorage.removeItem('pendingSessionCode');
          // Redirect to join that session
          navigate(`/join/${pendingSessionCode}`);
        } else {
          // Normal flow - redirect to home page
        navigate('/');
        }
      } else {
        setError(response.error || t('auth.registerFailed'));
      }
    } catch (err) {
      setError(err.error || t('auth.registrationError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>{t('app.name')}</h1>
        <h2>{t('auth.welcome')}</h2>
        
        {error && <div className="error-message">{error}</div>}
        {hasPendingSession && (
          <div className="info-message">{t('auth.redirectAfterLogin')}</div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">{t('auth.nameLabel')}</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('auth.namePlaceholder')}
              disabled={isLoading}
            />
          </div>
          
          <button type="submit" className="submit-button" disabled={isLoading}>
            {isLoading ? t('auth.joiningButton') : t('auth.joinButton')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login; 