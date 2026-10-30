import { useState } from 'react';
import { FaThumbsUp, FaComment, FaShare, FaBookmark, FaPlus } from 'react-icons/fa';
import type { Note, User, Comment } from '../../types';
import Avatar from '../shared/Avatar';

interface NoteEngagementProps {
  note: Note;
  currentUser?: User;
  onUpvote?: (noteId: string) => void;
  onComment?: (noteId: string, content: string) => void;
  onAddToCollection?: (noteId: string) => void;
}

const NoteEngagement = ({ 
  note, 
  currentUser, 
  onUpvote, 
  onComment, 
  onAddToCollection 
}: NoteEngagementProps) => {
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);
  
  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim() && onComment) {
      onComment(note.id, commentText);
      setCommentText('');
    }
  };
  
  const isUpvoted = false; // In real app, check if user has upvoted this note
  
  return (
    <div className="space-y-4">
      {/* Engagement Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-4">
          <button 
            className={`flex items-center space-x-1 ${isUpvoted ? 'text-blue-400' : 'text-accent hover:text-blue-400'} transition-colors`}
            onClick={() => onUpvote && onUpvote(note.id)}
            disabled={!currentUser}
            title={currentUser ? 'Upvote this note' : 'Login to upvote'}
          >
            <FaThumbsUp />
            <span>{note._count?.upvotes || 0}</span>
          </button>
          
          <button 
            className="flex items-center space-x-1 text-accent hover:text-blue-400 transition-colors"
            onClick={() => setShowComments(!showComments)}
          >
            <FaComment />
            <span>{note._count?.comments || 0}</span>
          </button>
          
          <button 
            className="flex items-center space-x-1 text-accent hover:text-blue-400 transition-colors"
            title="Share this note"
          >
            <FaShare />
          </button>
        </div>
        
        <div className="flex space-x-2">
          <button 
            className="flex items-center space-x-1 text-accent hover:text-blue-400 transition-colors"
            onClick={() => onAddToCollection && onAddToCollection(note.id)}
            disabled={!currentUser}
            title={currentUser ? 'Add to collection' : 'Login to save'}
          >
            <FaPlus size={14} />
            <FaBookmark size={14} />
          </button>
        </div>
      </div>
      
      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-dark-accent pt-4">
          <h3 className="font-bold mb-4">Comments</h3>
          
          {/* Comment Form */}
          {currentUser ? (
            <form onSubmit={handleSubmitComment} className="mb-6">
              <div className="flex items-start space-x-2">
                <Avatar 
                  src={currentUser.profileImage || null} 
                  alt={currentUser.name}
                  size="sm"
                />
                
                <div className="flex-1">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="w-full p-2 bg-dark-lighter border border-dark-accent rounded-md text-light focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none"
                    placeholder="Add a comment..."
                    rows={3}
                  />
                  
                  <div className="flex justify-end mt-2">
                    <button
                      type="submit"
                      disabled={!commentText.trim()}
                      className="gradient-border bg-dark px-4 py-1 rounded-md font-medium hover:bg-dark-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Comment
                    </button>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <div className="text-center py-3 mb-4 glass-light rounded-md">
              <p className="text-accent">Please login to comment</p>
            </div>
          )}
          
          {/* Comments List */}
          <div className="space-y-4">
            {note.comments && note.comments.length > 0 ? (
              note.comments.map((comment) => (
                <CommentItem key={comment.id} comment={comment} />
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-accent">No comments yet. Be the first to comment!</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface CommentItemProps {
  comment: Comment;
}

const CommentItem = ({ comment }: CommentItemProps) => {
  return (
    <div className="flex space-x-3">
      <Avatar 
        src={comment.user.profileImage || null} 
        alt={comment.user.name}
        size="sm"
      />
      
      <div className="flex-1">
        <div className="glass-light p-3 rounded-md">
          <div className="flex justify-between items-start">
            <span className="font-bold text-sm">{comment.user.name}</span>
            <span className="text-xs text-accent">{new Date(comment.createdAt).toLocaleDateString()}</span>
          </div>
          <p className="text-sm mt-1">{comment.content}</p>
        </div>
        
        <div className="flex items-center mt-1 ml-2 space-x-4 text-xs">
          <button className="text-accent hover:text-blue-400 transition-colors">Like</button>
          <button className="text-accent hover:text-blue-400 transition-colors">Reply</button>
        </div>
      </div>
    </div>
  );
};

export default NoteEngagement; 