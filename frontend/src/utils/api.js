import axios from 'axios';

// Use env variable ONLY (no fallback in production)
const API_URL = process.env.REACT_APP_API_URL;

if (!API_URL) {
  throw new Error("❌ API URL is not defined. Check Vercel environment variables.");
}

const api = axios.create({
  baseURL: API_URL,
});

// Attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fcrs_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
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