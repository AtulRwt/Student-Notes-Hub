import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/axios';
import { useAuthStore } from '../../store/authStore';

interface SocialStatsProps {
  userId: string;
}

const SocialStats = ({ userId }: SocialStatsProps) => {
  const { isAuthenticated } = useAuthStore();
  const [stats, setStats] = useState({
    followers: 0,
    following: 0,
    connections: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!isAuthenticated) return;
      
      setIsLoading(true);
      try {
        // Make parallel requests for better performance
        const [followersRes, followingRes, connectionsRes] = await Promise.all([
          apiClient.get(`/api/users/${userId}/followers`),
          apiClient.get(`/api/users/${userId}/following`),
          apiClient.get('/api/users/connections')
        ]);
        
        setStats({
          followers: followersRes.data.totalCount || followersRes.data.length || 0,
          following: followingRes.data.totalCount || followingRes.data.length || 0,
          connections: connectionsRes.data.length || 0
        });
        
        console.log('Social stats fetched:', {
          followers: followersRes.data,
          following: followingRes.data,
          connections: connectionsRes.data
        });
      } catch (error) {
        console.error('Error fetching social stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchStats();
    }
  }, [userId, isAuthenticated]);

  // Don't render anything if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="glass rounded-lg p-4 animate-pulse">
        <h3 className="h-4 bg-dark-light rounded mb-3 w-1/3"></h3>
        <div className="grid grid-cols-3 gap-2">
          <div className="h-16 bg-dark-light rounded"></div>
          <div className="h-16 bg-dark-light rounded"></div>
          <div className="h-16 bg-dark-light rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-lg p-4">
      <h3 className="text-sm font-semibold mb-3 text-accent">Social Network</h3>
      
      <div className="grid grid-cols-3 gap-2 text-center">
        <Link to={`/network/followers/${userId}`} className="glass-light rounded-lg p-3 hover:bg-white/5 transition-colors">
          <div className="text-xl font-bold">{stats.followers}</div>
          <div className="text-xs text-accent">Followers</div>
        </Link>
        
        <Link to={`/network/following/${userId}`} className="glass-light rounded-lg p-3 hover:bg-white/5 transition-colors">
          <div className="text-xl font-bold">{stats.following}</div>
          <div className="text-xs text-accent">Following</div>
        </Link>
        
        <Link to="/network/connections" className="glass-light rounded-lg p-3 hover:bg-white/5 transition-colors">
          <div className="text-xl font-bold">{stats.connections}</div>
          <div className="text-xs text-accent">Connections</div>
        </Link>
      </div>
    </div>
  );
};

export default SocialStats; 