import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://ideal-skillset-is.onrender.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Attach JWT access token to every outgoing request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ideal_skillset_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for centralized error message formatting
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Extract readable detail message if available from FastAPI backend
    let message = error.response?.data?.detail || error.response?.data?.message;
    if (!message) {
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        message = 'Cannot connect to backend server. Make sure the FastAPI backend is running on https://ideal-skillset-is.onrender.com/.';
      } else {
        message = error.message || 'An unexpected network error occurred';
      }
    }
    
    return Promise.reject(new Error(message));
  }
);

export default api;
