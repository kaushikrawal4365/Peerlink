import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext({
  token: null,
  user: null,
  loading: true,
  isAuthenticated: false,
  login: () => {},
  logout: () => {}
});

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const response = await axios.get('http://localhost:5001/api/users/me', {
            headers: { Authorization: `Bearer ${storedToken}` }
          });
          setUser(response.data);
          setToken(storedToken);
        } catch (error) {
          console.error('Failed to load user', error);
          logout();
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const login = async (token, userData = {}) => {
    localStorage.setItem('token', token);
    setToken(token);
    
    try {
      const response = await axios.get('http://localhost:5001/api/users/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Merge the server response with any additional user data (like isProfileComplete)
      const userResponse = { ...response.data, ...userData };
      setUser(userResponse);
      // Ensure isProfileComplete is stored in localStorage
      if (userResponse.isProfileComplete !== undefined) {
        localStorage.setItem('isProfileComplete', userResponse.isProfileComplete);
      }
      return userResponse;
    } catch (error) {
      console.error('Failed to load user after login', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const value = {
    token,
    user,
    isAuthenticated: !!token,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Export the context as a named export
export const useAuth = () => useContext(AuthContext);

// Also export the context itself as a named export
export { AuthContext };

// Keep the default export for backward compatibility
export default AuthContext;
