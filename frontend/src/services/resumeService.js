import api from './api';

export const resumeService = {
  /**
   * Uploads and parses a PDF or DOCX resume document.
   * @param {File} file - The file object from file input or drop event.
   * @param {Function} [onUploadProgress] - Optional progress callback.
   */
  uploadResume: async (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/resumes/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
    return response.data;
  },

  /**
   * Fetches all resumes belonging to the authenticated user.
   */
  getResumes: async () => {
    const response = await api.get('/resumes');
    return response.data;
  },

  /**
   * Fetches single resume details, extracted text, and parsed sections.
   * @param {string} resumeId
   */
  getResume: async (resumeId) => {
    const response = await api.get(`/resumes/${resumeId}`);
    return response.data;
  },

  /**
   * Fetches structured parsed sections only.
   * @param {string} resumeId
   */
  getParsedResume: async (resumeId) => {
    const response = await api.get(`/resumes/${resumeId}/parsed`);
    return response.data;
  },

  /**
   * Deletes a resume by ID.
   * @param {string} resumeId
   */
  deleteResume: async (resumeId) => {
    const response = await api.delete(`/resumes/${resumeId}`);
    return response.data;
  },

  /**
   * Sets a specific resume as the primary active document.
   * @param {string} resumeId
   */
  activateResume: async (resumeId) => {
    const response = await api.put(`/resumes/${resumeId}/activate`);
    return response.data;
  },
};

export default resumeService;

