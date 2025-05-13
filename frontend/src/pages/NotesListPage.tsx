import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useNotesStore } from '../store/notesStore';
import { useTagsStore } from '../store/tagsStore';
import { useAuthStore } from '../store/authStore';
import { FaSearch, FaFilter, FaTimes, FaFire, FaStar, FaCompass, FaClock } from 'react-icons/fa';
import NoteCard from '../components/notes/NoteCard';
import FilterBar from '../components/notes/FilterBar';
import CategorySidebar from '../components/navigation/CategorySidebar';
import type { ResourceType, Note } from '../types';
import { RESOURCE_COLORS } from '../types';
import Avatar from '../components/shared/Avatar';

const NotesListPage = () => {
  const location = useLocation();
  const { notes, fetchNotes, isLoading, error, trendingNotes, popularTopics, suggestedUsers, fetchTrendingNotes, fetchPopularTopics, fetchSuggestedUsers } = useNotesStore();
  const { tags, fetchTags } = useTagsStore();
  const { user } = useAuthStore();
  
  // Basic filters
  const [filters, setFilters] = useState({
    search: '',
    semester: '',
    subject: '',
    course: '',
    resourceType: ''
  });
  
  // Display modes
  const [activeView, setActiveView] = useState<'feed' | 'trending' | 'discover'>('feed');
  
  // Tag filters
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Add a state to track search metadata
  const [searchMetadata, setSearchMetadata] = useState<{
    searchPerformed: boolean;
    totalResults: number;
    searchTerm?: string;
  } | null>(null);
  
  // Add state for tracking recent searches
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  // Parse query params on initial load
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const initialFilters = {
      search: params.get('search') || '',
      semester: params.get('semester') || '',
      subject: params.get('subject') || '',
      course: params.get('course') || '',
      resourceType: params.get('resourceType') || ''
    };
    
    setFilters(initialFilters);
  }, [location.search]);
  
  useEffect(() => {
    // Fetch all required data
    fetchNotes(filters);
    fetchTags();
    fetchTrendingNotes();
    fetchPopularTopics();
    fetchSuggestedUsers();
  }, [fetchNotes, fetchTags, fetchTrendingNotes, fetchPopularTopics, fetchSuggestedUsers]);
  
  useEffect(() => {
    // Apply filters with debounce
    const timer = setTimeout(() => {
      fetchNotes(filters).then(() => {
        if (filters.search) {
          // Only add non-empty searches to recent searches
          if (filters.search.trim() !== '') {
            // Save to recent searches (avoid duplicates and limit to 5)
            setRecentSearches(prev => {
              const newSearches = [filters.search, ...prev.filter(s => s !== filters.search)].slice(0, 5);
              // Save to localStorage
              localStorage.setItem('recentSearches', JSON.stringify(newSearches));
              return newSearches;
            });
          }
          
          setSearchMetadata({
            searchPerformed: true,
            totalResults: notes.length,
            searchTerm: filters.search
          });
        } else {
          setSearchMetadata(null);
        }
      });
    }, 500);
    
    return () => clearTimeout(timer);
  }, [filters, fetchNotes]);
  
  // Load recent searches from localStorage on component mount
  useEffect(() => {
    try {
      const savedSearches = localStorage.getItem('recentSearches');
      if (savedSearches) {
        setRecentSearches(JSON.parse(savedSearches));
      }
    } catch (error) {
      console.error('Failed to load recent searches:', error);
    }
  }, []);
  
  const handleFilterChange = (name: string, value: string) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  const handleHierarchicalFilterChange = (newFilters: { 
    course?: string; 
    semester?: string; 
    resourceType?: string 
  }) => {
    setFilters(prev => ({ 
      ...prev, 
      course: newFilters.course || '', 
      semester: newFilters.semester || '',
      resourceType: newFilters.resourceType || ''
    }));
  };
  
  const handleTagSelect = (tagName: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tagName)) {
        return prev.filter(t => t !== tagName);
      } else {
        return [...prev, tagName];
      }
    });
    
    // Update the subject filter if only one tag is selected
    if (!selectedTags.includes(tagName) && selectedTags.length === 0) {
      handleFilterChange('subject', tagName);
    } else if (selectedTags.includes(tagName) && selectedTags.length === 1) {
      handleFilterChange('subject', '');
    }
  };
  
  const handleResourceTypeSelect = (type: ResourceType) => {
    handleFilterChange('resourceType', type);
  };
  
  const clearFilters = () => {
    setFilters({
      search: '',
      semester: '',
      subject: '',
      course: '',
      resourceType: ''
    });
    setSelectedTags([]);
    setSearchMetadata(null);
  };
  
  // Generate storyItems from real resource types data
  const storyItems = Object.entries(RESOURCE_COLORS).map(([type, color], index) => {
    // Find count of notes with this resource type - using tags instead since resourceType doesn't exist on Note
    const count = notes.filter(note => 
      note.tags.some(tag => tag.tag.name.toLowerCase() === type.toLowerCase())
    ).length;
    
    return {
      id: `story-${index}`,
      name: type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      color,
      count,
      resourceType: type
    };
  });

  // Compute discover notes - different view of notes (randomized)
  const discoverNotes = [...notes]
    .sort(() => 0.5 - Math.random())
    .slice(0, Math.min(6, notes.length));

  // Loading skeleton for notes
  const NoteSkeleton = () => (
    <div className="glass rounded-lg overflow-hidden animate-pulse">
      <div className="flex items-center p-4 border-b border-dark-accent/20">
        <div className="w-10 h-10 rounded-full bg-dark-light/50 mr-3"></div>
        <div className="flex-1">
          <div className="h-4 bg-dark-light/50 rounded w-1/3 mb-2"></div>
          <div className="h-3 bg-dark-light/50 rounded w-1/4"></div>
        </div>
        <div className="w-16 h-6 bg-dark-light/50 rounded-md"></div>
      </div>
      <div className="p-4">
        <div className="h-6 bg-dark-light/50 rounded w-3/4 mb-3"></div>
        <div className="h-4 bg-dark-light/50 rounded w-full mb-2"></div>
        <div className="h-4 bg-dark-light/50 rounded w-2/3 mb-4"></div>
        <div className="flex gap-2 mb-3">
          <div className="h-6 bg-dark-light/50 rounded-full w-16"></div>
          <div className="h-6 bg-dark-light/50 rounded-full w-20"></div>
        </div>
      </div>
      <div className="p-4 border-t border-dark-accent/20">
        <div className="flex justify-between">
          <div className="flex gap-3">
            <div className="w-8 h-4 bg-dark-light/50 rounded"></div>
            <div className="w-8 h-4 bg-dark-light/50 rounded"></div>
            <div className="w-8 h-4 bg-dark-light/50 rounded"></div>
          </div>
          <div className="w-6 h-4 bg-dark-light/50 rounded"></div>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="gradient-text text-3xl font-bold">Browse Notes</h1>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden bg-dark-medium hover:bg-dark-light rounded-full p-2 text-light transition-colors"
          >
            <FaFilter />
          </button>
          
          {Object.values(filters).some(f => f) || selectedTags.length > 0 ? (
            <button 
              onClick={clearFilters}
              className="flex items-center bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-full text-sm transition-colors"
            >
              <FaTimes className="mr-1" /> Clear Filters
            </button>
          ) : null}
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar: All Filters */}
        <div className={`md:w-1/4 transition-all duration-300 ${sidebarOpen ? 'block' : 'hidden md:block'}`}>
          <div className="glass rounded-lg overflow-hidden p-4 mb-6">
            {/* Search Bar */}
            <div className="relative mb-6">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-accent" />
              </div>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Search notes..."
                className="w-full py-2 pl-10 pr-4 rounded-lg bg-dark-lighter border border-dark-accent focus:border-blue-400 focus:outline-none text-light"
              />
            </div>
            
            {/* Recent searches */}
            {recentSearches.length > 0 && !filters.search && (
              <div className="mb-6">
                <h3 className="font-bold text-light mb-3">Recent Searches</h3>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => handleFilterChange('search', search)}
                      className="px-3 py-1 rounded-full text-sm bg-dark-light hover:bg-dark-lighter flex items-center"
                    >
                      <FaSearch className="mr-1 text-accent" size={10} />
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Search results metadata */}
            {searchMetadata?.searchPerformed && (
              <div className="mb-6">
                <p className="text-accent">
                  {searchMetadata.totalResults} results for "{searchMetadata.searchTerm}"
                </p>
              </div>
            )}
          </div>
          
          <div className="mb-6">
            <h3 className="font-bold text-light mb-3">View Options</h3>
            <div className="bg-dark-lighter rounded-lg overflow-hidden">
              <button 
                className={`px-4 py-2 text-sm w-full text-left flex items-center ${activeView === 'feed' ? 'bg-blue-500/20 text-blue-400' : 'text-light hover:bg-dark-light'}`}
                onClick={() => setActiveView('feed')}
              >
                <FaClock className="mr-2" /> Latest Notes
              </button>
              <button 
                className={`px-4 py-2 text-sm w-full text-left flex items-center ${activeView === 'trending' ? 'bg-blue-500/20 text-blue-400' : 'text-light hover:bg-dark-light'}`}
                onClick={() => setActiveView('trending')}
              >
                <FaFire className="mr-2" /> Trending Now
              </button>
              <button 
                className={`px-4 py-2 text-sm w-full text-left flex items-center ${activeView === 'discover' ? 'bg-blue-500/20 text-blue-400' : 'text-light hover:bg-dark-light'}`}
                onClick={() => setActiveView('discover')}
              >
                <FaCompass className="mr-2" /> Discover
              </button>
            </div>
          </div>
          
          {/* New Unified Category Sidebar */}
          <CategorySidebar
            onFilterChange={handleHierarchicalFilterChange}
            onTagSelect={handleTagSelect}
            activeFilters={{
              course: filters.course,
              semester: filters.semester,
              resourceType: filters.resourceType
            }}
            selectedTags={selectedTags}
            tags={tags}
          />
        </div>
        
        {/* Main Content: Instagram-style Feed */}
        <div className="md:w-3/4">
          {/* Stories Section */}
          <div className="mb-6 overflow-x-auto">
            <div className="flex space-x-4 py-2 px-1 min-w-max">
              {storyItems.map(story => (
                <button 
                  key={story.id}
                  onClick={() => handleResourceTypeSelect(story.resourceType as ResourceType)}
                  className="flex flex-col items-center"
                >
                  <div 
                    className="w-16 h-16 rounded-full p-[2px] ring-2 story-ring" 
                    style={{ 
                      background: `radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, ${story.color} 45%, ${story.color} 60%, #285AEB 90%)`,
                    }}
                  >
                    <div className="w-full h-full rounded-full bg-dark flex items-center justify-center overflow-hidden">
                      <span style={{ color: story.color }} className="text-xl">{story.name.charAt(0)}</span>
                    </div>
                  </div>
                  <p className="text-xs mt-1 text-light">{story.name.split(' ')[0]}</p>
                  <p className="text-[10px] text-accent">{story.count} notes</p>
                </button>
              ))}
            </div>
          </div>

          {/* Hot Topics Section - Use real data */}
          <div className="glass-light rounded-lg p-4 mb-6">
            <div className="flex items-center mb-3">
              <FaFire className="text-red-500 mr-2" />
              <h3 className="font-bold">Hot Topics This Week</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {popularTopics.length > 0 ? (
                popularTopics.map(topic => (
                  <button 
                    key={topic.id}
                    onClick={() => handleFilterChange('subject', topic.name)}
                    className="bg-dark-light hover:bg-dark-medium transition-colors px-3 py-1 rounded-full text-xs flex items-center"
                  >
                    <span>{topic.name}</span>
                    <span className="ml-1 bg-blue-500 text-[10px] px-1.5 py-0.5 rounded-full">{topic.count}</span>
                  </button>
                ))
              ) : (
                <div className="text-center w-full text-accent py-2">
                  Loading topics...
                </div>
              )}
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-900/20 text-red-400 p-4 rounded-md mb-6 glass-light">
              <p>{error}</p>
            </div>
          )}
          
          {/* Applied Filters Display */}
          {(Object.values(filters).some(f => f) || selectedTags.length > 0) && !isLoading && (
            <div className="glass-light p-3 rounded-lg mb-4 flex items-center">
              <span className="text-xs text-accent mr-2">Active filters:</span>
              <div className="flex flex-wrap gap-1">
                {filters.search && (
                  <span className="bg-dark-medium text-xs rounded-full px-2 py-1 flex items-center">
                    Search: {filters.search}
                  </span>
                )}
                {filters.course && (
                  <span className="bg-dark-medium text-xs rounded-full px-2 py-1 flex items-center">
                    Course: {filters.course}
                  </span>
                )}
                {filters.semester && (
                  <span className="bg-dark-medium text-xs rounded-full px-2 py-1 flex items-center">
                    Semester: {filters.semester}
                  </span>
                )}
                {filters.resourceType && (
                  <span className="bg-dark-medium text-xs rounded-full px-2 py-1 flex items-center">
                    Type: {filters.resourceType}
                  </span>
                )}
                {selectedTags.map(tag => (
                  <span key={tag} className="bg-dark-medium text-xs rounded-full px-2 py-1 flex items-center">
                    Tag: {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Search Metadata Display */}
          {searchMetadata && searchMetadata.searchPerformed && (
            <div className="glass-light p-3 rounded-lg mb-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">
                  <span className="text-accent">Search results for: </span>
                  <span className="text-blue-400 font-medium">{searchMetadata.searchTerm}</span>
                  <span className="text-xs text-accent ml-2">({searchMetadata.totalResults} results)</span>
                </span>
                {notes.length > 0 && (
                  <span className="text-xs italic text-accent">Results sorted by relevance</span>
                )}
              </div>
            </div>
          )}

          {/* Content based on active view */}
          {activeView === 'feed' && (
            <>
              {/* Loading State */}
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <NoteSkeleton key={i} />
                  ))}
                </div>
              ) : notes.length === 0 ? (
                <div className="text-center py-10 glass-light rounded-lg p-8">
                  <p className="text-accent">No notes found matching your criteria.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notes.map((note) => (
                    <div key={note.id} className="glass rounded-lg overflow-hidden animate-fade-in">
                      <NoteCard 
                        note={note} 
                        searchTerm={filters.search || undefined}
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeView === 'trending' && (
            <>
              <div className="flex items-center mb-4">
                <FaFire className="text-red-500 mr-2" />
                <h2 className="text-xl font-bold">Trending Notes</h2>
              </div>
              
              {isLoading || trendingNotes.length === 0 ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <NoteSkeleton key={i} />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {trendingNotes.map((note, index) => (
                    <div key={note.id} className="glass rounded-lg overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-2 flex items-center">
                        <span className="bg-blue-500 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold mr-2">
                          {index + 1}
                        </span>
                        <span className="text-sm font-medium">
                          {note._count?.favorites || 0} favorites • {note._count?.comments || 0} comments
                        </span>
                      </div>
                      <NoteCard 
                        note={note} 
                        searchTerm={filters.search || undefined}
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeView === 'discover' && (
            <>
              <div className="flex items-center mb-4">
                <FaCompass className="text-blue-400 mr-2" />
                <h2 className="text-xl font-bold">Discover New Content</h2>
              </div>
              
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="glass rounded-lg p-4 animate-pulse">
                      <div className="h-32 bg-dark-light/50 rounded mb-3"></div>
                      <div className="h-5 bg-dark-light/50 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-dark-light/50 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {discoverNotes.map(note => (
                    <Link to={`/notes/${note.id}`} key={note.id} className="glass rounded-lg p-4 hover:bg-dark-light/30 transition-colors">
                      <div className="h-32 rounded mb-3 flex items-center justify-center bg-gradient-to-r from-blue-900/20 to-purple-900/20">
                        <span 
                          className="text-4xl" 
                          style={{ 
                            color: note.tags.length > 0 
                              ? (RESOURCE_COLORS[note.tags[0].tag.name.toLowerCase() as ResourceType] || '#3b82f6')
                              : '#3b82f6'
                          }}
                        >
                          {note.title.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <h3 className="font-bold mb-1 line-clamp-1">{note.title}</h3>
                      <p className="text-accent text-sm line-clamp-2">{note.description}</p>
                      <div className="flex justify-between items-center mt-2 text-xs">
                        <span>{note.user.name}</span>
                        <div className="flex items-center">
                          <FaStar className="text-blue-400 mr-1" />
                          <span>{note._count?.favorites || 0}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotesListPage; 