import { FaTwitter, FaLinkedin, FaGithub, FaEdit, FaSignOutAlt } from 'react-icons/fa';
import type { User } from '../../types';
import Avatar from '../shared/Avatar';

interface ProfileCardProps {
  user: User;
  onEdit: () => void;
  onLogout: () => void;
}

const ProfileCard = ({ user, onEdit, onLogout }: ProfileCardProps) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'long',
      day: 'numeric' 
    }).format(date);
  };
  
  return (
    <div className="glass rounded-lg overflow-hidden">
      {/* Profile Header with Image */}
      <div className="relative h-40 bg-gradient-to-r from-blue-900/40 to-purple-900/40">
        <div className="absolute -bottom-12 left-6">
          <Avatar 
            src={user.profileImage || null} 
            alt={user.name}
            size="xl"
            className="border-4 border-dark-lighter"
          />
        </div>
        
        {/* Action Buttons */}
        <div className="absolute top-4 right-4 space-x-2 flex">
          <button
            onClick={onEdit}
            className="glass-light p-2 rounded-full hover:bg-white/15 transition-colors"
            title="Edit Profile"
          >
            <FaEdit className="text-blue-400" />
          </button>
          <button
            onClick={onLogout}
            className="glass-light p-2 rounded-full hover:bg-white/15 transition-colors"
            title="Logout"
          >
            <FaSignOutAlt className="text-blue-400" />
          </button>
        </div>
      </div>
      
      {/* Profile Info */}
      <div className="pt-16 pb-6 px-6">
        <h1 className="text-2xl font-bold mb-1">{user.name}</h1>
        <p className="text-accent mb-4">{user.email}</p>
        
        {user.bio && (
          <div className="mb-4">
            <p className="text-light">{user.bio}</p>
          </div>
        )}
        
        {/* Details Section */}
        <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-2">
          {user.education && (
            <div className="glass-light p-2 rounded-md">
              <span className="text-xs text-accent">Education</span>
              <p className="text-light text-sm">{user.education}</p>
            </div>
          )}
          
          {user.joinedAt && (
            <div className="glass-light p-2 rounded-md">
              <span className="text-xs text-accent">Joined</span>
              <p className="text-light text-sm">{formatDate(user.joinedAt)}</p>
            </div>
          )}
        </div>
        
        {/* Interests */}
        {user.interests && user.interests.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-accent mb-2">Interests</h3>
            <div className="flex flex-wrap">
              {user.interests.map((interest) => (
                <span 
                  key={interest}
                  className="bg-dark-medium text-blue-400 text-xs rounded-full px-3 py-1 m-1"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* Social Links */}
        {user.socialLinks && (
          <div className="flex space-x-3 mt-4">
            {user.socialLinks.twitter && (
              <a 
                href={user.socialLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-light p-2 rounded-full hover:bg-white/15 transition-colors"
              >
                <FaTwitter className="text-blue-400" />
              </a>
            )}
            
            {user.socialLinks.linkedin && (
              <a 
                href={user.socialLinks.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-light p-2 rounded-full hover:bg-white/15 transition-colors"
              >
                <FaLinkedin className="text-blue-400" />
              </a>
            )}
            
            {user.socialLinks.github && (
              <a 
                href={user.socialLinks.github}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-light p-2 rounded-full hover:bg-white/15 transition-colors"
              >
                <FaGithub className="text-blue-400" />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileCard; 