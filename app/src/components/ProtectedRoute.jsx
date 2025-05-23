import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();

  // If still loading, show a loading spinner or nothing
  if (loading) {
    return <div className="loading">{t('protectedRoute.loading')}</div>;
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    // Check if trying to access join session page
    if (location.pathname.startsWith('/join/')) {
      // Store the session code to redirect after login
      const sessionCode = location.pathname.split('/').pop();
      localStorage.setItem('pendingSessionCode', sessionCode);
    }
    return <Navigate to="/login" replace />;
  }

  // If authenticated, render the child routes
  return <Outlet />;
};

export default ProtectedRoute; 