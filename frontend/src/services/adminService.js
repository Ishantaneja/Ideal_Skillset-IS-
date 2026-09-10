import api from './api';

export const adminService = {
  /**
   * Retrieves summary statistics and recent platform activity for the admin dashboard.
   */
  getDashboard: async () => {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },

  /**
   * Lists registered users with pagination, regex search, and role filtering.
   * @param {Object} params { page, limit, search, role, sort_by, sort_order }
   */
  getUsers: async (params = {}) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  /**
   * Retrieves deep candidate user profile details.
   * @param {string} userId
   */
  getUser: async (userId) => {
    const response = await api.get(`/admin/users/${userId}`);
    return response.data;
  },

  /**
   * Updates user role with last-admin safeguard.
   * @param {string} userId
   * @param {string} role 'user' or 'admin'
   */
  updateUserRole: async (userId, role) => {
    const response = await api.put(`/admin/users/${userId}/role`, { role });
    return response.data;
  },

  /**
   * Deletes a user account with self-deletion and last-admin safeguards.
   * @param {string} userId
   */
  deleteUser: async (userId) => {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  },

  /**
   * Lists candidate resumes with metadata.
   * @param {Object} params { page, limit, search, parsing_status }
   */
  getResumes: async (params = {}) => {
    const response = await api.get('/admin/resumes', { params });
    return response.data;
  },

  /**
   * Lists analyzed job requisitions.
   * @param {Object} params { page, limit, search, work_mode }
   */
  getJobs: async (params = {}) => {
    const response = await api.get('/admin/jobs', { params });
    return response.data;
  },

  /**
   * Lists candidate assessments and practical simulations.
   * @param {Object} params { page, limit, search }
   */
  getAssessments: async (params = {}) => {
    const response = await api.get('/admin/assessments', { params });
    return response.data;
  },

  /**
   * Retrieves multi-dimensional Readiness Twin analytics.
   */
  getReadinessAnalytics: async () => {
    const response = await api.get('/admin/readiness');
    return response.data;
  },

  /**
   * Retrieves market in-demand skills vs missing candidate skills analytics.
   */
  getSkillAnalytics: async () => {
    const response = await api.get('/admin/skills/analytics');
    return response.data;
  },

  /**
   * Lists administrative audit logs.
   * @param {Object} params { page, limit, action }
   */
  getAuditLogs: async (params = {}) => {
    const response = await api.get('/admin/audit-logs', { params });
    return response.data;
  },

  /**
   * Retrieves platform health, DB ping status, and service states.
   */
  getHealth: async () => {
    const response = await api.get('/admin/health');
    return response.data;
  },

  /**
   * Retrieves resume ATS score distribution, common missing skills, and problem breakdown.
   */
  getATSAnalytics: async () => {
    const response = await api.get('/admin/ats/analytics');
    return response.data;
  },

  /**
   * Retrieves assessment pass rates, attempt counts, and skill difficulty matrix.
   */
  getAssessmentAnalytics: async () => {
    const response = await api.get('/admin/assessments/analytics');
    return response.data;
  },

  /**
   * Retrieves mock interview analytics across 5 sub-scores and common weaknesses.
   */
  getInterviewAnalytics: async () => {
    const response = await api.get('/admin/interviews/analytics');
    return response.data;
  },

  /**
   * Retrieves candidate roadmap progression, completed vs active counts, and drop-off weeks.
   */
  getRoadmapAnalytics: async () => {
    const response = await api.get('/admin/roadmaps/analytics');
    return response.data;
  },

  /**
   * Retrieves Ollama AI inference health, latency, model parameters, and load status.
   */
  getAIHealth: async () => {
    const response = await api.get('/admin/ai/health');
    return response.data;
  },

  /**
   * Lists administrative notifications and alerts.
   * @param {Object} params { unread_only }
   */
  getNotifications: async (params = {}) => {
    const response = await api.get('/admin/notifications', { params });
    return response.data;
  },

  /**
   * Marks a notification (or 'all') as read.
   * @param {string} notificationId
   */
  markNotificationRead: async (notificationId) => {
    const response = await api.put(`/admin/notifications/${notificationId}/read`);
    return response.data;
  },
};

export default adminService;


