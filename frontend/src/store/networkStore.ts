import { create } from 'zustand';
import apiClient from '../api/axios';
import { persist } from 'zustand/middleware';

export interface ConnectionRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  sender?: {
    id: string;
    name: string;
    profileImage: string | null;
    bio: string | null;
  };
  receiver?: {
    id: string;
    name: string;
    profileImage: string | null;
    bio: string | null;
  };
}

export interface Connection {
  id: string;
  name: string;
  profileImage: string | null;
  bio: string | null;
  _count?: {
    notes: number;
    followers: number;
  };
}

export interface RelationshipStatus {
  connected: boolean;
  sentRequest: string | null;
  receivedRequest: string | null;
  following: boolean;
  lastUpdated: number;
}

// Separate types to better organize relationship data
export interface ConnectionStatus {
  connected: boolean;
  sentRequest: string | null;
  receivedRequest: string | null;
}

export interface FollowStatus {
  following: boolean;
  isFollower: boolean;
}

interface NetworkState {
  connectionRequests: ConnectionRequest[];
  connections: Connection[];
  followers: Connection[];
  following: Connection[];
  lastFetched: Record<string, number>; // Timestamps of last fetches
  // Cache for relationship status between current user and other users
  relationshipCache: Record<string, RelationshipStatus>;
  isLoading: boolean;
  error: string | null;
  
  // Methods
  fetchConnectionRequests: () => Promise<void>;
  fetchConnections: () => Promise<void>;
  fetchFollowers: () => Promise<void>;
  fetchFollowing: () => Promise<void>;
  sendConnectionRequest: (userId: string) => Promise<{ status: string }>;
  acceptConnectionRequest: (userId: string) => Promise<void>;
  declineConnectionRequest: (userId: string) => Promise<void>;
  removeConnection: (userId: string) => Promise<void>;
  checkRelationship: (userId: string) => Promise<RelationshipStatus>;
  getConnectionStatus: (userId: string) => ConnectionStatus | null;
  getFollowStatus: (userId: string) => FollowStatus | null;
  updateRelationship: (userId: string, relationshipUpdates: Partial<Omit<RelationshipStatus, 'lastUpdated'>>) => void;
  getRelationship: (userId: string) => RelationshipStatus | null;
  refreshNetworkData: () => Promise<void>;
  followUser: (userId: string) => Promise<void>;
  unfollowUser: (userId: string) => Promise<void>;
}

export const useNetworkStore = create<NetworkState>()(
  persist(
    (set, get) => ({
      connectionRequests: [],
      connections: [],
      followers: [],
      following: [],
      lastFetched: {},
      relationshipCache: {},
      isLoading: false,
      error: null,
      
      // Get cached relationship or null if not found or expired
      getRelationship: (userId: string) => {
        const relationship = get().relationshipCache[userId];
        if (!relationship) return null;
        
        // Consider cache expired after 5 minutes
        const now = Date.now();
        if (now - relationship.lastUpdated > 5 * 60 * 1000) return null;
        
        return relationship;
      },

      // Get only connection-related status (for ConnectButton)
      getConnectionStatus: (userId: string) => {
        const relationship = get().getRelationship(userId);
        if (!relationship) return null;
        
        return {
          connected: relationship.connected,
          sentRequest: relationship.sentRequest,
          receivedRequest: relationship.receivedRequest,
        };
      },

      // Get only follow-related status (for FollowButton)
      getFollowStatus: (userId: string) => {
        const relationship = get().getRelationship(userId);
        if (!relationship) return null;
        
        // Note: isFollower is not currently tracked in the relationship cache
        // This would require backend support to track who follows the current user
        return {
          following: relationship.following,
          isFollower: false, // Placeholder until backend support is added
        };
      },

      // Update relationship cache for a user
      updateRelationship: (userId: string, relationshipUpdates: Partial<Omit<RelationshipStatus, 'lastUpdated'>>) => {
        set(state => ({
          relationshipCache: {
            ...state.relationshipCache,
            [userId]: {
              ...((state.relationshipCache[userId] || {
                connected: false,
                sentRequest: null,
                receivedRequest: null,
                following: false,
              }) as RelationshipStatus),
              ...relationshipUpdates,
              lastUpdated: Date.now()
            }
          }
        }));
      },
      
      // Fetch connection requests
      fetchConnectionRequests: async () => {
        // Skip if it was fetched in the last 5 seconds (debounce)
        const now = Date.now();
        const lastFetched = get().lastFetched.connectionRequests || 0;
        if (now - lastFetched < 5000 && get().connectionRequests.length > 0) {
          return;
        }
        
        set(state => ({ 
          isLoading: true,
          lastFetched: {
            ...state.lastFetched,
            connectionRequests: now
          }
        }));
        
        try {
          const response = await apiClient.get('/api/users/connections/requests');
          
          // Update relationship cache for each sender
          response.data.forEach((request: ConnectionRequest) => {
            if (request.sender?.id) {
              get().updateRelationship(request.sender.id, {
                receivedRequest: request.status
              });
            }
          });
          
          set({ 
            connectionRequests: response.data,
            isLoading: false,
            error: null
          });
        } catch (error: any) {
          console.error('Error fetching connection requests:', error);
          set({ 
            isLoading: false, 
            error: error.response?.data?.error || 'Failed to fetch connection requests' 
          });
        }
      },
      
      // Fetch connections
      fetchConnections: async () => {
        // Skip if it was fetched in the last 5 seconds (debounce)
        const now = Date.now();
        const lastFetched = get().lastFetched.connections || 0;
        if (now - lastFetched < 5000 && get().connections.length > 0) {
          return;
        }
        
        set(state => ({ 
          isLoading: true,
          lastFetched: {
            ...state.lastFetched,
            connections: now
          }
        }));
        
        try {
          const response = await apiClient.get('/api/users/connections');
          
          // Update relationship cache for each connection
          response.data.forEach((connection: Connection) => {
            get().updateRelationship(connection.id, {
              connected: true
            });
          });
          
          set({ 
            connections: response.data,
            isLoading: false,
            error: null
          });
        } catch (error: any) {
          console.error('Error fetching connections:', error);
          set({ 
            isLoading: false, 
            error: error.response?.data?.error || 'Failed to fetch connections' 
          });
        }
      },
      
      // Fetch followers
      fetchFollowers: async () => {
        // Skip if it was fetched in the last 5 seconds (debounce)
        const now = Date.now();
        const lastFetched = get().lastFetched.followers || 0;
        if (now - lastFetched < 5000 && get().followers.length > 0) {
          return;
        }
        
        set(state => ({ 
          isLoading: true,
          lastFetched: {
            ...state.lastFetched,
            followers: now
          }
        }));
        
        try {
          // Get the current user's ID from auth token
          const token = localStorage.getItem('token');
          if (!token) {
            throw new Error('Not authenticated');
          }
          
          // Parse JWT token to get current user ID
          const decodedToken = JSON.parse(atob(token.split('.')[1]));
          const currentUserId = decodedToken.id;
          
          const response = await apiClient.get(`/api/users/${currentUserId}/followers`);
          
          // The API returns an object with 'followers' key containing the actual followers array
          const followersList = response.data.followers || response.data;
          
          set({ 
            followers: Array.isArray(followersList) ? followersList : [],
            isLoading: false,
            error: null
          });
        } catch (error: any) {
          console.error('Error fetching followers:', error);
          set({ 
            isLoading: false, 
            error: error.response?.data?.error || 'Failed to fetch followers' 
          });
        }
      },
      
      // Fetch following
      fetchFollowing: async () => {
        // Skip if it was fetched in the last 5 seconds (debounce)
        const now = Date.now();
        const lastFetched = get().lastFetched.following || 0;
        if (now - lastFetched < 5000 && get().following.length > 0) {
          return;
        }
        
        set(state => ({ 
          isLoading: true,
          lastFetched: {
            ...state.lastFetched,
            following: now
          }
        }));
        
        try {
          // Get the current user's ID from auth token
          const token = localStorage.getItem('token');
          if (!token) {
            throw new Error('Not authenticated');
          }
          
          // Parse JWT token to get current user ID
          const decodedToken = JSON.parse(atob(token.split('.')[1]));
          const currentUserId = decodedToken.id;
          
          const response = await apiClient.get(`/api/users/${currentUserId}/following`);
          
          // The API returns an object with 'following' key containing the actual following array
          const followingList = response.data.following || response.data;
          
          // Update relationship cache for each followed user
          if (Array.isArray(followingList)) {
            followingList.forEach((user: Connection) => {
              get().updateRelationship(user.id, {
                following: true
              });
            });
          }
          
          set({ 
            following: Array.isArray(followingList) ? followingList : [],
            isLoading: false,
            error: null
          });
        } catch (error: any) {
          console.error('Error fetching following:', error);
          set({ 
            isLoading: false, 
            error: error.response?.data?.error || 'Failed to fetch following' 
          });
        }
      },
      
      // Send connection request
      sendConnectionRequest: async (userId: string) => {
        set({ isLoading: true });
        try {
          const response = await apiClient.post(`/api/users/connect/${userId}`);
          
          // Update relationship cache
          get().updateRelationship(userId, {
            sentRequest: response.data.status || 'pending',
            connected: response.data.status === 'accepted'
          });
          
          set({ isLoading: false, error: null });
          
          // After sending a request, update the timestamp to force a refresh next time
          set(state => ({
            lastFetched: {
              ...state.lastFetched,
              connectionRequests: 0
            }
          }));
          
          return { status: response.data.status || 'pending' };
        } catch (error: any) {
          console.error('Error sending connection request:', error);
          set({ 
            isLoading: false, 
            error: error.response?.data?.error || 'Failed to send connection request' 
          });
          throw error;
        }
      },
      
      // Accept connection request
      acceptConnectionRequest: async (userId: string) => {
        set({ isLoading: true });
        try {
          await apiClient.post(`/api/users/connect/${userId}/accept`);
          
          // Update relationship cache
          get().updateRelationship(userId, {
            receivedRequest: null,
            connected: true
          });
          
          // Update the connection requests list
          const { connectionRequests } = get();
          set({
            connectionRequests: connectionRequests.filter(req => req.sender?.id !== userId),
            isLoading: false,
            error: null,
            // Reset timestamps to force refresh next time
            lastFetched: {
              ...get().lastFetched,
              connections: 0,
              connectionRequests: 0
            }
          });
          
          // Refresh connections list after a short delay
          setTimeout(() => {
            get().fetchConnections();
          }, 300);
          
        } catch (error: any) {
          console.error('Error accepting connection request:', error);
          set({ 
            isLoading: false, 
            error: error.response?.data?.error || 'Failed to accept connection request' 
          });
          throw error;
        }
      },
      
      // Decline connection request
      declineConnectionRequest: async (userId: string) => {
        set({ isLoading: true });
        try {
          await apiClient.post(`/api/users/connect/${userId}/decline`);
          
          // Update relationship cache
          get().updateRelationship(userId, {
            receivedRequest: null
          });
          
          // Update the connection requests list
          const { connectionRequests } = get();
          set({
            connectionRequests: connectionRequests.filter(req => req.sender?.id !== userId),
            isLoading: false,
            error: null
          });
        } catch (error: any) {
          console.error('Error declining connection request:', error);
          set({ 
            isLoading: false, 
            error: error.response?.data?.error || 'Failed to decline connection request' 
          });
          throw error;
        }
      },
      
      // Remove connection
      removeConnection: async (userId: string) => {
        set({ isLoading: true });
        try {
          await apiClient.delete(`/api/users/connections/${userId}`);
          
          // Update relationship cache
          get().updateRelationship(userId, {
            connected: false,
            sentRequest: null,
            receivedRequest: null
          });
          
          // Update connections list by removing the user
          const { connections } = get();
          set({
            connections: connections.filter(conn => conn.id !== userId),
            isLoading: false,
            error: null
          });
          
          // Force refresh of data on next fetch
          set(state => ({
            lastFetched: {
              ...state.lastFetched,
              connections: 0,
              connectionRequests: 0
            }
          }));
        } catch (error: any) {
          console.error('Error removing connection:', error);
          set({ 
            isLoading: false, 
            error: error.response?.data?.error || 'Failed to remove connection' 
          });
          throw error;
        }
      },
      
      // Follow a user
      followUser: async (userId: string) => {
        set({ isLoading: true });
        try {
          await apiClient.post(`/api/users/follow/${userId}`);
          
          // Update relationship cache
          get().updateRelationship(userId, {
            following: true
          });
          
          // Force refresh followers/following data
          set(state => ({
            isLoading: false, 
            error: null,
            lastFetched: {
              ...state.lastFetched,
              following: 0, // Force refresh next time
              followers: 0  // Also refresh followers
            }
          }));
          
          // Trigger an immediate refresh
          setTimeout(() => {
            get().fetchFollowing();
          }, 300);
          
        } catch (error: any) {
          console.error('Error following user:', error);
          set({ 
            isLoading: false, 
            error: error.response?.data?.error || 'Failed to follow user' 
          });
          throw error;
        }
      },
      
      // Unfollow a user
      unfollowUser: async (userId: string) => {
        set({ isLoading: true });
        try {
          await apiClient.delete(`/api/users/unfollow/${userId}`);
          
          // Update relationship cache
          get().updateRelationship(userId, {
            following: false
          });
          
          // Update following list and force refresh
          set(state => ({
            following: state.following.filter(f => f.id !== userId),
            isLoading: false,
            error: null,
            lastFetched: {
              ...state.lastFetched,
              following: 0, // Force refresh next time
              followers: 0  // Also refresh followers
            }
          }));
          
          // Trigger an immediate refresh
          setTimeout(() => {
            get().fetchFollowing();
          }, 300);
          
        } catch (error: any) {
          console.error('Error unfollowing user:', error);
          set({ 
            isLoading: false, 
            error: error.response?.data?.error || 'Failed to unfollow user' 
          });
          throw error;
        }
      },
      
      // Check relationship status with another user
      checkRelationship: async (userId: string) => {
        // Check cache first
        const cachedRelationship = get().getRelationship(userId);
        if (cachedRelationship) return cachedRelationship;
        
        try {
          const response = await apiClient.get(`/api/users/relationship/${userId}`);
          const relationshipData = {
            ...response.data,
            lastUpdated: Date.now()
          };
          
          // Update cache
          get().updateRelationship(userId, relationshipData);
          
          return relationshipData;
        } catch (error: any) {
          console.error('Error checking relationship status:', error);
          throw error;
        }
      },
      
      // Refresh all network data
      refreshNetworkData: async () => {
        set(state => ({
          lastFetched: {
            ...state.lastFetched,
            connectionRequests: 0,
            connections: 0,
            followers: 0,
            following: 0
          }
        }));
        
        try {
          await Promise.all([
            get().fetchConnectionRequests(),
            get().fetchConnections(),
            get().fetchFollowers(),
            get().fetchFollowing()
          ]);
        } catch (error) {
          console.error('Error refreshing network data:', error);
        }
      }
    }),
    {
      name: 'network-store',
      // Only persist these fields
      partialize: (state) => ({
        relationshipCache: state.relationshipCache
      })
    }
  )
); 