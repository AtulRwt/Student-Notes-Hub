import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FaExternalLinkAlt, FaStar, FaRegStar, FaEdit, FaTrash, FaDownload, FaBookOpen, FaGraduationCap,
  FaFilePdf, FaFileWord, FaFileExcel, FaFileImage, FaFile, FaShare
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { useNotesStore } from '../store/notesStore';
import { useAuthStore } from '../store/authStore';
import { formatDate } from '../utils/formatDate';
import CommentSection from '../components/notes/CommentSection';
import FileViewer from '../components/files/FileViewer';
import NoteSummary from '../components/notes/NoteSummary';
import ShareNoteModal from '../components/notes/ShareNoteModal';

// Course data with appropriate semester counts
const COURSES = {
  // Undergraduate Courses
  'bsc-cs': { name: 'B.Sc. Computer Science', code: 'BSC-CS', department: 'Science', color: '#3b82f6' },
  'btech-it': { name: 'B.Tech. Information Technology', code: 'BTECH-IT', department: 'Engineering', color: '#0ea5e9' },
  'bcom-gen': { name: 'B.Com. General', code: 'BCOM', department: 'Commerce', color: '#10b981' },
  'bcom-ca': { name: 'B.Com. Computer Applications', code: 'BCOM-CA', department: 'Commerce', color: '#14b8a6' },
  'ba-eng': { name: 'B.A. English', code: 'BA-ENG', department: 'Arts', color: '#f59e0b' },
  'ba-hist': { name: 'B.A. History', code: 'BA-HIS', department: 'Arts', color: '#d97706' },
  'ba-eco': { name: 'B.A. Economics', code: 'BA-ECO', department: 'Arts', color: '#ef4444' },
  'ba-soc': { name: 'B.A. Sociology', code: 'BA-SOC', department: 'Arts', color: '#dc2626' },
  'bba': { name: 'BBA (Bachelor of Business Admin.)', code: 'BBA', department: 'Business', color: '#8b5cf6' },
  'bca': { name: 'BCA (Bachelor of Computer Apps.)', code: 'BCA', department: 'Computer Applications', color: '#6366f1' },

  // Postgraduate Courses
  'msc-cs': { name: 'M.Sc. Computer Science', code: 'MSC-CS', department: 'Science', color: '#3b82f6' },
  'mtech-cs': { name: 'M.Tech. Computer Science', code: 'MTECH-CS', department: 'Engineering', color: '#0ea5e9' },
  'mtech-it': { name: 'M.Tech. Information Technology', code: 'MTECH-IT', department: 'Engineering', color: '#0891b2' },
  'mcom-gen': { name: 'M.Com. General', code: 'MCOM', department: 'Commerce', color: '#10b981' },
  'mcom-fin': { name: 'M.Com. Finance', code: 'MCOM-FIN', department: 'Commerce', color: '#059669' },
  'mcom-ca': { name: 'M.Com. Computer Applications', code: 'MCOM-CA', department: 'Commerce', color: '#14b8a6' },
  'ma-eng': { name: 'M.A. English', code: 'MA-ENG', department: 'Arts', color: '#f59e0b' },
  'ma-hist': { name: 'M.A. History', code: 'MA-HIS', department: 'Arts', color: '#d97706' },
  'ma-eco': { name: 'M.A. Economics', code: 'MA-ECO', department: 'Arts', color: '#ef4444' },
  'ma-soc': { name: 'M.A. Sociology', code: 'MA-SOC', department: 'Arts', color: '#dc2626' },
  'mba': { name: 'MBA (Master of Business Admin.)', code: 'MBA', department: 'Business', color: '#8b5cf6' },
  'mca': { name: 'MCA (Master of Computer Apps.)', code: 'MCA', department: 'Computer Applications', color: '#6366f1' },
};

const NoteDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentNote, fetchNoteById, toggleFavorite, deleteNote, isLoading, error } = useNotesStore();
  const { user, isAuthenticated } = useAuthStore();
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    if (id) {
      fetchNoteById(id);
    }
  }, [id, fetchNoteById]);

  const handleToggleFavorite = () => {
    if (isAuthenticated && id) {
      toggleFavorite(id);
    } else {
      toast.error('You need to be logged in to favorite notes');
    }
  };

  const handleDeleteConfirm = () => {
    setDeleteConfirm(true);
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm(false);
  };

  const handleDeleteNote = async () => {
    if (id) {
      try {
        await deleteNote(id);
        toast.success('Note deleted successfully');
        navigate('/notes');
      } catch (error) {
        toast.error('Failed to delete note');
      }
    }
  };

  // Get course information if available
  const getCourseInfo = (courseId?: string) => {
    if (!courseId || !COURSES[courseId as keyof typeof COURSES]) return null;

    return COURSES[courseId as keyof typeof COURSES];
  };

  // Function to get file info and make absolute URL
  const getFileInfo = (fileUrl: string | null) => {
    if (!fileUrl) return { type: 'unknown', icon: FaFile, label: 'File', color: 'text-gray-400', absoluteUrl: null };

    const fileExt = fileUrl.split('.').pop()?.toLowerCase();

    // Convert to absolute URL if needed
    const backendUrl = import.meta.env.VITE_WS_URL || 'http://localhost:5000';
    const absoluteUrl = fileUrl.startsWith('http')
      ? fileUrl
      : `${backendUrl}${fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`}`;

    if (fileExt === 'pdf') {
      return { type: 'pdf', icon: FaFilePdf, label: 'PDF', color: 'text-red-500', absoluteUrl };
    } else if (['doc', 'docx'].includes(fileExt || '')) {
      return { type: 'word', icon: FaFileWord, label: 'Word', color: 'text-blue-500', absoluteUrl };
    } else if (['xls', 'xlsx'].includes(fileExt || '')) {
      return { type: 'excel', icon: FaFileExcel, label: 'Excel', color: 'text-green-500', absoluteUrl };
    } else if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExt || '')) {
      return { type: 'image', icon: FaFileImage, label: 'Image', color: 'text-purple-500', absoluteUrl };
    } else {
      return { type: 'unknown', icon: FaFile, label: 'File', color: 'text-gray-400', absoluteUrl };
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <p className="text-light-darker">Loading note details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !currentNote) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="glass p-4 rounded-md mb-6 text-red-400">
          <p>{error || 'Note not found'}</p>
        </div>
        <Link to="/notes" className="gradient-border bg-dark px-4 py-2 rounded-md font-medium hover:bg-dark-light transition-colors">
          Back to Notes
        </Link>
      </div>
    );
  }

  // Check if user is the owner of the note
  const isOwner = user && currentNote.userId === user.id;

  // Get course information
  const courseInfo = getCourseInfo(currentNote.courseId);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="glass rounded-lg p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-2xl font-bold gradient-text">{currentNote.title}</h1>

          <div className="flex space-x-2">
            {isAuthenticated && (
              <>
                <button
                  onClick={handleToggleFavorite}
                  className="p-2 rounded-full hover:bg-dark-lighter"
                  title="Add to favorites"
                >
                  {currentNote._count && currentNote._count.favorites > 0 ? (
                    <FaStar className="text-yellow-400 h-5 w-5" />
                  ) : (
                    <FaRegStar className="text-accent h-5 w-5" />
                  )}
                </button>

                <button
                  onClick={() => setShowShareModal(true)}
                  className="p-2 rounded-full hover:bg-dark-lighter"
                  title="Share to chat"
                >
                  <FaShare className="text-green-400 h-5 w-5" />
                </button>
              </>
            )}

            {isOwner && (
              <>
                <Link
                  to={`/notes/edit/${currentNote.id}`}
                  className="p-2 rounded-full hover:bg-dark-lighter"
                  title="Edit note"
                >
                  <FaEdit className="text-blue-400 h-5 w-5" />
                </Link>

                <button
                  onClick={handleDeleteConfirm}
                  className="p-2 rounded-full hover:bg-dark-lighter"
                  title="Delete note"
                >
                  <FaTrash className="text-red-400 h-5 w-5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Course and Semester Information */}
        {courseInfo && (
          <div
            className="flex items-center mb-4 p-3 rounded-md"
            style={{ backgroundColor: `${courseInfo.color}20` }}
          >
            <FaBookOpen className="mr-2" style={{ color: courseInfo.color }} />
            <div>
              <p className="font-medium" style={{ color: courseInfo.color }}>
                {courseInfo.name} ({courseInfo.code})
              </p>
              <div className="flex items-center text-sm text-accent">
                <FaGraduationCap className="mr-1" />
                <span>Department: {courseInfo.department}</span>
                <span className="mx-2">•</span>
                <span>Semester: {currentNote.semester}</span>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6">
          <p className="text-light-darker whitespace-pre-wrap">{currentNote.description}</p>
        </div>

        {/* AI Summary - only show for notes with files */}
        {currentNote.fileUrl && (
          <NoteSummary
            noteId={currentNote.id}
          />
        )}

        <div className="flex flex-wrap gap-2 mb-6">
          {currentNote.tags && currentNote.tags.map((tag) => (
            <span
              key={tag.tagId}
              className="bg-dark-lighter text-light-darker text-sm rounded-full px-3 py-1"
            >
              {tag.tag.name}
            </span>
          ))}
        </div>

        <div className="flex flex-wrap gap-4 mb-6">
          {currentNote.fileUrl && (
            <>
              <FileViewer fileUrl={currentNote.fileUrl} />

              {(() => {
                const fileInfo = getFileInfo(currentNote.fileUrl);
                return (
                  <a
                    href={fileInfo.absoluteUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center ${fileInfo.color} px-4 py-2 rounded-md hover:opacity-80 transition-colors`}
                    download
                  >
                    <fileInfo.icon className="mr-2" /> Download {fileInfo.label}
                  </a>
                );
              })()}
            </>
          )}

          {currentNote.externalUrl && (
            <a
              href={currentNote.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center bg-blue-500/20 text-blue-400 px-4 py-2 rounded-md hover:bg-blue-500/30 transition-colors"
            >
              <FaExternalLinkAlt className="mr-2" /> Visit External Link
            </a>
          )}
        </div>

        <div className="flex justify-between items-center text-sm text-accent border-t border-dark-accent/30 pt-4">
          <div>
            <p>Uploaded by: <span className="font-semibold text-light">{currentNote.user.name}</span></p>
          </div>
          <p>Uploaded on: {formatDate(new Date(currentNote.createdAt))}</p>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="glass rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4 gradient-text">Delete Note</h3>
            <p className="mb-6 text-light-darker">Are you sure you want to delete this note? This action cannot be undone.</p>

            <div className="flex justify-end space-x-4">
              <button
                onClick={handleDeleteCancel}
                className="gradient-border bg-dark px-4 py-2 rounded-md font-medium hover:bg-dark-light transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteNote}
                className="bg-red-500/20 text-red-400 border border-red-500/30 px-4 py-2 rounded-md font-medium hover:bg-red-500/30 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comments section */}
      <CommentSection noteId={currentNote.id} comments={currentNote.comments || []} />

      <div className="mt-6">
        <Link to="/notes" className="gradient-border bg-dark px-4 py-2 rounded-md font-medium hover:bg-dark-light transition-colors">
          Back to Notes
        </Link>
      </div>

      {/* Share Note Modal */}
      <ShareNoteModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        noteId={currentNote.id}
        noteTitle={currentNote.title}
        noteContent={currentNote.description}
      />
    </div>
  );
};

export default NoteDetailPage;