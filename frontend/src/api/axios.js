import axios from 'axios';

const API_BASE = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,  // Send HttpOnly cookies on every request
  headers: {
    'Content-Type': 'application/json',
  },
  // Reasonable timeout to prevent infinite loading
  timeout: 10000,
});

// Track in-flight navigation to prevent duplicate redirects
let isRedirecting = false;

// Response interceptor: only redirect on 401 outside of login page
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest =
      error.config?.url?.includes('/auth/login') ||
      error.config?.url?.includes('/auth/register');

    if (error.response?.status === 401 && !isLoginRequest) {
      // Clear stale localStorage user data
      localStorage.removeItem('user');

      // Use React Router navigation instead of hard reload
      // Only navigate if not already on login page and not already redirecting
      if (!isRedirecting && window.location.pathname !== '/login') {
        isRedirecting = true;
        // Use history.pushState + dispatch to trigger React Router navigation
        // without a full page reload
        window.dispatchEvent(new CustomEvent('auth:logout'));
        setTimeout(() => { isRedirecting = false; }, 2000);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
