import { create } from 'zustand';
import type { Note, NoteFormData } from '../types';
import { notesAPI } from '../services/api';

interface NotesState {
  notes: Note[];
  currentNote: Note | null;
  trendingNotes: Note[];
  popularTopics: { id: string; name: string; count: number }[];
  suggestedUsers: { id: string; name: string; profileImage: string | null; subject: string }[];
  isLoading: boolean;
  error: string | null;
  fetchNotes: (filters?: { 
    search?: string; 
    semester?: string; 
    subject?: string;
    course?: string;
    resourceType?: string;
  }) => Promise<void>;
  fetchNoteById: (id: string) => Promise<void>;
  fetchTrendingNotes: () => Promise<void>;
  fetchPopularTopics: () => Promise<void>;
  fetchSuggestedUsers: () => Promise<void>;
  createNote: (data: NoteFormData) => Promise<void>;
  updateNote: (id: string, data: NoteFormData) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  addComment: (noteId: string, content: string) => Promise<void>;
}

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  currentNote: null,
  trendingNotes: [],
  popularTopics: [],
  suggestedUsers: [],
  isLoading: false,
  error: null,

  fetchNotes: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const response = await notesAPI.getNotes(filters);
      set({ 
        notes: response.results,
        isLoading: false 
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.error || 'Failed to fetch notes'
      });
    }
  },

  fetchNoteById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const note = await notesAPI.getNoteById(id);
      set({ currentNote: note, isLoading: false });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.error || 'Failed to fetch note'
      });
    }
  },

  fetchTrendingNotes: async () => {
    try {
      const trendingNotes = await notesAPI.getTrendingNotes();
      set({ trendingNotes });
    } catch (error: any) {
      console.error('Failed to fetch trending notes:', error);
    }
  },

  fetchPopularTopics: async () => {
    try {
      const popularTopics = await notesAPI.getPopularTopics();
      set({ popularTopics });
    } catch (error: any) {
      console.error('Failed to fetch popular topics:', error);
    }
  },

  fetchSuggestedUsers: async () => {
    try {
      const suggestedUsers = await notesAPI.getSuggestedUsers();
      set({ suggestedUsers });
    } catch (error: any) {
      console.error('Failed to fetch suggested users:', error);
    }
  },

  createNote: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const newNote = await notesAPI.createNote(data);
      set((state) => ({
        notes: [newNote, ...state.notes],
        isLoading: false
      }));
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.error || 'Failed to create note'
      });
      throw error;
    }
  },

  updateNote: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const updatedNote = await notesAPI.updateNote(id, data);
      const { notes, currentNote } = get();
      
      set({
        notes: notes.map(note => note.id === id ? updatedNote : note),
        currentNote: currentNote && currentNote.id === id ? updatedNote : currentNote,
        isLoading: false
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.error || 'Failed to update note'
      });
      throw error;
    }
  },

  deleteNote: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await notesAPI.deleteNote(id);
      const { notes, currentNote } = get();
      
      set({
        notes: notes.filter(note => note.id !== id),
        currentNote: currentNote && currentNote.id === id ? null : currentNote,
        isLoading: false
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.error || 'Failed to delete note'
      });
    }
  },

  toggleFavorite: async (id) => {
    try {
      const { action } = await notesAPI.toggleFavorite(id);
      const { notes, currentNote } = get();
      
      // Update the count in notes list
      const updatedNotes = notes.map(note => {
        if (note.id === id && note._count) {
          return {
            ...note,
            _count: {
              ...note._count,
              favorites: action === 'added' 
                ? (note._count.favorites + 1) 
                : (note._count.favorites - 1)
            }
          };
        }
        return note;
      });
      
      // Update current note if it's the one being favorited
      let updatedCurrentNote = currentNote;
      if (currentNote && currentNote.id === id && currentNote._count) {
        updatedCurrentNote = {
          ...currentNote,
          _count: {
            ...currentNote._count,
            favorites: action === 'added' 
              ? (currentNote._count.favorites + 1) 
              : (currentNote._count.favorites - 1)
          }
        };
      }
      
      set({
        notes: updatedNotes,
        currentNote: updatedCurrentNote
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to update favorite'
      });
    }
  },

  addComment: async (noteId, content) => {
    try {
      const newComment = await notesAPI.addComment(noteId, content);
      const { currentNote } = get();
      
      if (currentNote && currentNote.id === noteId) {
        set({
          currentNote: {
            ...currentNote,
            comments: [newComment, ...(currentNote.comments || [])],
            _count: currentNote._count 
              ? {
                  ...currentNote._count,
                  comments: (currentNote._count.comments || 0) + 1
                }
              : { favorites: 0, comments: 1, upvotes: 0, annotations: 0 }
          }
        });
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to add comment'
      });
    }
  }
})); 