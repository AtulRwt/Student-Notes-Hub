import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import NoteForm from '../components/notes/NoteForm';
import { useNotesStore } from '../store/notesStore';
import { useAuthStore } from '../store/authStore';

const EditNotePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentNote, fetchNoteById, isLoading, error } = useNotesStore();
  const { user } = useAuthStore();
  
  useEffect(() => {
    if (id) {
      fetchNoteById(id);
    }
  }, [id, fetchNoteById]);
  
  // Check if the user is the owner of the note
  useEffect(() => {
    if (currentNote && user && currentNote.userId !== user.id) {
      toast.error('You do not have permission to edit this note');
      navigate('/notes');
    }
  }, [currentNote, user, navigate]);
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Loading note details...</p>
        </div>
      </div>
    );
  }
  
  if (error || !currentNote) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 text-red-700 p-4 rounded-md">
          <p>{error || 'Note not found'}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <NoteForm initialData={currentNote} isEditing={true} />
    </div>
  );
};

export default EditNotePage; 