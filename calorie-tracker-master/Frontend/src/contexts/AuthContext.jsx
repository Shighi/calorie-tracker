import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Create the context
const AuthContext = createContext();

// API Base URL configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Create a centralized axios instance with default configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Interceptor for handling token
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkAuthStatus = async () => {
      if (token) {
        try {
          const response = await api.get('/auth/profile');
          
          if (response.data.data) {
            setUser(response.data.data);
          } else {
            localStorage.removeItem('token');
            setToken(null);
            setUser(null);
          }
        } catch (err) {
          console.error('Auth verification failed:', err);
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      
      setLoading(false);
    };
    
    checkAuthStatus();
  }, [token]);

  const clearError = () => {
    setError(null);
  };

  const login = async (emailOrUsername, password) => {
    setError(null);
    try {
      const response = await api.post('/auth/login', { emailOrUsername, password });
      
      if (response.data.data.token) {
        const newToken = response.data.data.token;
        localStorage.setItem('token', newToken);
        setToken(newToken);
        setUser(response.data.data.user);
        return true;
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      return false;
    }
  };

  const register = async (userData) => {
    setError(null);
    try {
      const response = await api.post('/auth/register', userData);
      
      if (response.data.data && response.data.data.token) {
        const newToken = response.data.data.token;
        localStorage.setItem('token', newToken);
        setToken(newToken);
        setUser(response.data.data.user);
        return true;
      } else {
        return await login(userData.email, userData.password);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      return false;
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await api.post('/auth/logout');
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    }
  };

  const updateProfile = async (userData) => {
    setError(null);
    try {
      const response = await api.put('/auth/profile', userData);
      
      if (response.data.data) {
        setUser(response.data.data);
        return true;
      }
    } catch (err) {
      if (err.response && err.response.status === 401) {
        await logout();
      }
      setError(err.response?.data?.message || 'Profile update failed');
      return false;
    }
  };

  const value = {
    user,
    token,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    clearError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

export default AuthContext;