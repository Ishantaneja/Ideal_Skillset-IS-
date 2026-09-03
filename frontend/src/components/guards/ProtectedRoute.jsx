import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { ROUTES } from '@/utils/constants';
import { useAuth } from '@/context/AuthContext';
import { LoadingSpinner } from '@/components';

export default function ProtectedRoute({ children, requiredRole }) {
  const { user, isAuthenticated, isLoading, isAdmin } = useAuth();

  if (isLoading) {
    return <LoadingSpinner fullPage message="Verifying authentication session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (requiredRole === 'admin' && !isAdmin) {
    return <Navigate to={ROUTES.ADMIN_LOGIN} replace />;
  }

  return children ? children : <Outlet />;
}
