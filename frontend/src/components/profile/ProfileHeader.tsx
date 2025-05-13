import React from 'react';
import Avatar from '../shared/Avatar';
import ConnectButton from '../social/ConnectButton';
import FollowButton from '../social/FollowButton';
import { useNetworkStore } from '../../store/networkStore';

interface ProfileHeaderProps {
  id: string;
  name: string;
  email: string;
  bio: string | null | undefined;
  profileImage: string | null | undefined;
  isCurrentUser: boolean;
  _count?: {
    notes: number;
    followers: number;
    following: number;
  };
  onProfileUpdate?: (userData: any) => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  id,
  name,
  email,
  bio,
  profileImage,
  isCurrentUser,
  _count,
  onProfileUpdate
}) => {
  const { getConnectionStatus, getFollowStatus } = useNetworkStore();
  
  // Get initial relationship status from the store cache
  const initialConnectionStatus = getConnectionStatus(id);
  const initialFollowStatus = getFollowStatus(id);
  
  return (
    <div className="glass p-6 rounded-lg mb-6 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-gradient-to-br from-purple-500/30 to-blue-500/20 rounded-full blur-xl"></div>
      <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-gradient-to-tr from-blue-500/20 to-purple-500/10 rounded-full blur-xl"></div>
      
      <div className="relative flex flex-col md:flex-row items-center md:items-start gap-6">
        <div className="w-24 h-24 md:w-32 md:h-32 flex-shrink-0">
          <Avatar 
            src={profileImage} 
            alt={name} 
            size="xl"
            className="border-4 border-dark-medium shadow-md" 
          />
        </div>
        
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-bold mb-1">{name}</h1>
          <p className="text-accent text-sm mb-3">{email}</p>
          
          {bio && (
            <p className="mb-4 text-sm md:text-base">{bio}</p>
          )}
          
          <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-2">
            <div className="text-center">
              <span className="text-2xl font-bold block">{_count?.notes || 0}</span>
              <span className="text-xs text-accent">Notes</span>
            </div>
            <div className="text-center">
              <span className="text-2xl font-bold block">{_count?.followers || 0}</span>
              <span className="text-xs text-accent">Followers</span>
            </div>
            <div className="text-center">
              <span className="text-2xl font-bold block">{_count?.following || 0}</span>
              <span className="text-xs text-accent">Following</span>
            </div>
          </div>
        </div>
        
        {!isCurrentUser && (
          <div className="flex flex-col gap-2">
            <ConnectButton 
              userId={id} 
              initialStatus={initialConnectionStatus || undefined}
              size="md"
            />
            
            {/* Only show follow button if users are connected or initial status is not available yet */}
            {(initialConnectionStatus?.connected || !initialConnectionStatus) && (
              <FollowButton 
                userId={id} 
                initialFollowing={initialFollowStatus?.following}
                size="md"
                onProfileUpdate={onProfileUpdate}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileHeader; 