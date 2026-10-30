import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useNotesStore } from '../../store/notesStore';
import { useAuthStore } from '../../store/authStore';
import type { Comment } from '../../types';
import { formatRelativeTime } from '../../utils/formatDate';
import { Link } from 'react-router-dom';

interface CommentSectionProps {
  noteId: string;
  comments: Comment[];
}

const CommentSection = ({ noteId, comments }: CommentSectionProps) => {
  const { isAuthenticated } = useAuthStore();
  const { addComment } = useNotesStore();
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!commentText.trim()) return;
    
    setIsSubmitting(true);
    try {
      await addComment(noteId, commentText);
      setCommentText('');
      toast.success('Comment added successfully');
    } catch (error) {
      toast.error('Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="glass rounded-lg p-6">
      <h2 className="gradient-text text-xl font-bold mb-4">Comments ({comments.length})</h2>
      
      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="mb-4">
            <textarea
              className="bg-dark-lighter border border-dark-accent rounded-md px-3 py-2 w-full text-light focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-transparent min-h-[100px]"
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="gradient-border bg-dark px-4 py-2 rounded-md text-light hover:bg-dark-light transition-colors"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Posting...' : 'Post Comment'}
          </button>
        </form>
      ) : (
        <div className="glass-light p-4 rounded-md mb-6">
          <p className="text-center text-light">
            Please <Link to="/login" className="text-blue-400 hover:text-blue-300">login</Link> to leave a comment
          </p>
        </div>
      )}
      
      {comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="border-b border-dark-accent/30 pb-4 last:border-b-0">
              <div className="flex justify-between items-start mb-2">
                <span className="font-semibold text-blue-400">{comment.user.name}</span>
                <span className="text-sm text-accent">
                  {formatRelativeTime(new Date(comment.createdAt))}
                </span>
              </div>
              <p className="text-light whitespace-pre-line">{comment.content}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-accent py-4">No comments yet. Be the first to comment!</p>
      )}
    </div>
  );
};

export default CommentSection; 