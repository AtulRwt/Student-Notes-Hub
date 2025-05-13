import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaUserFriends, FaUserPlus, FaUsers } from 'react-icons/fa';
import apiClient from '../../api/axios';
import Avatar from '../shared/Avatar';
import UserSuggestions from './UserSuggestions';
import FollowButton from './FollowButton';

interface SocialTabProps {
  userId: string;
  onProfileUpdate?: (userData: any) => void;
}

interface UserConnection {
  id: string;
  name: string;
  profileImage: string | null;
  bio: string | null;
  _count?: {
    notes: number;
    followers: number;
  };
}

const SocialTab = ({ userId, onProfileUpdate }: SocialTabProps) => {
  const [followers, setFollowers] = useState<UserConnection[]>([]);
  const [following, setFollowing] = useState<UserConnection[]>([]);
  const [connections, setConnections] = useState<UserConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Function to refresh user data when network actions occur
  const refreshUserData = async () => {
    if (onProfileUpdate && userId) {
      try {
        const response = await apiClient.get(`/api/users/${userId}`);
        if (response.data) {
          onProfileUpdate(response.data);
        }
      } catch (error: any) {
        console.error('Error refreshing user data:', error);
        // Don't keep trying if there are auth errors
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          console.log("Authentication error, skipping profile refresh");
        }
      }
    }
  };

  useEffect(() => {
    const fetchNetworkData = async () => {
      setIsLoading(true);
      try {
        // Fetch followers, following, and connections in parallel
        const [followersRes, followingRes, connectionsRes] = await Promise.all([
          apiClient.get(`/api/users/${userId}/followers?limit=5`),
          apiClient.get(`/api/users/${userId}/following?limit=5`),
          apiClient.get(`/api/users/connections?limit=5`)
        ]);
        
        // Ensure we're setting arrays
        setFollowers(Array.isArray(followersRes.data.followers) ? followersRes.data.followers : []);
        setFollowing(Array.isArray(followingRes.data.following) ? followingRes.data.following : []);
        setConnections(Array.isArray(connectionsRes.data) ? connectionsRes.data : []);
      } catch (error) {
        console.error('Error fetching network data:', error);
        setError('Could not load network information');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNetworkData();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="glass-light rounded-lg p-4">
            <div className="h-6 bg-dark-medium rounded w-1/4 mb-4"></div>
            <div className="flex flex-wrap gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-dark-medium"></div>
                  <div>
                    <div className="h-4 bg-dark-medium rounded w-20 mb-2"></div>
                    <div className="h-3 bg-dark-medium rounded w-32"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-light rounded-lg p-6 text-center">
        <h3 className="text-lg font-medium mb-2 text-red-400">Error</h3>
        <p className="text-accent">{error}</p>
      </div>
    );
  }

  const renderUserList = (users: UserConnection[], emptyMessage: string, viewAllLink: string) => {
    // Ensure users is an array
    if (!Array.isArray(users) || users.length === 0) {
      return (
        <p className="text-accent text-center py-4">{emptyMessage}</p>
      );
    }

    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {users.map(user => (
            <div 
              key={user.id}
              className="flex items-center p-3 glass-light rounded-lg hover:bg-dark-medium/50 transition-colors justify-between"
            >
              <Link 
                to={`/profile/${user.id}`}
                className="flex items-center"
              >
                <Avatar 
                  src={user.profileImage} 
                  alt={user.name} 
                  size="sm" 
                />
                <div className="ml-3">
                  <div className="font-medium">{user.name}</div>
                  {user.bio && (
                    <p className="text-xs text-accent line-clamp-1">{user.bio}</p>
                  )}
                </div>
              </Link>
              
              <FollowButton 
                userId={user.id}
                size="sm"
                onProfileUpdate={refreshUserData}
              />
            </div>
          ))}
        </div>
        
        {users.length >= 5 && (
          <div className="text-center">
            <Link 
              to={viewAllLink} 
              className="text-sm text-blue-400 hover:underline"
            >
              View all
            </Link>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="space-y-6">
      <div className="glass-light rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <FaUserFriends className="text-blue-400" />
          <h3 className="text-lg font-medium">Connections</h3>
        </div>
        
        {renderUserList(
          connections, 
          "No connections yet", 
          "/network/connections"
        )}
      </div>
      
      <div className="glass-light rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <FaUsers className="text-purple-400" />
          <h3 className="text-lg font-medium">Followers</h3>
        </div>
        
        {renderUserList(
          followers, 
          "No followers yet", 
          `/network/followers/${userId}`
        )}
      </div>
      
      <div className="glass-light rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <FaUserPlus className="text-green-400" />
          <h3 className="text-lg font-medium">Following</h3>
        </div>
        
        {renderUserList(
          following, 
          "Not following anyone yet", 
          `/network/following/${userId}`
        )}
      </div>
      
      <div className="mt-8">
        <h3 className="text-lg font-medium mb-4">Suggested Connections</h3>
        <UserSuggestions limit={3} onProfileUpdate={refreshUserData} />
      </div>
    </div>
  );
};

export default SocialTab; 