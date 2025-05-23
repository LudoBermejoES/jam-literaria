import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();
  const { t } = useTranslation();

  // If still loading, show a loading spinner or nothing
  if (loading) {
    return <div className="loading">{t('protectedRoute.loading')}</div>;
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If authenticated, render the child routes
  return <Outlet />;
};

export default ProtectedRoute; 