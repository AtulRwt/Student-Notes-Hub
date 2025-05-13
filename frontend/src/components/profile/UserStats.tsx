import { FaUpload, FaEye, FaThumbsUp, FaComment, FaMedal } from 'react-icons/fa';
import type { User, Badge } from '../../types';

interface UserStatsProps {
  user: User;
}

const UserStats = ({ user }: UserStatsProps) => {
  const stats = user.stats || {
    notesUploaded: 0,
    notesViewed: 0,
    upvotesReceived: 0,
    commentsReceived: 0,
    commentsGiven: 0
  };

  // Demo badges if none exist
  const badges = user.badges || [
    {
      id: '1',
      name: 'First Upload',
      description: 'Uploaded your first note',
      icon: '🚀',
      earnedAt: new Date().toISOString()
    },
    {
      id: '2',
      name: 'Helpful Hand',
      description: 'Received 10+ upvotes on your notes',
      icon: '👍',
      earnedAt: new Date().toISOString()
    }
  ];

  return (
    <div className="glass rounded-lg p-6 mb-6">
      <h2 className="gradient-text text-xl font-bold mb-4">Contribution Stats</h2>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-dark-light rounded-lg p-4 text-center">
          <div className="flex justify-center mb-2">
            <FaUpload className="text-blue-400 text-xl" />
          </div>
          <p className="text-2xl font-bold">{stats.notesUploaded}</p>
          <p className="text-xs text-accent">Notes Uploaded</p>
        </div>
        
        <div className="bg-dark-light rounded-lg p-4 text-center">
          <div className="flex justify-center mb-2">
            <FaEye className="text-green-400 text-xl" />
          </div>
          <p className="text-2xl font-bold">{stats.notesViewed || 0}</p>
          <p className="text-xs text-accent">Views</p>
        </div>
        
        <div className="bg-dark-light rounded-lg p-4 text-center">
          <div className="flex justify-center mb-2">
            <FaThumbsUp className="text-yellow-400 text-xl" />
          </div>
          <p className="text-2xl font-bold">{stats.upvotesReceived || 0}</p>
          <p className="text-xs text-accent">Upvotes Received</p>
        </div>
        
        <div className="bg-dark-light rounded-lg p-4 text-center">
          <div className="flex justify-center mb-2">
            <FaComment className="text-purple-400 text-xl" />
          </div>
          <p className="text-2xl font-bold">{stats.commentsGiven || 0}</p>
          <p className="text-xs text-accent">Comments Given</p>
        </div>
      </div>
      
      {/* Badges Section */}
      <div>
        <div className="flex items-center mb-3">
          <FaMedal className="text-yellow-400 mr-2" />
          <h3 className="font-bold">Earned Badges</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {badges.map((badge) => (
            <BadgeCard key={badge.id} badge={badge} />
          ))}
        </div>
      </div>
    </div>
  );
};

interface BadgeCardProps {
  badge: Badge;
}

const BadgeCard = ({ badge }: BadgeCardProps) => {
  return (
    <div className="bg-dark-light rounded-lg p-3 text-center hover:bg-dark-lighter transition-colors">
      <div className="mb-2 text-2xl">{badge.icon}</div>
      <p className="font-bold text-sm">{badge.name}</p>
      <p className="text-xs text-accent mt-1">{badge.description}</p>
    </div>
  );
};

export default UserStats; 