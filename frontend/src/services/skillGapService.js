import api from './api';

export const skillGapService = {
  /**
   * Executes intelligent skill gap analysis comparing resume and job.
   * @param {string} resumeId
   * @param {string} jobId
   */
  analyzeGaps: async (resumeId, jobId) => {
    const response = await api.post('/skill-gaps/analyze', {
      resume_id: resumeId,
      job_id: jobId,
    });
    return response.data;
  },

  /**
   * Simulates readiness score increase when leveling up skills.
   * @param {Object} payload { analysis_id, resume_id, job_id, improved_skills }
   */
  simulateGaps: async (payload) => {
    const response = await api.post('/skill-gaps/simulate', payload);
    return response.data;
  },

  /**
   * Retrieves list of all skill gap analyses for current user.
   */
  getAnalyses: async () => {
    const response = await api.get('/skill-gaps');
    return response.data;
  },

  /**
   * Retrieves detail of a specific skill gap analysis.
   * @param {string} analysisId
   */
  getAnalysis: async (analysisId) => {
    const response = await api.get(`/skill-gaps/${analysisId}`);
    return response.data;
  },

  /**
   * Retrieves latest skill gap analysis for a specific job.
   * @param {string} jobId
   */
  getByJob: async (jobId) => {
    const response = await api.get(`/skill-gaps/job/${jobId}`);
    return response.data;
  },

  /**
   * Retrieves latest skill gap analysis for a specific resume.
   * @param {string} resumeId
   */
  getByResume: async (resumeId) => {
    const response = await api.get(`/skill-gaps/resume/${resumeId}`);
    return response.data;
  },

  /**
   * Deletes a skill gap report from history.
   * @param {string} analysisId
   */
  deleteAnalysis: async (analysisId) => {
    const response = await api.delete(`/skill-gaps/${analysisId}`);
    return response.data;
  },
};

export default skillGapService;

