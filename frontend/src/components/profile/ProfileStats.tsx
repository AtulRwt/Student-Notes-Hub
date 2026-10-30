import { FaFileAlt, FaStar, FaComment } from 'react-icons/fa';
import type { Note } from '../../types';

interface ProfileStatsProps {
  notes: Note[];
}

const ProfileStats = ({ notes }: ProfileStatsProps) => {
  // Calculate stats
  const totalNotes = notes.length;
  
  const totalFavorites = notes.reduce((sum, note) => 
    sum + (note._count?.favorites || 0), 0);
    
  const totalComments = notes.reduce((sum, note) => 
    sum + (note._count?.comments || 0), 0);
  
  const mostPopularNote = notes.length > 0 
    ? [...notes].sort((a, b) => 
        (b._count?.favorites || 0) - (a._count?.favorites || 0)
      )[0]
    : null;
  
  return (
    <div className="glass rounded-lg p-6">
      <h2 className="gradient-text text-xl font-bold mb-4">Activity Stats</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Notes Count */}
        <div className="glass-light p-4 rounded-lg flex items-center">
          <div className="bg-dark-medium rounded-full p-3 mr-3">
            <FaFileAlt className="text-blue-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-light">{totalNotes}</div>
            <div className="text-xs text-accent">Notes Shared</div>
          </div>
        </div>
        
        {/* Favorites Count */}
        <div className="glass-light p-4 rounded-lg flex items-center">
          <div className="bg-dark-medium rounded-full p-3 mr-3">
            <FaStar className="text-blue-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-light">{totalFavorites}</div>
            <div className="text-xs text-accent">Total Favorites</div>
          </div>
        </div>
        
        {/* Comments Count */}
        <div className="glass-light p-4 rounded-lg flex items-center">
          <div className="bg-dark-medium rounded-full p-3 mr-3">
            <FaComment className="text-blue-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-light">{totalComments}</div>
            <div className="text-xs text-accent">Total Comments</div>
          </div>
        </div>
      </div>
      
      {/* Most Popular Note */}
      {mostPopularNote && (
        <div className="glass-light p-4 rounded-lg">
          <h3 className="text-sm font-semibold text-accent mb-2">Most Popular Note</h3>
          <p className="text-light font-medium mb-1">{mostPopularNote.title}</p>
          <div className="flex text-xs text-accent">
            <span className="flex items-center mr-3">
              <FaStar className="text-blue-400 mr-1" /> 
              {mostPopularNote._count?.favorites || 0} favorites
            </span>
            <span className="flex items-center">
              <FaComment className="text-blue-400 mr-1" /> 
              {mostPopularNote._count?.comments || 0} comments
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileStats; 