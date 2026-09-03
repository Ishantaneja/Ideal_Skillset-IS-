import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '@/services';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState({
    name: 'Alex Morgan',
    fullName: 'Alex Morgan',
    initials: 'AM',
    email: 'alex.morgan@university.edu',
    role: 'user',
    targetRole: 'Junior Data Analyst',
    readinessScore: 74,
    atsScore: 78,
    jobMatchScore: 72,
    topSkillGap: 'Power BI',
  });
  const [token, setToken] = useState(() => localStorage.getItem('ideal_skillset_token'));
  const [isLoading, setIsLoading] = useState(false);

  const formatUserObj = useCallback((rawUser) => {
    if (!rawUser) return null;
    const name = rawUser.name || rawUser.fullName || 'Candidate';
    const initials = name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2) || 'AM';

    return {
      id: rawUser.id || rawUser._id,
      name,
      fullName: name,
      initials,
      email: rawUser.email,
      role: rawUser.role || 'user',
      targetRole: rawUser.targetRole || rawUser.target_role || 'Junior Data Analyst',
      readinessScore: rawUser.readinessScore || 74,
      atsScore: rawUser.atsScore || 78,
      jobMatchScore: rawUser.jobMatchScore || 72,
      topSkillGap: rawUser.topSkillGap || 'Power BI',
    };
  }, []);

  // Initialize and verify session on load if JWT token is stored
  useEffect(() => {
    async function verifySession() {
      const storedToken = localStorage.getItem('ideal_skillset_token');
      if (storedToken) {
        try {
          setIsLoading(true);
          const userData = await authService.getCurrentUser();
          if (userData) {
            setUser(formatUserObj(userData));
            setToken(storedToken);
          }
        } catch {
          // If token verification fails (e.g. backend offline or expired), retain safe default candidate profile
        } finally {
          setIsLoading(false);
        }
      }
    }
    verifySession();
  }, [formatUserObj]);

  const login = async ({ email, password }) => {
    setIsLoading(true);
    try {
      const data = await authService.login({ email, password });
      const formatted = formatUserObj(data.user);
      setUser(formatted);
      setToken(data.access_token);
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (userData) => {
    setIsLoading(true);
    try {
      const data = await authService.signup(userData);
      const formatted = formatUserObj(data.user);
      setUser(formatted);
      setToken(data.access_token);
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  const adminLogin = async ({ email, password }) => {
    setIsLoading(true);
    try {
      const data = await authService.adminLogin({ email, password });
      const formatted = formatUserObj({ ...data.user, role: 'admin' });
      setUser(formatted);
      setToken(data.access_token);
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isLoading,
        login,
        signup,
        adminLogin,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
