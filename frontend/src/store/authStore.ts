import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, LoginData, RegisterData, ProfileUpdateData } from '../types';
import { authAPI, onboardingAPI } from '../services/api';
import { useAnalyticsStore } from './analyticsStore';

interface OnboardingData {
  interests: string[];
  education: string;
  skillLevel: string;
  goals: string;
  preferredContent: string[];
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  showOnboarding: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  updateProfile: (data: ProfileUpdateData) => Promise<User>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  setToken: (token: string) => void;
  setUser: (user: User) => void;
  completeOnboarding: (data: OnboardingData) => Promise<void>;
  dismissOnboarding: () => Promise<void>;
  retriggerOnboarding: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      showOnboarding: false,

      setToken: (token: string) => {
        localStorage.setItem('token', token);
        set({ token });
      },

      setUser: (user: User) => {
        set({ user });
      },

      login: async (data: LoginData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authAPI.login(data);
          localStorage.setItem('token', response.token);
          const needsOnboarding = !(response.user as any).onboardingCompleted;
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
            showOnboarding: needsOnboarding
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
          localStorage.setItem('token', response.token);
          // New registrations always need onboarding
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
            showOnboarding: true
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
        useAnalyticsStore.getState().userLogout().catch(error => {
          console.error('Error during analytics logout:', error);
        });

        localStorage.removeItem('token');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          showOnboarding: false
        });
      },

      checkAuth: async () => {
        const { token } = get();
        if (!token) return;

        localStorage.setItem('token', token);

        set({ isLoading: true });
        try {
          const { user } = await authAPI.getCurrentUser();
          const needsOnboarding = !(user as any).onboardingCompleted;
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            showOnboarding: needsOnboarding
          });
        } catch (error) {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            showOnboarding: false
          });
          localStorage.removeItem('token');
        }
      },

      completeOnboarding: async (data: OnboardingData) => {
        try {
          const response = await onboardingAPI.complete(data);
          set({
            user: response.user,
            showOnboarding: false
          });
        } catch (error: any) {
          console.error('Failed to complete onboarding:', error);
          // Still close the modal even on error
          set({ showOnboarding: false });
        }
      },

      dismissOnboarding: async () => {
        try {
          // Mark complete with empty data so the chatbot won't reappear on next login
          await onboardingAPI.complete({
            interests: [],
            education: '',
            skillLevel: '',
            goals: '',
            preferredContent: []
          });
        } catch (error) {
          console.error('Failed to dismiss onboarding:', error);
        } finally {
          set({ showOnboarding: false });
        }
      },

      retriggerOnboarding: () => {
        set({ showOnboarding: true });
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token })
    }
  )
);