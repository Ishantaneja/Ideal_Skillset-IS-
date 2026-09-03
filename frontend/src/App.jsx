import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, NotificationProvider } from '@/context';
import { AppRoutes } from '@/routes';

/**
 * Main Application Component
 * Sets up core providers (Router, Authentication, Toast Notifications)
 */
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <AppRoutes />
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
