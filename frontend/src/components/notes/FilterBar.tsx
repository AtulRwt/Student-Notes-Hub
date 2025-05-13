import { FaSearch } from 'react-icons/fa';
import type { Tag } from '../../types';

interface FilterBarProps {
  filters: {
    search: string;
    semester: string;
    subject: string;
  };
  onFilterChange: (name: string, value: string) => void;
  tags: Tag[];
}

const FilterBar = ({ filters, onFilterChange, tags }: FilterBarProps) => {
  // Predefined semesters for the filter
  const semesters = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6', 'Sem 7', 'Sem 8'];
  
  return (
    <div className="glass rounded-lg p-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="h-5 w-5 text-blue-400" />
            </div>
            <input
              type="text"
              className="bg-dark-lighter border border-dark-accent/50 rounded-md px-3 py-2 pl-10 w-full text-light focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-transparent"
              placeholder="Search notes..."
              value={filters.search}
              onChange={(e) => onFilterChange('search', e.target.value)}
            />
          </div>
        </div>
        
        {/* Semester filter */}
        <div className="w-full md:w-48">
          <select
            className="bg-dark-lighter border border-dark-accent/50 rounded-md px-3 py-2 w-full text-light focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-transparent"
            value={filters.semester}
            onChange={(e) => onFilterChange('semester', e.target.value)}
          >
            <option value="">All Semesters</option>
            {semesters.map((semester) => (
              <option key={semester} value={semester}>
                {semester}
              </option>
            ))}
          </select>
        </div>
        
        {/* Subject/Tag filter */}
        <div className="w-full md:w-48">
          <select
            className="bg-dark-lighter border border-dark-accent/50 rounded-md px-3 py-2 w-full text-light focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-transparent"
            value={filters.subject}
            onChange={(e) => onFilterChange('subject', e.target.value)}
          >
            <option value="">All Subjects</option>
            {tags.map((tag) => (
              <option key={tag.id} value={tag.name}>
                {tag.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default FilterBar; 