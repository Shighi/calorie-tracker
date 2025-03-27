import axios from 'axios';

// Determine the appropriate base URL based on environment
const API_BASE_URL = import.meta.env.PROD 
  ? (
      import.meta.env.VITE_PRODUCTION_API_URL || 
      import.meta.env.VITE_ALTERNATIVE_PRODUCTION_API_URL
    ).replace('/api', '') 
  : import.meta.env.VITE_API_BASE_URL.replace('/api', '');

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Add request interceptor to include auth token from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle session expiration
    if (error.response && error.response.status === 401) {
      // Optional: Clear localStorage and redirect to login
      // localStorage.removeItem('token');
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;