import axios from 'axios';
import type { 
  LoginData, 
  RegisterData, 
  AuthResponse, 
  Note,
  NoteFormData,
  Comment,
  Tag,
  ProfileUpdateData,
  User,
  FeedbackFormData
} from '../types';

const API_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  try {
    // First try direct token from localStorage
    let token = localStorage.getItem('token');
    
    // If not found, try auth-storage
    if (!token) {
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        const { state } = JSON.parse(authStorage);
        token = state?.token;
      }
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Error accessing token:', error);
  }
  return config;
});

// Auth API
export const authAPI = {
  // Register user
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  // Login user
  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  // Get current user
  getCurrentUser: async (): Promise<{ user: AuthResponse['user'] }> => {
    const response = await api.get<{ user: AuthResponse['user'] }>('/auth/me');
    return response.data;
  },
  
  // Update user profile
  updateProfile: async (data: ProfileUpdateData): Promise<User> => {
    const formData = new FormData();
    
    // Add text fields
    if (data.name) formData.append('name', data.name);
    if (data.bio) formData.append('bio', data.bio);
    if (data.education) formData.append('education', data.education);
    if (data.interests) formData.append('interests', JSON.stringify(data.interests));
    if (data.socialLinks) formData.append('socialLinks', JSON.stringify(data.socialLinks));
    
    // Add profile image if exists
    if (data.profileImage) {
      console.log('Uploading profile image:', data.profileImage);
      formData.append('profileImage', data.profileImage);
    }
    
    console.log('Updating profile with data:', data);
    
    const response = await api.put<User>('/auth/profile', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    console.log('Profile update response:', response.data);
    if (response.data.profileImage) {
      console.log('New profile image URL:', response.data.profileImage);
    }
    
    return response.data;
  }
};

// Notes API
export const notesAPI = {
  // Get all notes with optional filters
  getNotes: async (filters?: { 
    search?: string; 
    semester?: string; 
    subject?: string;
    course?: string;
    resourceType?: string;
  }): Promise<{
    results: Note[];
    totalCount: number;
    searchPerformed: boolean;
  }> => {
    const params: any = { ...filters };
    
    // If resourceType is provided, adjust the search parameter to include it
    if (params.resourceType) {
      params.search = params.search ? `${params.search} ${params.resourceType}` : params.resourceType;
      delete params.resourceType; // Remove resourceType as it's not a backend filter
    }
    
    const response = await api.get<{
      results: Note[];
      totalCount: number;
      searchPerformed: boolean;
    }>('/notes', { params });
    return response.data;
  },

  // Get note by id
  getNoteById: async (id: string): Promise<Note> => {
    const response = await api.get<Note>(`/notes/${id}`);
    return response.data;
  },

  // Create note
  createNote: async (data: NoteFormData): Promise<Note> => {
    console.log('Creating note with data:', {
      title: data.title,
      description: data.description,
      externalUrl: data.externalUrl || 'none',
      semester: data.semester,
      courseId: data.courseId,
      tags: data.tags,
      hasFile: data.file !== null,
      fileType: data.file?.type,
      fileName: data.file?.name,
      fileSize: data.file?.size
    });
    
    const formData = new FormData();
    
    // Add text fields
    formData.append('title', data.title);
    formData.append('description', data.description);
    if (data.externalUrl) formData.append('externalUrl', data.externalUrl);
    formData.append('semester', data.semester);
    if (data.courseId) formData.append('courseId', data.courseId);
    formData.append('tags', JSON.stringify(data.tags));
    
    // Add file if exists
    if (data.file) {
      console.log('Appending file to form data:', data.file.name, data.file.type, data.file.size);
      formData.append('file', data.file);
      
      // Log form data content
      console.log('Form data entries:');
      for (const [key, value] of formData.entries()) {
        if (key === 'file') {
          console.log('- file:', (value as File).name, (value as File).type, (value as File).size);
        } else {
          console.log(`- ${key}:`, value);
        }
      }
    }
    
    try {
      // Use a timeout of 30 seconds for large file uploads
      const response = await api.post<Note>('/notes', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 second timeout
      });
      console.log('Note creation response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Note creation error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Update note
  updateNote: async (id: string, data: NoteFormData): Promise<Note> => {
    const formData = new FormData();
    
    // Add text fields
    if (data.title) formData.append('title', data.title);
    if (data.description) formData.append('description', data.description);
    if (data.externalUrl) formData.append('externalUrl', data.externalUrl);
    if (data.semester) formData.append('semester', data.semester);
    if (data.tags) formData.append('tags', JSON.stringify(data.tags));
    
    // Add file if exists
    if (data.file) formData.append('file', data.file);
    
    const response = await api.put<Note>(`/notes/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },

  // Delete note
  deleteNote: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/notes/${id}`);
    return response.data;
  },

  // Toggle favorite
  toggleFavorite: async (id: string): Promise<{ action: 'added' | 'removed' }> => {
    const response = await api.post<{ action: 'added' | 'removed' }>(`/notes/${id}/favorite`);
    return response.data;
  },

  // Add comment
  addComment: async (noteId: string, content: string): Promise<Comment> => {
    const response = await api.post<Comment>(`/notes/${noteId}/comments`, { content });
    return response.data;
  },

  // Get trending notes
  getTrendingNotes: async (): Promise<Note[]> => {
    try {
      // In a real app, this would be a dedicated endpoint
      // For now, we'll use the existing endpoint and sort on the client
      const response = await api.get<{
        results: Note[];
        totalCount: number;
        searchPerformed: boolean;
      }>('/notes');
      
      // Sort by number of favorites and comments
      return response.data.results
        .sort((a, b) => {
          const aScore = (a._count?.favorites || 0) + (a._count?.comments || 0);
          const bScore = (b._count?.favorites || 0) + (b._count?.comments || 0);
          return bScore - aScore;
        })
        .slice(0, 5);
    } catch (error) {
      console.error('Error fetching trending notes:', error);
      return [];
    }
  },

  // Get popular topics
  getPopularTopics: async (): Promise<{ id: string; name: string; count: number }[]> => {
    try {
      // In a real app, this would be a dedicated endpoint
      // For now, we'll use the existing tags endpoint and calculate frequency
      const response = await api.get<{
        results: Note[];
        totalCount: number;
        searchPerformed: boolean;
      }>('/notes');
      const notes = response.data.results;
      
      // Count tag occurrences
      const tagCounts: Record<string, { id: string; name: string; count: number }> = {};
      
      notes.forEach(note => {
        note.tags.forEach(tagRelation => {
          const { tag } = tagRelation;
          if (tagCounts[tag.id]) {
            tagCounts[tag.id].count += 1;
          } else {
            tagCounts[tag.id] = { id: tag.id, name: tag.name, count: 1 };
          }
        });
      });
      
      // Convert to array and sort by count
      return Object.values(tagCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);
    } catch (error) {
      console.error('Error calculating popular topics:', error);
      return [];
    }
  },

  // Get suggested users
  getSuggestedUsers: async (): Promise<{ id: string; name: string; profileImage: string | null; subject: string }[]> => {
    try {
      // In a real app, this would be a dedicated endpoint
      // For now, we'll extract users from notes
      const response = await api.get<{
        results: Note[];
        totalCount: number;
        searchPerformed: boolean;
      }>('/notes');
      const notes = response.data.results;
      
      // Find unique users who have contributed
      const userMap = new Map();
      
      notes.forEach(note => {
        if (!userMap.has(note.user.id)) {
          // Find a subject from their tags
          const subject = note.tags.length > 0 
            ? note.tags[0].tag.name 
            : note.course?.name || 'Academic Content';
          
          userMap.set(note.user.id, {
            id: note.user.id,
            name: note.user.name,
            profileImage: note.user.profileImage || null,
            subject
          });
        }
      });
      
      // Convert to array, randomize, and take top 3
      return Array.from(userMap.values())
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);
    } catch (error) {
      console.error('Error finding suggested users:', error);
      return [];
    }
  }
};

// Tags API
export const tagsAPI = {
  // Get all tags
  getTags: async (): Promise<Tag[]> => {
    const response = await api.get<Tag[]>('/tags');
    return response.data;
  },

  // Get notes by tag
  getNotesByTag: async (tagId: string): Promise<Note[]> => {
    const response = await api.get<Note[]>(`/tags/${tagId}/notes`);
    return response.data;
  }
};

// Feedback API
export const feedbackAPI = {
  // Submit feedback
  submitFeedback: async (data: FeedbackFormData): Promise<{ success: boolean; message: string; data: any }> => {
    const response = await api.post<{ success: boolean; message: string; data: any }>('/feedback', data);
    return response.data;
  },
  
  // Get all feedback (requires auth)
  getAllFeedback: async (): Promise<any[]> => {
    const response = await api.get<any[]>('/feedback');
    return response.data;
  }
};

// Settings API
export const settingsAPI = {
  // Get all user settings
  getSettings: async (): Promise<any> => {
    const response = await api.get('/settings');
    return response.data;
  },
  
  // Update account settings with better error handling
  updateAccount: async (data: { 
    email?: string; 
    password?: { oldPassword: string; newPassword: string } 
  }): Promise<any> => {
    try {
      // Log what we're trying to update (without revealing actual passwords)
      const updateTypes = [];
      if (data.email) updateTypes.push('email');
      if (data.password) updateTypes.push('password');
      console.log(`Updating account settings: ${updateTypes.join(', ')}`);
      
      const response = await api.patch('/settings/account', data);
      return response.data;
    } catch (error: any) {
      console.error('Account update error:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Update notification settings
  updateNotifications: async (data: {
    emailNotifications?: boolean;
    newComments?: boolean;
    newFollowers?: boolean;
    connectionRequests?: boolean;
    notesFromFollowing?: boolean;
    systemAnnouncements?: boolean;
  }): Promise<any> => {
    const response = await api.patch('/settings/notifications', data);
    return response.data;
  },
  
  // Update appearance settings
  updateAppearance: async (data: {
    theme?: 'dark' | 'light';
    fontSize?: 'small' | 'medium' | 'large';
    reducedMotion?: boolean;
    highContrast?: boolean;
  }): Promise<any> => {
    const response = await api.patch('/settings/appearance', data);
    return response.data;
  },
  
  // Update security settings
  updateSecurity: async (data: {
    twoFactorAuth?: boolean;
    loginAlerts?: boolean;
    sessionTimeout?: string;
  }): Promise<any> => {
    const response = await api.patch('/settings/security', data);
    return response.data;
  }
};