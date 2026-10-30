import axios from 'axios';
import { API_BASE_URL } from '../config';

// Create axios instance with base config
const apiClient = axios.create({
  baseURL: API_BASE_URL,  // Use the configured API base URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auto-logout on expired/invalid token
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const code = error?.response?.data?.error;
    if (status === 401 && (code === 'token_expired' || code === 'Invalid token' || code === 'No token provided')) {
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('auth-storage');
      } catch {
        // Intentionally empty - localStorage operations may fail in some environments
      }
      if (typeof window !== 'undefined') {
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient; 