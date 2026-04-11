import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';
const PROTECTED_PATH_PREFIXES = ['/customer', '/provider', '/admin', '/reviewer'];

const clearStoredSession = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('user');
};

const isProtectedPath = (pathname: string) =>
  PROTECTED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearStoredSession();

      const currentPath = window.location.pathname;
      if (isProtectedPath(currentPath)) {
        const next = `${currentPath}${window.location.search}${window.location.hash}`;
        const redirectQuery = next ? `?redirect=${encodeURIComponent(next)}` : '';
        window.location.assign(`/login${redirectQuery}`);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
