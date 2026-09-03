import api from './api';

export const roadmapService = {
  /**
   * Generates a personalized multi-week career roadmap.
   * @param {Object} payload { resume_id, job_id, skill_gap_analysis_id, duration_weeks }
   */
  generateRoadmap: async (payload) => {
    const response = await api.post('/roadmaps/generate', payload);
    return response.data;
  },

  /**
   * Retrieves all career roadmaps created by current user.
   */
  getRoadmaps: async () => {
    const response = await api.get('/roadmaps');
    return response.data;
  },

  /**
   * Retrieves detailed roadmap by identifier.
   * @param {string} roadmapId
   */
  getRoadmap: async (roadmapId) => {
    const response = await api.get(`/roadmaps/${roadmapId}`);
    return response.data;
  },

  /**
   * Updates task completion status (not_started | in_progress | completed).
   * @param {string} roadmapId
   * @param {string} taskId
   * @param {string} status
   */
  updateTaskStatus: async (roadmapId, taskId, status) => {
    const response = await api.patch(`/roadmaps/${roadmapId}/tasks/${taskId}`, {
      status,
    });
    return response.data;
  },

  /**
   * Regenerates existing roadmap with new duration.
   * @param {string} roadmapId
   * @param {number} durationWeeks
   */
  regenerateRoadmap: async (roadmapId, durationWeeks) => {
    const response = await api.post(`/roadmaps/${roadmapId}/regenerate`, {
      duration_weeks: durationWeeks,
    });
    return response.data;
  },

  /**
   * Deletes a career roadmap from history.
   * @param {string} roadmapId
   */
  deleteRoadmap: async (roadmapId) => {
    const response = await api.delete(`/roadmaps/${roadmapId}`);
    return response.data;
  },
};

export default roadmapService;

