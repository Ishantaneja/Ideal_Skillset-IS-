import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { ROUTES } from '@/utils/constants';
import { useAuth } from '@/context/AuthContext';
import { LoadingSpinner } from '@/components';

export default function ProtectedRoute({ children, requiredRole }) {
  const { user, isAuthenticated, isLoading, isAdmin, isRecruiter } = useAuth();

  if (isLoading) {
    return <LoadingSpinner fullPage message="Verifying authentication session..." />;
  }

  // Admin route protection
  if (requiredRole === 'admin') {
    if (!isAuthenticated) {
      return <Navigate to={ROUTES.ADMIN_LOGIN} replace />;
    }
    if (!isAdmin) {
      return <Navigate to={ROUTES.USER_DASHBOARD} replace />;
    }
  } else if (requiredRole === 'recruiter') {
    // Recruiter route protection
    if (!isAuthenticated) {
      return <Navigate to={ROUTES.RECRUITER_LOGIN} replace />;
    }
    if (!isRecruiter && !isAdmin) {
      return <Navigate to={ROUTES.USER_DASHBOARD} replace />;
    }
  } else {
    // Normal candidate user route protection
    if (!isAuthenticated) {
      return <Navigate to={ROUTES.LOGIN} replace />;
    }
  }

  return children ? children : <Outlet />;
}
