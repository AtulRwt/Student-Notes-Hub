import { create } from 'zustand';
import type { NotificationSettings, AppearanceSettings, SecuritySettings } from '../types';
import { settingsAPI } from '../services/api';

// Helper to load saved appearance preferences
const loadStoredAppearancePreferences = (): Partial<AppearanceSettings> => {
  try {
    const storedPreferences = localStorage.getItem('appearance-preferences');
    if (storedPreferences) {
      return JSON.parse(storedPreferences);
    }
  } catch (error) {
    console.error('Error loading appearance preferences:', error);
  }
  return {};
};

// Get stored preferences
const storedAppearance = loadStoredAppearancePreferences();

interface SettingsState {
  notifications: NotificationSettings;
  appearance: AppearanceSettings;
  security: SecuritySettings;
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchSettings: () => Promise<void>;
  updateNotifications: (settings: Partial<NotificationSettings>) => Promise<void>;
  updateAppearance: (settings: Partial<AppearanceSettings>) => Promise<void>;
  updateSecurity: (settings: Partial<SecuritySettings>) => Promise<void>;
  applyAppearanceSettings: () => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  notifications: {
    emailNotifications: true,
    newComments: true,
    newFollowers: true,
    connectionRequests: true,
    notesFromFollowing: true,
    systemAnnouncements: true
  },
  appearance: {
    theme: storedAppearance.theme || 'dark',
    fontSize: storedAppearance.fontSize || 'medium',
    reducedMotion: storedAppearance.reducedMotion || false,
    highContrast: storedAppearance.highContrast || false
  },
  security: {
    twoFactorAuth: false,
    loginAlerts: true,
    sessionTimeout: '1 hour'
  },
  isLoaded: false,
  isLoading: false,
  error: null,
  
  fetchSettings: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const settings = await settingsAPI.getSettings();
      
      if (settings) {
        set({
          notifications: settings.notifications,
          appearance: settings.appearance,
          security: settings.security,
          isLoaded: true
        });
        
        // Apply appearance settings
        get().applyAppearanceSettings();
      }
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      set({ error: error.message || 'Failed to fetch settings' });
    } finally {
      set({ isLoading: false });
    }
  },
  
  updateNotifications: async (settings: Partial<NotificationSettings>) => {
    const currentNotifications = get().notifications;
    const updatedNotifications = { ...currentNotifications, ...settings };
    
    set({ notifications: updatedNotifications });
    
    try {
      await settingsAPI.updateNotifications(updatedNotifications);
    } catch (error: any) {
      // Revert changes on failure
      set({ notifications: currentNotifications, error: error.message });
      throw error;
    }
  },
  
  updateAppearance: async (settings: Partial<AppearanceSettings>) => {
    const currentAppearance = get().appearance;
    const updatedAppearance = { ...currentAppearance, ...settings };
    
    set({ appearance: updatedAppearance });
    
    // Apply appearance settings immediately for better UX
    get().applyAppearanceSettings();
    
    try {
      await settingsAPI.updateAppearance(updatedAppearance);
    } catch (error: any) {
      // Revert changes on failure
      set({ appearance: currentAppearance, error: error.message });
      get().applyAppearanceSettings();
      throw error;
    }
  },
  
  updateSecurity: async (settings: Partial<SecuritySettings>) => {
    const currentSecurity = get().security;
    const updatedSecurity = { ...currentSecurity, ...settings };
    
    set({ security: updatedSecurity });
    
    try {
      await settingsAPI.updateSecurity(updatedSecurity);
    } catch (error: any) {
      // Revert changes on failure
      set({ security: currentSecurity, error: error.message });
      throw error;
    }
  },
  
  applyAppearanceSettings: () => {
    const { theme, fontSize, reducedMotion, highContrast } = get().appearance;
    const htmlElement = document.documentElement;
    
    // Theme (dark/light)
    if (theme === 'light') {
      htmlElement.classList.add('light-theme');
    } else {
      htmlElement.classList.remove('light-theme');
    }
    
    // Font size
    htmlElement.style.fontSize = 
      fontSize === 'small' ? '14px' :
      fontSize === 'large' ? '18px' : '16px';
    
    // Reduced motion
    if (reducedMotion) {
      htmlElement.classList.add('reduced-motion');
    } else {
      htmlElement.classList.remove('reduced-motion');
    }
    
    // High contrast
    if (highContrast) {
      htmlElement.classList.add('high-contrast');
    } else {
      htmlElement.classList.remove('high-contrast');
    }
    
    // Store preferences in localStorage for persistence across page reloads
    const appearancePreferences = {
      theme, 
      fontSize,
      reducedMotion,
      highContrast
    };
    localStorage.setItem('appearance-preferences', JSON.stringify(appearancePreferences));
  }
})); 