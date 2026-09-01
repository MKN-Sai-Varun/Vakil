import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('vakil_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Only force-reload on 401s that aren't auth endpoints themselves.
    // Reloading on a login/signup 401 would swallow the error and flash the page.
    const url = err.config?.url ?? '';
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/signup') || url.includes('/auth/me');
    if (err.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('vakil_token');
      localStorage.removeItem('vakil_user');
      window.location.reload();
    }
    return Promise.reject(err);
  }
);