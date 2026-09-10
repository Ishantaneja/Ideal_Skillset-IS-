import api from './api';

export const evidenceService = {
  /**
   * Verifies candidate claimed skills against projects in their GitHub repositories.
   * @param {Object} payload { github_url: string, skills_to_verify?: string[] }
   */
  verifyGitHub: async (payload) => {
    const response = await api.post('/evidence/verify-github', payload);
    return response.data;
  },

  /**
   * Retrieves the latest GitHub project & skill verification results.
   */
  getGitHubStatus: async () => {
    const response = await api.get('/evidence/github-status');
    return response.data;
  },
};

export default evidenceService;

