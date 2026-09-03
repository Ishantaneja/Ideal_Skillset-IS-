import api from './api';

export const atsService = {
  /**
   * Evaluates compatibility between candidate's resume and job description.
   * @param {string} resumeId
   * @param {string} jobId
   */
  analyzeMatch: async (resumeId, jobId) => {
    const response = await api.post('/ats/analyze', {
      resume_id: resumeId,
      job_id: jobId,
    });
    return response.data;
  },

  /**
   * Recalculates projected ATS score when demonstrating hypothetical verified skills.
   * @param {string} resumeId
   * @param {string} jobId
   * @param {Array<string>} addedSkills
   */
  simulateScore: async (resumeId, jobId, addedSkills = []) => {
    const response = await api.post('/ats/simulate', {
      resume_id: resumeId,
      job_id: jobId,
      added_skills: addedSkills,
    });
    return response.data;
  },

  /**
   * Retrieves all historical ATS matching analyses for the user.
   */
  getResults: async () => {
    const response = await api.get('/ats/results');
    return response.data;
  },

  /**
   * Retrieves single ATS analysis detail report.
   * @param {string} resultId
   */
  getResult: async (resultId) => {
    const response = await api.get(`/ats/results/${resultId}`);
    return response.data;
  },

  /**
   * Deletes an ATS analysis report from history.
   * @param {string} resultId
   */
  deleteResult: async (resultId) => {
    const response = await api.delete(`/ats/results/${resultId}`);
    return response.data;
  },
};

export default atsService;

