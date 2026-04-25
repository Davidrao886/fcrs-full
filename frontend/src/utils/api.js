// src/utils/api.js — Axios instance with auth token injection
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: API_URL });

// Attach JWT token to every request if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fcrs_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally — redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('fcrs_token');
      localStorage.removeItem('fcrs_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
