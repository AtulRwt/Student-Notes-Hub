import { useState } from 'react';
import { FaChevronDown, FaBookOpen, FaGraduationCap, FaFileAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import type { Course, ResourceType } from '../../types';
import { RESOURCE_TYPES, RESOURCE_COLORS } from '../../types';

// Real course data with appropriate semester counts
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

// Course semester map
const COURSE_SEMESTERS: Record<string, number> = {
  'bsc-cs': 6,
  'btech-it': 8,
  'bcom-gen': 6,
  'bcom-ca': 6,
  'ba-eng': 6,
  'ba-hist': 6,
  'ba-eco': 6,
  'ba-soc': 6,
  'bba': 6,
  'bca': 6,
  'msc-cs': 4,
  'mtech-cs': 4,
  'mtech-it': 4,
  'mcom-gen': 4,
  'mcom-fin': 4,
  'mcom-ca': 4,
  'ma-eng': 4,
  'ma-hist': 4,
  'ma-eco': 4,
  'ma-soc': 4,
  'mba': 4,
  'mca': 6
};

interface HierarchicalNavProps {
  onFilterChange: (filters: { course?: string; semester?: string; resourceType?: string }) => void;
  activeFilters: { course?: string; semester?: string; resourceType?: string };
}

const HierarchicalNav = ({ onFilterChange, activeFilters }: HierarchicalNavProps) => {
  const navigate = useNavigate();
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [expandedSemester, setExpandedSemester] = useState<string | null>(null);
  const [courseCategory, setCourseCategory] = useState<'undergraduate' | 'postgraduate'>('undergraduate');
  
  // Filter courses by category
  const filteredCourses = COURSES.filter(course => {
    if (courseCategory === 'undergraduate') {
      return course.id.startsWith('b');
    } else {
      return course.id.startsWith('m');
    }
  });
  
  // Helper function to handle course click
  const handleCourseClick = (courseId: string) => {
    if (expandedCourse === courseId) {
      setExpandedCourse(null);
      setExpandedSemester(null);
      onFilterChange({ ...activeFilters, course: undefined, semester: undefined, resourceType: undefined });
    } else {
      setExpandedCourse(courseId);
      setExpandedSemester(null);
      onFilterChange({ ...activeFilters, course: courseId, semester: undefined, resourceType: undefined });
    }
  };
  
  // Helper function to handle semester click
  const handleSemesterClick = (semester: string) => {
    if (expandedSemester === semester) {
      setExpandedSemester(null);
      onFilterChange({ ...activeFilters, semester: undefined, resourceType: undefined });
    } else {
      setExpandedSemester(semester);
      onFilterChange({ ...activeFilters, semester: semester, resourceType: undefined });
    }
  };
  
  // Helper function to handle resource type click
  const handleResourceTypeClick = (resourceType: ResourceType) => {
    onFilterChange({ ...activeFilters, resourceType });
    // Navigate to notes list with filters applied
    navigate('/notes');
  };
  
  // Generate semesters for a specific course
  const getSemestersForCourse = (courseId: string) => {
    const semesterCount = COURSE_SEMESTERS[courseId] || 8;
    return Array.from({ length: semesterCount }, (_, i) => `Sem ${i + 1}`);
  };
  
  return (
    <div className="glass rounded-lg p-4 mb-6">
      <h2 className="font-bold text-lg mb-3 gradient-text">Browse by Category</h2>
      
      {/* Course category toggle */}
      <div className="flex mb-4 border-b border-dark-accent">
        <button
          className={`px-4 py-2 mr-2 ${courseCategory === 'undergraduate' ? 'border-b-2 border-blue-400 text-blue-400' : ''}`}
          onClick={() => setCourseCategory('undergraduate')}
        >
          Undergraduate
        </button>
        <button
          className={`px-4 py-2 ${courseCategory === 'postgraduate' ? 'border-b-2 border-blue-400 text-blue-400' : ''}`}
          onClick={() => setCourseCategory('postgraduate')}
        >
          Postgraduate
        </button>
      </div>
      
      <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
        {/* Courses */}
        {filteredCourses.map((course) => (
          <div key={course.id} className="rounded-md overflow-hidden">
            {/* Course header */}
            <button
              onClick={() => handleCourseClick(course.id)}
              className="w-full flex items-center justify-between p-2 bg-dark-light hover:bg-dark-lighter transition-colors"
              style={{ borderLeft: `4px solid ${course.color}` }}
            >
              <div className="flex items-center">
                <FaGraduationCap className="mr-2" style={{ color: course.color }} />
                <span>{course.name}</span>
              </div>
              <FaChevronDown className={`transition-transform ${expandedCourse === course.id ? 'rotate-180' : ''}`} />
            </button>
            
            {/* Semesters (shown only if course is expanded) */}
            {expandedCourse === course.id && (
              <div className="pl-4 border-l border-dark-accent ml-3">
                {getSemestersForCourse(course.id).map((semester) => (
                  <div key={semester} className="mt-1">
                    <button
                      onClick={() => handleSemesterClick(semester)}
                      className={`w-full flex items-center justify-between p-2 hover:bg-dark-lighter transition-colors rounded-md ${expandedSemester === semester ? 'bg-dark-lighter' : ''}`}
                    >
                      <div className="flex items-center">
                        <FaBookOpen className="mr-2 text-accent" />
                        <span>{semester}</span>
                      </div>
                      <FaChevronDown className={`transition-transform ${expandedSemester === semester ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {/* Resource Types (shown only if semester is expanded) */}
                    {expandedSemester === semester && (
                      <div className="pl-4 border-l border-dark-accent ml-3 space-y-1 mt-1">
                        {Object.entries(RESOURCE_TYPES).map(([key, label]) => (
                          <button
                            key={key}
                            onClick={() => handleResourceTypeClick(key as ResourceType)}
                            className={`w-full flex items-center p-2 hover:bg-dark-lighter transition-colors rounded-md ${
                              activeFilters.resourceType === key ? 'bg-dark-lighter' : ''
                            }`}
                          >
                            <div 
                              className="w-3 h-3 rounded-full mr-2" 
                              style={{ backgroundColor: RESOURCE_COLORS[key as ResourceType] }}
                            />
                            <FaFileAlt className="mr-2" style={{ color: RESOURCE_COLORS[key as ResourceType] }} />
                            <span>{label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default HierarchicalNav; 