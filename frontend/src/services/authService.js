import api from './api';

export const authService = {
  /**
   * Request a 6-digit OTP verification code for signup
   */
  requestSignupOtp: async (userData) => {
    const response = await api.post('/auth/signup/request-otp', {
      name: userData.fullName || userData.name,
      email: userData.email,
      password: userData.password,
      confirm_password: userData.confirmPassword || userData.confirm_password || userData.password,
      target_role: userData.targetRole || userData.target_role || 'Junior Data Analyst',
    });
    return response.data;
  },

  /**
   * Verify the 6-digit OTP and finalize account creation
   */
  verifySignupOtp: async ({ email, otp }) => {
    const response = await api.post('/auth/signup/verify-otp', {
      email,
      otp,
    });
    if (response.data?.access_token) {
      localStorage.setItem('ideal_skillset_token', response.data.access_token);
    }
    return response.data;
  },

  /**
   * Resend a fresh 6-digit OTP code (with 60-second cooldown)
   */
  resendSignupOtp: async ({ email }) => {
    const response = await api.post('/auth/signup/resend-otp', {
      email,
    });
    return response.data;
  },

  /**
   * Register a new candidate user account (Direct / legacy)
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
   * Authenticate recruiter credentials
   */
  recruiterLogin: async ({ email, password }) => {
    const response = await api.post('/auth/recruiter/login', { email, password });
    if (response.data?.access_token) {
      localStorage.setItem('ideal_skillset_token', response.data.access_token);
    }
    return response.data;
  },

  /**
   * Register a new recruiter / employer account
   */
  recruiterSignup: async ({ name, email, password, company_name }) => {
    const response = await api.post('/auth/recruiter/signup', {
      name,
      email,
      password,
      company_name,
    });
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
