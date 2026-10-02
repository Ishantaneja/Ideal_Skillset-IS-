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

  /**
   * AI-optimizes and tailors candidate resume to target job description to improve ATS score.
   * @param {string} resumeId
   * @param {string} jobId
   * @param {Array<string>} targetSkills
   */
  tailorResume: async (resumeId, jobId, targetSkills = []) => {
    const response = await api.post('/ats/tailor', {
      resume_id: resumeId,
      job_id: jobId,
      target_skills: targetSkills,
    });
    return response.data;
  },

  /**
   * Saves and optionally sets tailored resume text as the user's active resume.
   * @param {Object} payload
   */
  saveTailoredResume: async (payload) => {
    const response = await api.post('/ats/tailor/save', payload);
    return response.data;
  },

  /**
   * Downloads tailored resume in ATS-compliant PDF format with exact clickable links.
   * @param {string} tailoredText
   * @param {string} title
   */
  downloadTailoredPdf: async (tailoredText, title = 'Tailored_Resume') => {
    const response = await api.post(
      '/ats/tailor/pdf',
      {
        tailored_text: tailoredText,
        title: title,
      },
      { responseType: 'blob' }
    );
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const cleanFilename = (title || 'tailored_resume').replace(/[^a-zA-Z0-9_.-]/g, '_');
    link.download = cleanFilename.endsWith('.pdf') ? cleanFilename : `${cleanFilename}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    return true;
  },
};

export default atsService;

