import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, LoginData, RegisterData, ProfileUpdateData } from '../types';
import { authAPI } from '../services/api';
import { useAnalyticsStore } from './analyticsStore';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  updateProfile: (data: ProfileUpdateData) => Promise<User>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  setToken: (token: string) => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      setToken: (token: string) => {
        // Set token directly in localStorage for API interceptor
        localStorage.setItem('token', token);
        set({ token });
      },
      
      setUser: (user: User) => {
        // Update user data directly (for when we need to refresh user data)
        set({ user });
      },

      login: async (data: LoginData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authAPI.login(data);
          // Set token in localStorage for API interceptor
          localStorage.setItem('token', response.token);
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false
          });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.response?.data?.error || 'Login failed'
          });
          throw error;
        }
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authAPI.register(data);
          // Set token in localStorage for API interceptor
          localStorage.setItem('token', response.token);
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false
          });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.response?.data?.error || 'Registration failed'
          });
          throw error;
        }
      },
      
      updateProfile: async (data: ProfileUpdateData) => {
        set({ isLoading: true, error: null });
        try {
          console.log('Auth store: updating profile with data:', {
            ...data,
            profileImage: data.profileImage ? `File: ${data.profileImage.name}` : null
          });
          
          const updatedUser = await authAPI.updateProfile(data);
          console.log('Auth store: received updated user data:', updatedUser);
          
          set({
            user: updatedUser,
            isLoading: false
          });
          
          return updatedUser;
        } catch (error: any) {
          console.error('Auth store: error updating profile:', error);
          set({
            isLoading: false,
            error: error.response?.data?.error || 'Profile update failed'
          });
          throw error;
        }
      },

      logout: () => {
        // Call the analytics store's userLogout function to remove user from online users
        useAnalyticsStore.getState().userLogout().catch(error => {
          console.error('Error during analytics logout:', error);
        });
        
        // Remove token from localStorage
        localStorage.removeItem('token');
        set({
          user: null,
          token: null,
          isAuthenticated: false
        });
      },

      checkAuth: async () => {
        const { token } = get();
        if (!token) return;

        // Set token directly in localStorage for API interceptor
        localStorage.setItem('token', token);
        
        set({ isLoading: true });
        try {
          const { user } = await authAPI.getCurrentUser();
          set({
            user,
            isAuthenticated: true,
            isLoading: false
          });
        } catch (error) {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false
          });
          localStorage.removeItem('token');
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token })
    }
  )
); 