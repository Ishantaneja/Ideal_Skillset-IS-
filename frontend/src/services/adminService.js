import api from './api';

const adminService = {
  getOverview: async () => {
    const response = await api.get('/admin/overview');
    return response.data;
  },

  getJobRoles: async () => {
    const response = await api.get('/admin/job-roles');
    return response.data;
  },

  getUsers: async () => {
    const response = await api.get('/admin/users');
    return response.data;
  },

  getUserReadiness: async (userId) => {
    const response = await api.get(`/admin/users/${userId}/readiness`);
    return response.data;
  },

  getUserSkillGaps: async (userId) => {
    const response = await api.get(`/admin/users/${userId}/skill-gaps`);
    return response.data;
  },

  createJobRole: async (roleData) => {
    const response = await api.post('/admin/job-roles', roleData);
    return response.data;
  },

  updateJobRole: async (roleId, roleData) => {
    const response = await api.put(`/admin/job-roles/${roleId}`, roleData);
    return response.data;
  },

  deactivateUser: async (userId) => {
    const response = await api.post(`/admin/users/${userId}/deactivate`);
    return response.data;
  },

  activateUser: async (userId) => {
    const response = await api.post(`/admin/users/${userId}/activate`);
    return response.data;
  },
};

export { adminService };
export default adminService;
