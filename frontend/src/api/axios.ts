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

export default apiClient; 