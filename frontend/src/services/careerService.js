import api from './api';

export const careerService = {
  /**
   * Fetch 5-dimensional Readiness Twin quotient
   */
  getReadiness: async () => {
    const response = await api.get('/readiness');
    return response.data;
  },

  /**
   * Fetch job market opportunities and role fit metrics
   */
  getJobs: async () => {
    const response = await api.get('/jobs');
    return response.data;
  },

  /**
   * Fetch identified skill gaps and verified strengths
   */
  getSkillGaps: async () => {
    const response = await api.get('/skill-gaps');
    return response.data;
  },

  /**
   * Fetch milestone learning pathway
   */
  getRoadmap: async () => {
    const response = await api.get('/roadmaps');
    return response.data;
  },

  /**
   * Fetch personalized practical challenge simulations
   */
  getAssessments: async () => {
    const response = await api.get('/assessment/challenges');
    return response.data;
  },

  /**
   * Fetch personalized mock interview questions
   */
  getInterviewQuestions: async () => {
    const response = await api.get('/interview/questions');
    return response.data;
  },

  /**
   * Fetch admin analytics and candidate records
   */
  getAdminOverview: async () => {
    const response = await api.get('/admin/overview');
    return response.data;
  },
};

export default careerService;
