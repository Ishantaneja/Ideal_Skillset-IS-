import api from './api';

export const recruiterService = {
  /**
   * Fetch recruiter overview metrics
   */
  getDashboardStats: async () => {
    const response = await api.get('/recruiter/dashboard-stats');
    return response.data;
  },

  /**
   * Discover and filter candidate pool
   */
  getCandidates: async (params = {}) => {
    const response = await api.get('/recruiter/candidates', { params });
    return response.data;
  },

  /**
   * Get comprehensive candidate dossier with readiness twin & GitHub verification
   */
  getCandidateDetail: async (candidateId) => {
    const response = await api.get(`/recruiter/candidate/${candidateId}`);
    return response.data;
  },

  /**
   * Toggle candidate shortlist status
   */
  toggleShortlist: async (candidateId) => {
    const response = await api.post(`/recruiter/shortlist/${candidateId}`);
    return response.data;
  },

  /**
   * Fetch recruiter's shortlisted candidates
   */
  getShortlist: async () => {
    const response = await api.get('/recruiter/shortlist');
    return response.data;
  },
};

export default recruiterService;

