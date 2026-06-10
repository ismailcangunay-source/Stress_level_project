import axios from 'axios';

// In development, Vite proxies /auth, /predict, /history, /health
// to the backend. So we use same-origin requests (empty baseURL).
// In production, set VITE_API_URL to the backend's absolute URL.
const API_BASE = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,  // Send HttpOnly cookies on every request
  headers: {
    'Content-Type': 'application/json',
  },
  // Reasonable timeout to prevent infinite loading
  timeout: 15000,
});

// Track in-flight navigation to prevent duplicate redirects
let isRedirecting = false;

// Response interceptor: only redirect on 401 outside of login/register/me pages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    const isAuthRequest =
      url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/me');

    if (error.response?.status === 401 && !isAuthRequest) {
      // Clear stale localStorage user data
      localStorage.removeItem('user');

      // Only navigate if not already on login page and not already redirecting
      if (!isRedirecting && window.location.pathname !== '/login') {
        isRedirecting = true;
        window.dispatchEvent(new CustomEvent('auth:logout'));
        setTimeout(() => { isRedirecting = false; }, 2000);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
