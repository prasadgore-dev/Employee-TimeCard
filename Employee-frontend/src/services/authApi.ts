import api from './api';
// import type { User } from '../types';

const login = async (email: string, password: string) => {
  try {
    const response = await api.post('/api/auth/login', {
      email,
      password
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Login failed. Please try again.');
  }
};

const logout = async () => {
  await api.post('/api/auth/logout');
};

const getCurrentUser = async () => {
  try {
    const response = await api.get('/api/auth/me');
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch user data');
  }
};

const updateProfile = async (data: {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  password?: string;
  currentPassword?: string;
}) => {
  const response = await api.put('/api/auth/profile', data);
  return response.data;
};

const signup = async (userData: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  podName: string;
  position: string;
  phone?: string;
}) => {
  try {
    const response = await api.post('/api/auth/signup', userData);
    return response.data;
  } catch (error: any) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Registration failed. Please try again.');
  }
};

export const authApi = {
  login,
  logout,
  updateProfile,
  getCurrentUser,
  signup,
};