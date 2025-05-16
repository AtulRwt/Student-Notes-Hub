import { Link } from 'react-router-dom';
import { FaFilePdf, FaFileWord, FaFileExcel, FaFileImage, FaFile, FaExternalLinkAlt, FaComment, FaStar, FaRegStar, FaThumbsUp, FaBookmark, FaBookOpen } from 'react-icons/fa';
import { useAuthStore } from '../../store/authStore';
import { useNotesStore } from '../../store/notesStore';
import type { Note, ResourceType, Course } from '../../types';
import { formatDate } from '../../utils/formatDate';
import { RESOURCE_COLORS, RESOURCE_TYPES } from '../../types';
import Avatar from '../shared/Avatar';

// Course data with appropriate semester counts
const COURSES: Record<string, Course> = {
  // Undergraduate Courses
  'bsc-cs': { id: 'bsc-cs', name: 'B.Sc. Computer Science', code: 'BSC-CS', department: 'Science', color: '#3b82f6' },
  'btech-it': { id: 'btech-it', name: 'B.Tech. Information Technology', code: 'BTECH-IT', department: 'Engineering', color: '#0ea5e9' },
  'bcom-gen': { id: 'bcom-gen', name: 'B.Com. General', code: 'BCOM', department: 'Commerce', color: '#10b981' },
  'bcom-ca': { id: 'bcom-ca', name: 'B.Com. Computer Applications', code: 'BCOM-CA', department: 'Commerce', color: '#14b8a6' },
  'ba-eng': { id: 'ba-eng', name: 'B.A. English', code: 'BA-ENG', department: 'Arts', color: '#f59e0b' },
  'ba-hist': { id: 'ba-hist', name: 'B.A. History', code: 'BA-HIS', department: 'Arts', color: '#d97706' },
  'ba-eco': { id: 'ba-eco', name: 'B.A. Economics', code: 'BA-ECO', department: 'Arts', color: '#ef4444' },
  'ba-soc': { id: 'ba-soc', name: 'B.A. Sociology', code: 'BA-SOC', department: 'Arts', color: '#dc2626' },
  'bba': { id: 'bba', name: 'BBA (Bachelor of Business Admin.)', code: 'BBA', department: 'Business', color: '#8b5cf6' },
  'bca': { id: 'bca', name: 'BCA (Bachelor of Computer Apps.)', code: 'BCA', department: 'Computer Applications', color: '#6366f1' },
  
  // Postgraduate Courses
  'msc-cs': { id: 'msc-cs', name: 'M.Sc. Computer Science', code: 'MSC-CS', department: 'Science', color: '#3b82f6' },
  'mtech-cs': { id: 'mtech-cs', name: 'M.Tech. Computer Science', code: 'MTECH-CS', department: 'Engineering', color: '#0ea5e9' },
  'mtech-it': { id: 'mtech-it', name: 'M.Tech. Information Technology', code: 'MTECH-IT', department: 'Engineering', color: '#0891b2' },
  'mcom-gen': { id: 'mcom-gen', name: 'M.Com. General', code: 'MCOM', department: 'Commerce', color: '#10b981' },
  'mcom-fin': { id: 'mcom-fin', name: 'M.Com. Finance', code: 'MCOM-FIN', department: 'Commerce', color: '#059669' },
  'mcom-ca': { id: 'mcom-ca', name: 'M.Com. Computer Applications', code: 'MCOM-CA', department: 'Commerce', color: '#14b8a6' },
  'ma-eng': { id: 'ma-eng', name: 'M.A. English', code: 'MA-ENG', department: 'Arts', color: '#f59e0b' },
  'ma-hist': { id: 'ma-hist', name: 'M.A. History', code: 'MA-HIS', department: 'Arts', color: '#d97706' },
  'ma-eco': { id: 'ma-eco', name: 'M.A. Economics', code: 'MA-ECO', department: 'Arts', color: '#ef4444' },
  'ma-soc': { id: 'ma-soc', name: 'M.A. Sociology', code: 'MA-SOC', department: 'Arts', color: '#dc2626' },
  'mba': { id: 'mba', name: 'MBA (Master of Business Admin.)', code: 'MBA', department: 'Business', color: '#8b5cf6' },
  'mca': { id: 'mca', name: 'MCA (Master of Computer Apps.)', code: 'MCA', department: 'Computer Applications', color: '#6366f1' },
};

interface NoteCardProps {
  note: Note;
  searchTerm?: string;
}

// Helper function to highlight search terms in text
const highlightText = (text: string, searchTerm?: string) => {
  if (!searchTerm || searchTerm.trim() === '') {
    return text;
  }
  
  // Handle quoted search terms
  let termToUse = searchTerm;
  if (searchTerm.startsWith('"') && searchTerm.endsWith('"')) {
    termToUse = searchTerm.slice(1, -1);
  }
  
  // Split search into terms
  const terms = termToUse.trim().toLowerCase().split(/\s+/);
  
  // Replace each term in the text with a highlighted version
  let highlightedText = text;
  
  terms.forEach(term => {
    // Skip terms that are too short
    if (term.length <= 1) return;
    
    // Create a regex that matches the term with case insensitivity
    // Use word boundaries to match whole words only if the term is more than 3 characters
    const regex = term.length > 3 
      ? new RegExp(`\\b(${term})`, 'gi')
      : new RegExp(`(${term})`, 'gi');
    
    highlightedText = highlightedText.replace(
      regex, 
      '<mark style="background-color: rgba(59, 130, 246, 0.2); color: #60a5fa; padding: 0 2px; border-radius: 2px;">$1</mark>'
    );
  });
  
  return highlightedText;
};

const NoteCard = ({ note, searchTerm }: NoteCardProps) => {
  const { isAuthenticated } = useAuthStore();
  const { toggleFavorite } = useNotesStore();
  
  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAuthenticated) {
      toggleFavorite(note.id);
    }
  };
  
  // Get course information
  const courseInfo = note.courseId ? COURSES[note.courseId] : null;
  
  // Determine if note has file or external link
  const hasFile = !!note.fileUrl;
  const hasLink = !!note.externalUrl;
  
  // Determine file type from fileUrl
  const getFileType = () => {
    if (!note.fileUrl) return { icon: FaFile, label: 'File', color: 'text-gray-400' };
    
    const fileExt = note.fileUrl.split('.').pop()?.toLowerCase();
    
    if (fileExt === 'pdf') {
      return { icon: FaFilePdf, label: 'PDF', color: 'text-red-500' };
    } else if (['doc', 'docx'].includes(fileExt || '')) {
      return { icon: FaFileWord, label: 'Word', color: 'text-blue-500' };
    } else if (['xls', 'xlsx'].includes(fileExt || '')) {
      return { icon: FaFileExcel, label: 'Excel', color: 'text-green-500' };
    } else if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExt || '')) {
      return { icon: FaFileImage, label: 'Image', color: 'text-purple-500' };
    } else {
      return { icon: FaFile, label: 'File', color: 'text-gray-400' };
    }
  };
  
  const fileType = hasFile ? getFileType() : null;
  
  // Get resource type display name and color (fallback to lecture_notes if not set)
  const resourceType = 'lecture_notes' as ResourceType;
  const resourceColor = RESOURCE_COLORS[resourceType] || '#3b82f6';
  const resourceLabel = RESOURCE_TYPES[resourceType] || 'Lecture Notes';
  
  // Highlighted title and description with search term
  const highlightedTitle = searchTerm 
    ? <span dangerouslySetInnerHTML={{ __html: highlightText(note.title, searchTerm) }} />
    : note.title;
    
  const highlightedDescription = searchTerm
    ? <span dangerouslySetInnerHTML={{ __html: highlightText(note.description, searchTerm) }} />
    : note.description;
  
  // Relevance score if provided by the search
  const hasRelevanceScore = note._relevance !== undefined;
  
  return (
    <div className="w-full">
      {/* Header with user info */}
      <div className="flex items-center p-4 border-b border-dark-accent/20">
        <Avatar 
          src={note.user.profileImage || null} 
          alt={note.user.name}
          className="mr-3"
        />
        
        <div className="flex-1">
          <p className="font-medium text-sm">{note.user.name}</p>
          <div className="flex items-center">
            <span className="text-xs text-accent">{formatDate(new Date(note.createdAt))}</span>
            <span className="mx-1 text-accent">•</span>
            <span className="text-xs text-accent">Semester: {note.semester}</span>
          </div>
        </div>
        
        {/* Resource type indicator */}
        <span 
          className="text-xs px-2 py-1 rounded-md font-medium"
          style={{ backgroundColor: resourceColor, color: '#1a1a2e' }}
        >
          {resourceLabel}
        </span>
      </div>
      
      {/* Main content */}
      <Link to={`/notes/${note.id}`}>
        <div className="p-4">
          <h3 className="text-lg font-bold text-light mb-2">{highlightedTitle}</h3>
          
          {/* Course information */}
          {courseInfo && (
            <div className="flex items-center mb-2 p-2 rounded" style={{ backgroundColor: `${courseInfo.color}15` }}>
              <FaBookOpen className="mr-1" style={{ color: courseInfo.color }} />
              <span style={{ color: courseInfo.color }} className="text-sm font-medium">
                {courseInfo.name} ({courseInfo.code})
              </span>
            </div>
          )}
          
          <p className="text-light-darker text-sm mb-4 line-clamp-3">{highlightedDescription}</p>
          
          {/* Tags - highlight matching tags */}
          <div className="flex flex-wrap gap-1 mb-3">
            {note.tags && note.tags.map((tagRel) => {
              const isTagHighlighted = searchTerm && 
                tagRel.tag.name.toLowerCase().includes(searchTerm.toLowerCase().replace(/"/g, ''));
              
              return (
                <span 
                  key={tagRel.tagId} 
                  className={`${
                    isTagHighlighted 
                      ? 'bg-blue-900/30 text-blue-400 border border-blue-800/30' 
                      : 'bg-dark-medium text-light'
                  } text-xs rounded-full px-2 py-1`}
                >
                  {tagRel.tag.name}
                </span>
              );
            })}
          </div>
          
          {/* Relevance indicator */}
          {hasRelevanceScore && (note._relevance ?? 0) > 3 && (
            <div className="flex items-center mb-2">
              <div className="h-1 bg-dark-medium rounded-full w-16 mr-2">
                <div 
                  className="h-1 bg-blue-500 rounded-full" 
                  style={{ width: `${Math.min(100, ((note._relevance ?? 0) / 10) * 100)}%` }}
                ></div>
              </div>
              <span className="text-xs text-accent">Relevance</span>
            </div>
          )}
          
          {/* File type indicators */}
          <div className="flex items-center text-xs">
            {hasFile && fileType && (
              <span className={`flex items-center mr-3 ${fileType.color}`} title={`${fileType.label} available`}>
                <fileType.icon className="mr-1" /> {fileType.label}
              </span>
            )}
            
            {hasLink && (
              <span className="flex items-center text-blue-400" title="External link">
                <FaExternalLinkAlt className="mr-1" /> Link
              </span>
            )}
          </div>
        </div>
      </Link>
      
      {/* Engagement footer */}
      <div className="border-t border-dark-accent/20 p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleToggleFavorite}
              className={`flex items-center space-x-1 ${isAuthenticated ? 'hover:text-blue-400' : 'cursor-not-allowed opacity-70'} transition-colors text-accent`}
              disabled={!isAuthenticated}
              title={isAuthenticated ? 'Add to favorites' : 'Login to favorite'}
            >
              {note._count && note._count.favorites > 0 ? (
                <FaStar className="text-blue-400" />
              ) : (
                <FaRegStar />
              )}
              <span>{note._count?.favorites || 0}</span>
            </button>
            
            <Link 
              to={`/notes/${note.id}`}
              className="flex items-center space-x-1 text-accent hover:text-blue-400 transition-colors"
            >
              <FaComment />
              <span>{note._count?.comments || 0}</span>
            </Link>
            
            <button 
              className="text-accent hover:text-blue-400 transition-colors"
              disabled={!isAuthenticated}
              title={isAuthenticated ? 'Upvote this note' : 'Login to upvote'}
            >
              <FaThumbsUp />
            </button>
          </div>
          
          <button 
            className="text-accent hover:text-blue-400 transition-colors"
            disabled={!isAuthenticated}
            title={isAuthenticated ? 'Save to collection' : 'Login to save'}
          >
            <FaBookmark />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoteCard; 