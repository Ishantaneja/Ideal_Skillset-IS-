import api from './api';

export const readinessService = {
  /**
   * Generates a 5-dimensional Readiness Twin analysis.
   * @param {Object} payload { resume_id, job_id, github_url, portfolio_url }
   */
  analyzeReadiness: async (payload) => {
    const response = await api.post('/readiness/analyze', payload);
    return response.data;
  },

  /**
   * Retrieves all Readiness Twin analyses for current user.
   */
  getReadinessReports: async () => {
    const response = await api.get('/readiness');
    return response.data;
  },

  /**
   * Retrieves specific Readiness Twin analysis by identifier.
   * @param {string} analysisId
   */
  getReadinessReport: async (analysisId) => {
    const response = await api.get(`/readiness/${analysisId}`);
    return response.data;
  },

  /**
   * Retrieves latest Readiness Twin for a job.
   * @param {string} jobId
   */
  getByJob: async (jobId) => {
    const response = await api.get(`/readiness/job/${jobId}`);
    return response.data;
  },

  /**
   * Deletes a Readiness Twin analysis.
   * @param {string} analysisId
   */
  deleteReadinessReport: async (analysisId) => {
    const response = await api.delete(`/readiness/${analysisId}`);
    return response.data;
  },
};

export default readinessService;

