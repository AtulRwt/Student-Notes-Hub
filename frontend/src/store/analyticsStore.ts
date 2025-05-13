import { create } from 'zustand';
import axios from 'axios';
import { useAuthStore } from './authStore';

const API_URL = 'http://localhost:5000/api';

// Types
interface EngagementData {
  dailyViews: number[];
  weeklyUploads: number[];
  monthlyActiveUsers: number[];
  resourceTypeDistribution: Record<string, number>;
  timeSpent: Record<string, number>;
  totalNotes: number;
  totalUsers: number;
  growthMetrics: {
    viewsGrowth: number;
    uploadsGrowth: number;
    usersGrowth: number;
  };
}

interface OnlineUser {
  id: string;
  name: string;
  department: string;
  lastAction: string;
  lastActive: Date;
}

interface OnlineData {
  onlineCount: number;
  onlineUsers: OnlineUser[];
  departmentActivity: Record<string, number>;
}

interface AnalyticsState {
  engagement: EngagementData | null;
  onlineData: OnlineData | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  fetchEngagementData: () => Promise<void>;
  fetchOnlineUsers: () => Promise<void>;
  trackUserAction: (action: string) => Promise<void>;
  updateOnlineStatus: () => Promise<void>;
  userLogout: () => Promise<void>;
}

// API methods
const analyticsAPI = {
  getEngagement: async (): Promise<EngagementData> => {
    const response = await axios.get<EngagementData>(`${API_URL}/analytics/engagement`);
    return response.data;
  },

  getOnlineUsers: async (): Promise<OnlineData> => {
    const response = await axios.get<OnlineData>(`${API_URL}/analytics/online-users`);
    return response.data;
  },

  trackAction: async (userId: string, action: string): Promise<void> => {
    await axios.post(`${API_URL}/analytics/track-action`, { userId, action });
  },

  updateStatus: async (userId: string, name: string, department?: string): Promise<void> => {
    await axios.post(`${API_URL}/analytics/online-status`, { userId, name, department });
  },
  
  userLogout: async (userId: string): Promise<void> => {
    await axios.post(`${API_URL}/analytics/user-logout`, { userId });
  }
};

// Create the store
export const useAnalyticsStore = create<AnalyticsState>((set, get) => ({
  engagement: null,
  onlineData: null,
  isLoading: false,
  error: null,
  lastUpdated: null,

  fetchEngagementData: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await analyticsAPI.getEngagement();
      set({ 
        engagement: data, 
        isLoading: false,
        lastUpdated: new Date()
      });
    } catch (error: any) {
      console.error('Error fetching engagement data:', error);
      set({ 
        isLoading: false, 
        error: error.response?.data?.error || 'Failed to fetch engagement data' 
      });
    }
  },

  fetchOnlineUsers: async () => {
    set(state => ({ isLoading: !state.onlineData, error: null }));
    try {
      const data = await analyticsAPI.getOnlineUsers();
      set({ 
        onlineData: data, 
        isLoading: false,
        lastUpdated: new Date()
      });
    } catch (error: any) {
      console.error('Error fetching online users:', error);
      set(state => ({ 
        isLoading: false, 
        error: error.response?.data?.error || 'Failed to fetch online users' 
      }));
    }
  },

  trackUserAction: async (action: string) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    try {
      await analyticsAPI.trackAction(user.id, action);
      // Refresh online data after tracking action - only if it's been over 5 seconds since last refresh
      const lastUpdated = get().lastUpdated;
      const now = new Date();
      if (!lastUpdated || now.getTime() - lastUpdated.getTime() > 5000) {
        get().fetchOnlineUsers();
      }
    } catch (error) {
      console.error('Error tracking user action:', error);
    }
  },

  updateOnlineStatus: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    try {
      await analyticsAPI.updateStatus(user.id, user.name, user.education);
      // No need to refresh data here as the periodic polling will handle it
    } catch (error) {
      console.error('Error updating online status:', error);
    }
  },
  
  userLogout: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    
    try {
      await analyticsAPI.userLogout(user.id);
      // Clear online data to reflect the logout
      set(state => ({
        onlineData: state.onlineData ? {
          ...state.onlineData,
          onlineCount: Math.max(0, state.onlineData.onlineCount - 1),
          onlineUsers: state.onlineData.onlineUsers.filter(u => u.id !== user.id)
        } : null
      }));
    } catch (error) {
      console.error('Error handling user logout:', error);
    }
  }
})); 