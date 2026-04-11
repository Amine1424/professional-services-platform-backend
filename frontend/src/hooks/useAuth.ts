import { useState } from 'react';
import api from '../config/api';
import { AppRole, StoredUser } from '../lib/role-routing';

interface LoginPayload {
  email: string;
  password: string;
}

interface RegisterPayload {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  role: 'customer' | 'service_provider';
  acceptTerms: boolean;
  phone?: string;
  companyName?: string;
}

interface AuthApiResponse {
  status: 'success' | 'error';
  message: string;
  data?: {
    user: StoredUser;
    accessToken: string;
    refreshToken: string;
  };
}

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(false);

  const persistAuth = (payload?: AuthApiResponse['data']) => {
    if (!payload) return;

    localStorage.setItem('accessToken', payload.accessToken);
    localStorage.setItem('refreshToken', payload.refreshToken);
    localStorage.setItem('user', JSON.stringify(payload.user));
  };

  const clearAuth = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  };

  const login = async (body: LoginPayload) => {
    setIsLoading(true);
    try {
      const response = await api.post<AuthApiResponse>('/auth/login', body);
      persistAuth(response.data.data);
      return response.data;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (body: RegisterPayload) => {
    setIsLoading(true);
    try {
      const response = await api.post<AuthApiResponse>('/auth/register', body);
      persistAuth(response.data.data);
      return response.data;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    } finally {
      clearAuth();
    }
  };

  const getCurrentUser = (): StoredUser | null => {
    try {
      const raw = localStorage.getItem('user');
      if (!raw) return null;
      return JSON.parse(raw) as StoredUser;
    } catch {
      return null;
    }
  };

  const getCurrentRole = (): AppRole | null => {
    return getCurrentUser()?.role ?? null;
  };

  return {
    login,
    register,
    logout,
    getCurrentUser,
    getCurrentRole,
    isLoading,
  };
};