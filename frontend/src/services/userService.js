import api from './api';

export const userService = {
  /**
   * Fetch authenticated user's comprehensive profile
   */
  getProfile: async () => {
    const response = await api.get('/users/profile');
    return response.data;
  },

  /**
   * Update authenticated user's profile details
   */
  updateProfile: async (profileData) => {
    const response = await api.put('/users/profile', profileData);
    return response.data;
  },
};

export default userService;

