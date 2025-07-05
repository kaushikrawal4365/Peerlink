import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests if available
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

// Match related API calls
export const matchAPI = {
  /**
   * Get potential matches for the current user
   * @returns {Promise<Array>} Array of potential matches
   */
  getPotentialMatches: async () => {
    try {
      const response = await api.get('/matches');
      return response.data;
    } catch (error) {
      console.error('Error fetching potential matches:', error);
      throw error;
    }
  },

  /**
   * Accept a match with another user
   * @param {string} userId - ID of the user to accept
   * @returns {Promise<Object>} Response data
   */
  acceptMatch: async (userId) => {
    try {
      const response = await api.put(`/matches/${userId}`, { status: 'accepted' });
      return response.data;
    } catch (error) {
      console.error('Error accepting match:', error);
      throw error;
    }
  },

  /**
   * Reject a match with another user
   * @param {string} userId - ID of the user to reject
   * @returns {Promise<Object>} Response data
   */
  rejectMatch: async (userId) => {
    try {
      const response = await api.put(`/matches/${userId}`, { status: 'rejected' });
      return response.data;
    } catch (error) {
      console.error('Error rejecting match:', error);
      throw error;
    }
  },

  /**
   * Get all accepted matches for the current user
   * @returns {Promise<Array>} Array of accepted matches
   */
  getAcceptedMatches: async () => {
    try {
      const response = await api.get('/matches/accepted');
      return response.data;
    } catch (error) {
      console.error('Error getting accepted matches:', error);
      throw error;
    }
  },
};

export default api;
