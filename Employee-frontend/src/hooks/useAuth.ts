import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../features/store';
import {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  updateProfileStart,
  updateProfileSuccess,
  updateProfileFailure,
} from '../features/auth/authSlice';
import { authApi } from '../services/api';

export const useAuth = () => {
  const dispatch = useDispatch();
  const auth = useSelector((state: RootState) => state.auth);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      if (token && !auth.user) {
        try {
          const userData = await authApi.getCurrentUser();
          dispatch(loginSuccess({ user: userData, token }));
        } catch (error) {
          dispatch(logout());
        }
      }
    };
    initializeAuth();
  }, [dispatch, auth.user]);

  // Setup listener for unauthorized access
  useEffect(() => {
    const handleUnauthorized = () => {
      dispatch(logout());
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [dispatch]);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        dispatch(loginStart());
        const response = await authApi.login(email, password);
        if (!response.token || !response.user) {
          throw new Error('Invalid response from server');
        }
        dispatch(loginSuccess({ user: response.user, token: response.token }));
      } catch (error) {
        dispatch(loginFailure(error instanceof Error ? error.message : 'Login failed'));
        throw error; // Rethrow so LoginPage can catch it
      }
    },
    [dispatch]
  );

  const logoutUser = useCallback(() => {
    authApi.logout();
    dispatch(logout());
  }, [dispatch]);

  const updateProfile = useCallback(
    async (data: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      address?: string;
      password?: string;
      currentPassword?: string;
    }) => {
      try {
        dispatch(updateProfileStart());
        const updatedUser = await authApi.updateProfile(data);
        dispatch(updateProfileSuccess(updatedUser));
        return updatedUser;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
        dispatch(updateProfileFailure(errorMessage));
        throw error;
      }
    },
    [dispatch]
  );

  const signup = useCallback(
    async (userData: {
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
        dispatch(loginStart());
        const response = await authApi.signup(userData);
        if (!response.token || !response.user) {
          throw new Error('Invalid response from server');
        }
        dispatch(loginSuccess({ user: response.user, token: response.token }));
      } catch (error) {
        dispatch(loginFailure(error instanceof Error ? error.message : 'Registration failed'));
        throw error;
      }
    },
    [dispatch]
  );

  return {
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    error: auth.error,
    login,
    logout: logoutUser,
    updateProfile,
    signup,
  };
};