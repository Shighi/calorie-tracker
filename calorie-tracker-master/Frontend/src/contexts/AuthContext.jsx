import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Create the context
const AuthContext = createContext();

// API Base URL configuration
const API_BASE_URL = 'http://localhost:3000/api';

// Create a provider component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token')); // Track token in state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if the user is logged in whenever token changes
  useEffect(() => {
    const checkAuthStatus = async () => {
      if (token) {
        try {
          // Get user profile
          const response = await axios.get(`${API_BASE_URL}/auth/profile`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.data.data) {
            setUser(response.data.data);
          } else {
            // Token is invalid or expired
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
        // No token found
        setUser(null);
      }
      
      setLoading(false);
    };
    
    checkAuthStatus();
  }, [token]); // Re-run when token changes

  // Clear error message
  const clearError = () => {
    setError(null);
  };

  // Login function
  const login = async (emailOrUsername, password) => {
    setError(null);
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, { emailOrUsername, password });
      
      if (response.data.data.token) {
        const newToken = response.data.data.token;
        localStorage.setItem('token', newToken);
        setToken(newToken); // Update token state
        setUser(response.data.data.user);
        return true;
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      return false;
    }
  };

  // Register function
  const register = async (userData) => {
    setError(null);
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);
      
      if (response.data.data && response.data.data.token) {
        // If the register endpoint returns a token directly
        const newToken = response.data.data.token;
        localStorage.setItem('token', newToken);
        setToken(newToken);
        setUser(response.data.data.user);
        return true;
      } else {
        // If we need to login after registration
        return await login(userData.email, userData.password);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      return false;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      if (token) {
        await axios.post(`${API_BASE_URL}/auth/logout`, {}, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('token');
      setToken(null); // Clear token state
      setUser(null);
    }
  };

  // Update user profile
  const updateProfile = async (userData) => {
    setError(null);
    try {
      const response = await axios.put(`${API_BASE_URL}/auth/profile`, userData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.data) {
        setUser(response.data.data);
        return true;
      }
    } catch (err) {
      // Check if token expired during profile update
      if (err.response && err.response.status === 401) {
        // Token expired, log out the user
        await logout();
      }
      setError(err.response?.data?.message || 'Profile update failed');
      return false;
    }
  };

  const value = {
    user,
    token, // Include token in the context value
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    clearError // Include the clearError function
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Create a custom hook to use the auth context
export function useAuth() {
  return useContext(AuthContext);
}

// Export the context itself in case it's needed
export default AuthContext;