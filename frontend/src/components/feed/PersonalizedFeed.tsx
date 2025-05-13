import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaFire, FaChevronRight, FaFilter, FaBookmark, FaStar } from 'react-icons/fa';
import NoteCard from '../notes/NoteCard';
import type { Note, User } from '../../types';

interface PersonalizedFeedProps {
  notes?: Note[];
  isLoading?: boolean;
}

const PersonalizedFeed = ({ notes = [], isLoading = false }: PersonalizedFeedProps) => {
  const [activeTab, setActiveTab] = useState<'recommended' | 'trending' | 'latest'>('recommended');
  const [displayNotes, setDisplayNotes] = useState<Note[]>([]);
  
  useEffect(() => {
    // In a real app, we would filter or sort notes based on the active tab
    // For now, we'll just use the same notes for all tabs
    setDisplayNotes(notes);
  }, [notes, activeTab]);
  
  // If we're loading or don't have notes, show placeholders
  if (isLoading || notes.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="gradient-text text-2xl font-bold">Your Feed</h2>
          
          <button className="text-accent hover:text-blue-400 transition-colors">
            <FaFilter />
          </button>
        </div>
        
        <FeedTabSelector activeTab={activeTab} onTabChange={setActiveTab} />
        
        {isLoading ? (
          // Loading skeletons
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="glass rounded-lg h-64 animate-pulse">
                <div className="h-1 bg-blue-400 opacity-50"></div>
                <div className="p-4 space-y-4">
                  <div className="h-6 bg-dark-light rounded-md w-3/4"></div>
                  <div className="h-4 bg-dark-light rounded-md w-1/2"></div>
                  <div className="h-4 bg-dark-light rounded-md w-full"></div>
                  <div className="h-4 bg-dark-light rounded-md w-5/6"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Empty state
          <div className="glass text-center py-12 px-4 rounded-lg">
            <FaBookmark className="mx-auto text-4xl text-accent mb-4" />
            <h3 className="text-xl font-bold mb-2">Your feed is empty</h3>
            <p className="text-accent max-w-md mx-auto mb-6">
              Follow more tags or browse notes to personalize your feed
            </p>
            <Link 
              to="/notes" 
              className="gradient-border bg-dark px-6 py-2 rounded-md font-medium hover:bg-dark-light transition-colors"
            >
              Browse Notes
            </Link>
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="gradient-text text-2xl font-bold">Your Feed</h2>
        
        <button className="text-accent hover:text-blue-400 transition-colors">
          <FaFilter />
        </button>
      </div>
      
      <FeedTabSelector activeTab={activeTab} onTabChange={setActiveTab} />
      
      {/* Trending in Your Major */}
      {activeTab === 'trending' && (
        <div className="glass rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center">
              <FaFire className="text-red-400 mr-2" />
              <h3 className="font-bold">Trending in Your Major</h3>
            </div>
            
            <Link to="/trending" className="text-accent hover:text-blue-400 flex items-center text-sm">
              See all <FaChevronRight className="ml-1" size={12} />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayNotes.slice(0, 2).map((note) => (
              <TrendingItem key={note.id} note={note} />
            ))}
          </div>
        </div>
      )}
      
      {/* Notes Feed */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {displayNotes.map((note) => (
          <NoteCard key={note.id} note={note} />
        ))}
      </div>
      
      {/* Weekly Digest Recommendation */}
      <div className="glass-light rounded-lg p-6 mt-8 text-center">
        <h3 className="font-bold mb-2">Want a weekly summary of top resources?</h3>
        <p className="text-accent text-sm mb-4">
          Get a weekly digest of the best notes and resources in your areas of interest
        </p>
        <button className="gradient-border bg-dark px-6 py-2 rounded-md font-medium hover:bg-dark-light transition-colors">
          Subscribe to Weekly Digest
        </button>
      </div>
    </div>
  );
};

interface FeedTabSelectorProps {
  activeTab: 'recommended' | 'trending' | 'latest';
  onTabChange: (tab: 'recommended' | 'trending' | 'latest') => void;
}

const FeedTabSelector = ({ activeTab, onTabChange }: FeedTabSelectorProps) => {
  return (
    <div className="flex border-b border-dark-accent mb-6">
      <button
        className={`px-4 py-2 ${activeTab === 'recommended' ? 'border-b-2 border-blue-400 text-blue-400' : 'text-accent'}`}
        onClick={() => onTabChange('recommended')}
      >
        Recommended
      </button>
      <button
        className={`px-4 py-2 ${activeTab === 'trending' ? 'border-b-2 border-blue-400 text-blue-400' : 'text-accent'}`}
        onClick={() => onTabChange('trending')}
      >
        Trending
      </button>
      <button
        className={`px-4 py-2 ${activeTab === 'latest' ? 'border-b-2 border-blue-400 text-blue-400' : 'text-accent'}`}
        onClick={() => onTabChange('latest')}
      >
        Latest
      </button>
    </div>
  );
};

interface TrendingItemProps {
  note: Note;
}

const TrendingItem = ({ note }: TrendingItemProps) => {
  return (
    <Link to={`/notes/${note.id}`}>
      <div className="bg-dark-light hover:bg-dark-lighter rounded-lg p-3 transition-colors">
        <h4 className="font-bold text-sm mb-1 line-clamp-1">{note.title}</h4>
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center text-accent">
            <FaStar className="text-yellow-400 mr-1" size={12} />
            <span>{note._count?.upvotes || 0} upvotes</span>
          </div>
          <span className="text-accent">{note.course?.name || note.tags[0]?.tag.name}</span>
        </div>
      </div>
    </Link>
  );
};

export default PersonalizedFeed; 