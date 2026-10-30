import { create } from 'zustand';
import type { Tag, Note } from '../types';
import { tagsAPI } from '../services/api';

interface TagsState {
  tags: Tag[];
  notesByTag: Note[];
  isLoading: boolean;
  error: string | null;
  fetchTags: () => Promise<void>;
  fetchNotesByTag: (tagId: string) => Promise<void>;
}

export const useTagsStore = create<TagsState>((set) => ({
  tags: [],
  notesByTag: [],
  isLoading: false,
  error: null,

  fetchTags: async () => {
    set({ isLoading: true, error: null });
    try {
      const tags = await tagsAPI.getTags();
      set({ tags, isLoading: false });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.error || 'Failed to fetch tags'
      });
    }
  },

  fetchNotesByTag: async (tagId) => {
    set({ isLoading: true, error: null, notesByTag: [] });
    try {
      const notes = await tagsAPI.getNotesByTag(tagId);
      set({ notesByTag: notes, isLoading: false });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.error || 'Failed to fetch notes by tag'
      });
    }
  }
})); 