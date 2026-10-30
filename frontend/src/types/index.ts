export interface User {
  id: string;
  email: string;
  name: string;
  profileImage: string | null;
  bio?: string;
  education?: string;
  interests?: string[];
  academicPortfolio?: {
    expertise: string[];
    courses: string[];
    achievements: string[];
  };
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    github?: string;
  };
  stats?: {
    notesUploaded: number;
    notesViewed: number;
    upvotesReceived: number;
    commentsReceived: number;
    commentsGiven: number;
  };
  badges?: Badge[];
  studyGroups?: StudyGroup[];
  joinedAt?: string;
  _count?: {
    notes: number;
    followers: number;
    following: number;
  };
}

export interface Tag {
  id: string;
  name: string;
}

export interface NoteTag {
  tagId: string;
  noteId: string;
  tag: Tag;
}

export interface Note {
  id: string;
  title: string;
  description: string;
  fileUrl: string | null;
  externalUrl: string | null;
  semester: string;
  courseId?: string;
  course?: Course;
  aiSummary?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  user: {
    id: string;
    name: string;
    profileImage?: string;
  };
  tags: NoteTag[];
  comments?: Comment[];
  upvotes?: number;
  annotations?: Annotation[];
  isFeatured?: boolean;
  viewCount?: number;
  downloadCount?: number;
  isCollaborative?: boolean;
  collaborators?: {
    id: string;
    name: string;
    profileImage?: string;
  }[];
  inCollections?: number;
  _count?: {
    favorites: number;
    comments: number;
    upvotes: number;
    annotations: number;
  };
  _relevance?: number;
}

export interface Comment {
  id: string;
  content: string;
  userId: string;
  noteId: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    profileImage?: string;
  };
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface NoteFormData {
  title: string;
  description: string;
  externalUrl?: string;
  semester: string;
  courseId: string;
  resourceType: ResourceType;
  tags: string[];
  file?: File | null;
}

export interface ProfileUpdateData {
  name: string;
  bio?: string;
  education?: string;
  interests?: string[];
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    github?: string;
  };
  profileImage?: File | null;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  department: string;
  color?: string;
}

export type ResourceType = 
  | 'lecture_notes'
  | 'study_guide'
  | 'past_exam'
  | 'academic_paper'
  | 'video_lecture'
  | 'flashcards'
  | 'problem_set'
  | 'code_repo';

export const RESOURCE_TYPES: Record<ResourceType, string> = {
  lecture_notes: 'Lecture Notes',
  study_guide: 'Study Guide',
  past_exam: 'Past Exam/PYQ',
  academic_paper: 'Academic Paper',
  video_lecture: 'Video Lecture',
  flashcards: 'Flashcards',
  problem_set: 'Problem Set',
  code_repo: 'Code Repository'
};

export const RESOURCE_COLORS: Record<ResourceType, string> = {
  lecture_notes: '#3b82f6', // blue
  study_guide: '#10b981', // green
  past_exam: '#ef4444', // red
  academic_paper: '#8b5cf6', // purple
  video_lecture: '#f59e0b', // amber
  flashcards: '#ec4899', // pink
  problem_set: '#6366f1', // indigo
  code_repo: '#0ea5e9' // sky
};

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
}

export interface StudyGroup {
  id: string;
  name: string;
  description: string;
  members: number;
  isAdmin: boolean;
  course?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Annotation {
  id: string;
  content: string;
  pageNumber?: number;
  position?: {
    x: number;
    y: number;
  };
  userId: string;
  user: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  userId: string;
  user: {
    id: string;
    name: string;
  };
  notes: {
    id: string;
    note: Note;
  }[];
  createdAt: string;
  updatedAt: string;
}

// Feedback types
export interface FeedbackFormData {
  name: string;
  email: string;
  message: string;
  category?: string;
  rating?: number;
}

// Settings types
export interface NotificationSettings {
  emailNotifications: boolean;
  newComments: boolean;
  newFollowers: boolean;
  connectionRequests: boolean;
  notesFromFollowing: boolean;
  systemAnnouncements: boolean;
}

export interface AppearanceSettings {
  theme: 'dark' | 'light';
  fontSize: 'small' | 'medium' | 'large';
  reducedMotion: boolean;
  highContrast: boolean;
}

export interface SecuritySettings {
  twoFactorAuth: boolean;
  loginAlerts: boolean;
  sessionTimeout: string;
}

export interface UserSettings {
  id: string;
  userId: string;
  notifications: NotificationSettings;
  appearance: AppearanceSettings;
  security: SecuritySettings;
  createdAt: string;
  updatedAt: string;
} 