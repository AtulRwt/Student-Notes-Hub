import { useEffect, useState } from 'react';
import { useNotesStore } from '../../store/notesStore';
import { useTagsStore } from '../../store/tagsStore';
import NoteCard from './NoteCard';
import FilterBar from './FilterBar';

const NotesList = () => {
  const { notes, fetchNotes, isLoading, error } = useNotesStore();
  const { tags, fetchTags } = useTagsStore();
  
  const [filters, setFilters] = useState({
    search: '',
    semester: '',
    subject: ''
  });
  
  useEffect(() => {
    fetchNotes();
    fetchTags();
  }, [fetchNotes, fetchTags]);
  
  useEffect(() => {
    // Apply filters with debounce
    const timer = setTimeout(() => {
      fetchNotes(filters);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [filters, fetchNotes]);
  
  const handleFilterChange = (name: string, value: string) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  return (
    <div>
      <h1 className="gradient-text text-3xl font-bold mb-6">Browse Notes</h1>
      
      <FilterBar 
        filters={filters} 
        onFilterChange={handleFilterChange} 
        tags={tags} 
      />
      
      {isLoading && (
        <div className="text-center py-10">
          <p className="text-accent">Loading notes...</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-900/20 text-red-400 p-4 rounded-md mb-6 glass-light">
          <p>{error}</p>
        </div>
      )}
      
      {!isLoading && !error && notes.length === 0 && (
        <div className="text-center py-10 glass-light rounded-lg p-8">
          <p className="text-accent">No notes found matching your criteria.</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {notes.map((note) => (
          <NoteCard key={note.id} note={note} />
        ))}
      </div>
    </div>
  );
};

export default NotesList; 