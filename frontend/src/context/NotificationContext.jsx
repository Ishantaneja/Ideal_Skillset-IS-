import React, { createContext, useContext, useState, useCallback } from 'react';
import ToastContainer from '../components/feedback/ToastContainer';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback(({ message, type = 'info', duration = 4000 }) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 5);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const notify = {
    info: (msg, duration) => addToast({ message: msg, type: 'info', duration }),
    success: (msg, duration) => addToast({ message: msg, type: 'success', duration }),
    warning: (msg, duration) => addToast({ message: msg, type: 'warning', duration }),
    error: (msg, duration) => addToast({ message: msg, type: 'error', duration }),
  };

  return (
    <NotificationContext.Provider value={{ notify, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context.notify;
}

