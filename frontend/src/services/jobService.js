import api from './api';

export const jobService = {
  /**
   * Analyzes raw pasted job description text.
   * @param {string} text - Plain text job description.
   */
  analyzeText: async (text) => {
    const response = await api.post('/jobs/analyze', { text });
    return response.data;
  },

  /**
   * Uploads and analyzes a job description document (PDF/DOCX).
   * @param {File} file
   * @param {Function} [onUploadProgress]
   */
  uploadJobFile: async (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/jobs/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
    return response.data;
  },

  /**
   * Fetches all job descriptions analyzed by the user.
   */
  getJobs: async () => {
    const response = await api.get('/jobs');
    return response.data;
  },

  /**
   * Fetches single job description analysis detail.
   * @param {string} jobId
   */
  getJob: async (jobId) => {
    const response = await api.get(`/jobs/${jobId}`);
    return response.data;
  },

  /**
   * Deletes a job description analysis.
   * @param {string} jobId
   */
  deleteJob: async (jobId) => {
    const response = await api.delete(`/jobs/${jobId}`);
    return response.data;
  },

  /**
   * Re-analyzes an existing job description.
   * @param {string} jobId
   */
  reanalyzeJob: async (jobId) => {
    const response = await api.post(`/jobs/${jobId}/reanalyze`);
    return response.data;
  },

  /**
   * Retrieves market benchmark metrics for candidate target role.
   */
  getMarketSummary: async () => {
    const response = await api.get('/jobs/market/summary');
    return response.data;
  },
};

export default jobService;

