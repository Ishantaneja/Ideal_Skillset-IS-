import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, AuthProvider, NotificationProvider } from '@/context';
import { AppRoutes } from '@/routes';

/**
 * Main Application Component
 * Sets up core providers (Theme, Router, Authentication, Toast Notifications)
 */
export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <NotificationProvider>
            <AppRoutes />
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
