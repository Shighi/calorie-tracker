// src/contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUserProfile(token);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserProfile = async (token) => {
    try {
      const response = await axios.get('/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data && response.data.data) {
        setUser(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError('Failed to load user profile');
      // If the token is invalid, clear it
      if (err.response && err.response.status === 401) {
        localStorage.removeItem('token');
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (emailOrUsername, password) => {
    try {
      setLoading(true);
      const response = await axios.post('/api/auth/login', { emailOrUsername, password });
      
      if (response.data && response.data.data && response.data.data.token) {
        localStorage.setItem('token', response.data.data.token);
        await fetchUserProfile(response.data.data.token);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Login failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await axios.post('/api/auth/register', userData);
      
      if (response.data && response.data.data && response.data.data.token) {
        localStorage.setItem('token', response.data.data.token);
        await fetchUserProfile(response.data.data.token);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || 'Registration failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const updateProfile = async (profileData) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.put('/api/auth/profile', profileData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data && response.data.data) {
        setUser(response.data.data);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err.response?.data?.message || 'Profile update failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}