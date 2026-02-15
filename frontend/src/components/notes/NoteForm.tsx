import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FaUpload, FaLink, FaBookOpen, FaFilePdf, FaFileWord, FaFileExcel, FaFileImage, FaFile, FaRobot, FaCheckCircle } from 'react-icons/fa';
import { useNotesStore } from '../../store/notesStore';
import { useTagsStore } from '../../store/tagsStore';
import type { NoteFormData, Note, ResourceType, Course } from '../../types';
import { RESOURCE_TYPES } from '../../types';
import TagSelector from './TagSelector';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Course data with appropriate semester counts
const COURSES: Course[] = [
  // Undergraduate Courses
  { id: 'bsc-cs', name: 'B.Sc. Computer Science', code: 'BSC-CS', department: 'Science', color: '#3b82f6' },
  { id: 'btech-it', name: 'B.Tech. Information Technology', code: 'BTECH-IT', department: 'Engineering', color: '#0ea5e9' },
  { id: 'bcom-gen', name: 'B.Com. General', code: 'BCOM', department: 'Commerce', color: '#10b981' },
  { id: 'bcom-ca', name: 'B.Com. Computer Applications', code: 'BCOM-CA', department: 'Commerce', color: '#14b8a6' },
  { id: 'ba-eng', name: 'B.A. English', code: 'BA-ENG', department: 'Arts', color: '#f59e0b' },
  { id: 'ba-hist', name: 'B.A. History', code: 'BA-HIS', department: 'Arts', color: '#d97706' },
  { id: 'ba-eco', name: 'B.A. Economics', code: 'BA-ECO', department: 'Arts', color: '#ef4444' },
  { id: 'ba-soc', name: 'B.A. Sociology', code: 'BA-SOC', department: 'Arts', color: '#dc2626' },
  { id: 'bba', name: 'BBA (Bachelor of Business Admin.)', code: 'BBA', department: 'Business', color: '#8b5cf6' },
  { id: 'bca', name: 'BCA (Bachelor of Computer Apps.)', code: 'BCA', department: 'Computer Applications', color: '#6366f1' },

  // Postgraduate Courses
  { id: 'msc-cs', name: 'M.Sc. Computer Science', code: 'MSC-CS', department: 'Science', color: '#3b82f6' },
  { id: 'mtech-cs', name: 'M.Tech. Computer Science', code: 'MTECH-CS', department: 'Engineering', color: '#0ea5e9' },
  { id: 'mtech-it', name: 'M.Tech. Information Technology', code: 'MTECH-IT', department: 'Engineering', color: '#0891b2' },
  { id: 'mcom-gen', name: 'M.Com. General', code: 'MCOM', department: 'Commerce', color: '#10b981' },
  { id: 'mcom-fin', name: 'M.Com. Finance', code: 'MCOM-FIN', department: 'Commerce', color: '#059669' },
  { id: 'mcom-ca', name: 'M.Com. Computer Applications', code: 'MCOM-CA', department: 'Commerce', color: '#14b8a6' },
  { id: 'ma-eng', name: 'M.A. English', code: 'MA-ENG', department: 'Arts', color: '#f59e0b' },
  { id: 'ma-hist', name: 'M.A. History', code: 'MA-HIS', department: 'Arts', color: '#d97706' },
  { id: 'ma-eco', name: 'M.A. Economics', code: 'MA-ECO', department: 'Arts', color: '#ef4444' },
  { id: 'ma-soc', name: 'M.A. Sociology', code: 'MA-SOC', department: 'Arts', color: '#dc2626' },
  { id: 'mba', name: 'MBA (Master of Business Admin.)', code: 'MBA', department: 'Business', color: '#8b5cf6' },
  { id: 'mca', name: 'MCA (Master of Computer Apps.)', code: 'MCA', department: 'Computer Applications', color: '#6366f1' },
];

interface NoteFormProps {
  initialData?: Partial<Note> & { resourceType?: ResourceType };
  isEditing?: boolean;
}

const NoteForm = ({ initialData, isEditing = false }: NoteFormProps) => {
  const navigate = useNavigate();
  const { createNote, updateNote, isLoading } = useNotesStore();
  const { tags, fetchTags } = useTagsStore();

  // Predefined semesters
  const semesters = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6', 'Sem 7', 'Sem 8'];

  // State for course category
  const [courseCategory, setCourseCategory] = useState<'undergraduate' | 'postgraduate'>('undergraduate');

  // Filter courses by category
  const filteredCourses = COURSES.filter(course => {
    if (courseCategory === 'undergraduate') {
      return course.id.startsWith('b');
    } else {
      return course.id.startsWith('m');
    }
  });

  // Default form values
  const defaultFormData: NoteFormData = {
    title: '',
    description: '',
    externalUrl: '',
    semester: 'Sem 1',
    courseId: '',
    resourceType: 'lecture_notes' as ResourceType,
    tags: [],
    file: null
  };

  const [formData, setFormData] = useState<NoteFormData>({
    ...defaultFormData,
    ...initialData,
    resourceType: (initialData?.resourceType as ResourceType) || 'lecture_notes' as ResourceType,
    externalUrl: initialData?.externalUrl || '',
    courseId: initialData?.courseId || '',
    tags: initialData?.tags?.map(t => t.tag.name) || []
  });

  // For the file input
  const [fileName, setFileName] = useState<string>('');
  const [fileType, setFileType] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Auto-fill state
  const [isExtractingMetadata, setIsExtractingMetadata] = useState<boolean>(false);
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'resourceType') {
      setFormData(prev => ({ ...prev, [name]: value as ResourceType }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // AI Auto-fill: Extract metadata from uploaded file
  const extractMetadataFromFile = async (file: File) => {
    setIsExtractingMetadata(true);
    toast.loading('AI is analyzing your document...', { id: 'ai-extract' });

    try {
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();
      formDataToSend.append('file', file);

      const response = await axios.post(
        `${API_URL}/upload/extract-metadata`,
        formDataToSend,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.metadata) {
        const metadata = response.data.metadata;
        setAiSuggestions(metadata);

        // Auto-fill form fields with AI suggestions
        setFormData(prev => ({
          ...prev,
          title: metadata.title || prev.title,
          description: metadata.description || prev.description,
          tags: metadata.suggestedTags && metadata.suggestedTags.length > 0
            ? metadata.suggestedTags
            : prev.tags,
          semester: metadata.detectedSemester || prev.semester
        }));

        toast.success(
          `✨ AI filled the form! (Confidence: ${metadata.confidence})`,
          { id: 'ai-extract', duration: 4000 }
        );
      } else {
        toast.error('Could not extract metadata. Please fill manually.', { id: 'ai-extract' });
      }
    } catch (error: any) {
      console.error('Metadata extraction failed:', error);
      toast.error('AI analysis failed. Please fill the form manually.', { id: 'ai-extract' });
    } finally {
      setIsExtractingMetadata(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    console.log('File selected:', file?.name, file?.type, file?.size);

    if (file) {
      // Check file type
      const allowedTypes = [
        // PDF
        'application/pdf',
        // Word
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        // Excel
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        // Images
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/bmp',
        'image/webp'
      ];

      console.log('Checking file type:', file.type, 'allowed:', allowedTypes.includes(file.type));

      if (!allowedTypes.includes(file.type)) {
        toast.error('Only PDF, Word, Excel, and Image files are allowed');
        // Reset the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      // Check file size (max 10MB)
      console.log('Checking file size:', file.size, 'max:', 10 * 1024 * 1024);
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size should be less than 10MB');
        // Reset the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      // Determine document type
      let documentType = 'Document';
      if (file.type === 'application/pdf') {
        documentType = 'PDF';
      } else if (file.type === 'application/msword' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        documentType = 'Word Document';
      } else if (file.type === 'application/vnd.ms-excel' || file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        documentType = 'Excel Spreadsheet';
      } else if (file.type.startsWith('image/')) {
        documentType = 'Image';
      }

      console.log('Setting document type:', documentType);

      // Create a new File object to ensure it's properly handled
      const fileToUpload = new File([file], file.name, { type: file.type });

      setFormData(prev => ({ ...prev, file: fileToUpload }));
      setFileName(file.name);
      setFileType(documentType);

      // AI Auto-fill: Extract metadata from the uploaded file
      await extractMetadataFromFile(fileToUpload);
    } else {
      // Clear file data if no file selected
      setFormData(prev => ({ ...prev, file: null }));
      setFileName('');
      setFileType('');
      setAiSuggestions(null);
    }
  };

  const handleTagsChange = (selectedTags: string[]) => {
    setFormData(prev => ({ ...prev, tags: selectedTags }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with data:', formData);
    console.log('File details:', formData.file?.name, formData.file?.type, formData.file?.size);

    try {
      if (isEditing && initialData?.id) {
        console.log('Updating note:', initialData.id);
        await updateNote(initialData.id, formData);
        toast.success('Note updated successfully!');
        navigate(`/notes/${initialData.id}`);
      } else {
        console.log('Creating new note');
        await createNote(formData);
        toast.success('Note created successfully!');
        navigate('/notes');
      }
    } catch (error: any) {
      console.error('Form submission error:', error);
      toast.error(error.response?.data?.error || 'Failed to save note');
    }
  };

  return (
    <div className="glass rounded-lg p-6 max-w-2xl mx-auto">
      <h1 className="gradient-text text-2xl font-bold mb-6">
        {isEditing ? 'Edit Note' : 'Upload New Note'}
      </h1>

      {/* AI Suggestions Banner */}
      {aiSuggestions && (
        <div className="mb-6 p-4 bg-blue-500/10 border border-blue-400/30 rounded-lg">
          <div className="flex items-start gap-3">
            <FaRobot className="text-blue-400 text-xl mt-1 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-blue-400 font-semibold flex items-center gap-2 mb-2">
                <FaCheckCircle className="text-green-400" />
                AI Auto-Fill Completed
              </h3>
              <p className="text-sm text-light-darker mb-2">
                The form has been automatically filled based on your document.
                You can edit any field before submitting.
              </p>
              <div className="text-xs text-accent">
                Confidence: <span className={`font-semibold ${aiSuggestions.confidence === 'high' ? 'text-green-400' :
                    aiSuggestions.confidence === 'medium' ? 'text-yellow-400' :
                      'text-orange-400'
                  }`}>{aiSuggestions.confidence}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="title" className="block text-light text-sm font-bold mb-2">
            Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="bg-dark-lighter border border-dark-accent rounded-md px-3 py-2 w-full text-light focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-transparent"
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="description" className="block text-light text-sm font-bold mb-2">
            Description *
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="bg-dark-lighter border border-dark-accent rounded-md px-3 py-2 w-full text-light focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-transparent resize-none"
            required
          />
        </div>

        {/* Course Category Toggle */}
        <div className="mb-4">
          <label className="block text-light text-sm font-bold mb-2 flex items-center">
            <FaBookOpen className="text-blue-400 mr-1" /> Course Category
          </label>
          <div className="flex border border-dark-accent rounded-md overflow-hidden">
            <button
              type="button"
              className={`flex-1 py-2 ${courseCategory === 'undergraduate' ? 'bg-blue-500/30 text-blue-400' : 'bg-dark-lighter text-light'}`}
              onClick={() => setCourseCategory('undergraduate')}
            >
              Undergraduate
            </button>
            <button
              type="button"
              className={`flex-1 py-2 ${courseCategory === 'postgraduate' ? 'bg-blue-500/30 text-blue-400' : 'bg-dark-lighter text-light'}`}
              onClick={() => setCourseCategory('postgraduate')}
            >
              Postgraduate
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Course Selection */}
          <div>
            <label htmlFor="courseId" className="block text-light text-sm font-bold mb-2">
              Course *
            </label>
            <select
              id="courseId"
              name="courseId"
              value={formData.courseId}
              onChange={handleChange}
              className="bg-dark-lighter border border-dark-accent rounded-md px-3 py-2 w-full text-light focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-transparent"
              required
            >
              <option value="">Select Course</option>
              {filteredCourses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name} ({course.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="semester" className="block text-light text-sm font-bold mb-2">
              Semester *
            </label>
            <select
              id="semester"
              name="semester"
              value={formData.semester}
              onChange={handleChange}
              className="bg-dark-lighter border border-dark-accent rounded-md px-3 py-2 w-full text-light focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-transparent"
              required
            >
              {semesters.map((semester) => (
                <option key={semester} value={semester}>
                  {semester}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="resourceType" className="block text-light text-sm font-bold mb-2">
            Resource Type *
          </label>
          <select
            id="resourceType"
            name="resourceType"
            value={formData.resourceType}
            onChange={handleChange}
            className="bg-dark-lighter border border-dark-accent rounded-md px-3 py-2 w-full text-light focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-transparent"
            required
          >
            {Object.entries(RESOURCE_TYPES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-light text-sm font-bold mb-2">
            Tags *
          </label>
          <TagSelector
            availableTags={tags.map(tag => tag.name)}
            selectedTags={formData.tags}
            onChange={handleTagsChange}
          />
          <p className="text-xs text-accent mt-1">
            Select existing tags or create new ones by typing and pressing Enter
          </p>
        </div>

        <div className="mb-4">
          <label htmlFor="externalUrl" className="block text-light text-sm font-bold mb-2 flex items-center">
            <FaLink className="text-blue-400 mr-1" /> External URL (Optional)
          </label>
          <input
            type="url"
            id="externalUrl"
            name="externalUrl"
            value={formData.externalUrl || ''}
            onChange={handleChange}
            className="bg-dark-lighter border border-dark-accent rounded-md px-3 py-2 w-full text-light focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-transparent"
            placeholder="https://example.com"
          />
        </div>

        <div className="mb-6">
          <label htmlFor="file" className="block text-light text-sm font-bold mb-2 flex items-center">
            <FaUpload className="text-blue-400 mr-1" /> Upload Document (Optional)
          </label>

          <div className="flex items-center">
            <label htmlFor="file" className="gradient-border bg-dark px-4 py-2 rounded-md font-medium cursor-pointer hover:bg-dark-light transition-colors">
              Choose File
            </label>
            <input
              type="file"
              id="file"
              name="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.bmp,.webp"
            />
            <span className="ml-3 text-sm text-light-darker flex items-center">
              {fileName ? (
                <>
                  {fileType === 'PDF' && <FaFilePdf className="text-red-500 mr-2" />}
                  {fileType === 'Word Document' && <FaFileWord className="text-blue-500 mr-2" />}
                  {fileType === 'Excel Spreadsheet' && <FaFileExcel className="text-green-500 mr-2" />}
                  {fileType === 'Image' && <FaFileImage className="text-purple-500 mr-2" />}
                  {fileType === 'Document' && <FaFile className="text-gray-400 mr-2" />}
                  {fileType}: {fileName}
                </>
              ) : (
                initialData?.fileUrl ? 'Current file will be kept' : 'No file chosen'
              )}
            </span>
          </div>
          <p className="text-xs text-accent mt-1">Max file size: 10MB. Supported formats: PDF, Word, Excel, and Images.</p>
        </div>

        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="gradient-border bg-dark px-4 py-2 rounded-md font-medium hover:bg-dark-light transition-colors"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isLoading}
            className="gradient-border bg-dark px-4 py-2 rounded-md font-medium hover:bg-dark-light transition-colors"
          >
            {isLoading ? 'Saving...' : isEditing ? 'Update Note' : 'Create Note'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NoteForm; 