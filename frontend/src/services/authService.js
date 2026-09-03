import api from './api';

export const authService = {
  /**
   * Register a new candidate user account
   */
  signup: async (userData) => {
    const response = await api.post('/auth/signup', {
      name: userData.fullName || userData.name,
      email: userData.email,
      password: userData.password,
      target_role: userData.targetRole || userData.target_role || 'Junior Data Analyst',
    });
    if (response.data?.access_token) {
      localStorage.setItem('ideal_skillset_token', response.data.access_token);
    }
    return response.data;
  },

  /**
   * Authenticate candidate user credentials
   */
  login: async ({ email, password }) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data?.access_token) {
      localStorage.setItem('ideal_skillset_token', response.data.access_token);
    }
    return response.data;
  },

  /**
   * Authenticate administrator credentials
   */
  adminLogin: async ({ email, password }) => {
    const response = await api.post('/auth/admin/login', { email, password });
    if (response.data?.access_token) {
      localStorage.setItem('ideal_skillset_token', response.data.access_token);
    }
    return response.data;
  },

  /**
   * Fetch current authenticated user profile
   */
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  /**
   * Remove stored JWT token
   */
  logout: () => {
    localStorage.removeItem('ideal_skillset_token');
  },
};

export default authService;
