import { useState, useEffect } from 'react';
import { FaUsers } from 'react-icons/fa';
import Avatar from '../shared/Avatar';
import FollowButton from './FollowButton';
import apiClient from '../../api/axios';

interface User {
  id: string;
  name: string;
  profileImage: string | null;
  bio: string | null;
  _count: {
    followers: number;
    notes: number;
  };
}

interface UserSuggestionsProps {
  limit?: number;
  onProfileUpdate?: (userData: any) => void;
}

const UserSuggestions = ({ limit = 5, onProfileUpdate }: UserSuggestionsProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSuggestions();
  }, [limit]);

  const fetchSuggestions = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get(`/api/users/suggestions?limit=${limit}`);
      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching user suggestions:', error);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollowChange = (userId: string) => {
    // Remove user from suggestions when followed
    setUsers(users.filter(user => user.id !== userId));
  };

  if (isLoading) {
    return (
      <div className="glass rounded-lg p-4 animate-pulse">
        <div className="flex items-center mb-4">
          <div className="w-5 h-5 rounded-full bg-dark-light mr-2"></div>
          <div className="h-5 bg-dark-light rounded w-1/3"></div>
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center justify-between py-2">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-dark-light"></div>
              <div className="ml-3">
                <div className="h-4 bg-dark-light rounded w-20 mb-1"></div>
                <div className="h-3 bg-dark-light rounded w-24"></div>
              </div>
            </div>
            <div className="w-16 h-8 bg-dark-light rounded-full"></div>
          </div>
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return null; // Don't show anything if no suggestions
  }

  return (
    <div className="glass rounded-lg p-4">
      <div className="flex items-center mb-4">
        <FaUsers className="text-blue-400 mr-2" />
        <h3 className="font-semibold">Suggested Users to Follow</h3>
      </div>
      
      <div className="space-y-3">
        {Array.isArray(users) && users.map(user => (
          <div key={user.id} className="flex items-center justify-between">
            <div className="flex items-center">
              <Avatar 
                src={user.profileImage} 
                alt={user.name} 
                size="sm" 
              />
              <div className="ml-2">
                <p className="font-medium text-sm">{user.name}</p>
                <p className="text-xs text-accent">
                  {user._count.followers} followers · {user._count.notes} notes
                </p>
              </div>
            </div>
            
            <FollowButton 
              userId={user.id} 
              size="sm" 
              onFollowChange={() => handleFollowChange(user.id)}
              onProfileUpdate={onProfileUpdate}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserSuggestions; 