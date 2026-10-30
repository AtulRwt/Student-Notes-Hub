import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaUserFriends } from 'react-icons/fa';
import Avatar from '../shared/Avatar';
import ConnectButton from './ConnectButton';
import FollowButton from './FollowButton';
import ErrorBoundary from '../ErrorBoundary';
import apiClient from '../../api/axios';

interface User {
  id: string;
  name: string;
  profileImage: string | null;
  bio: string | null;
  _count?: {
    notes: number;
    followers: number;
  };
}

interface UserListProps {
  endpoint: string;
  title: string;
  emptyMessage: string;
  showFollowButton?: boolean;
  showConnectButton?: boolean;
}

const UserList = ({ 
  endpoint, 
  title, 
  emptyMessage,
  showFollowButton = true,
  showConnectButton = true
}: UserListProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  useEffect(() => {
    fetchUsers();
  }, [endpoint, page]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // Add page number to endpoint if it doesn't already have query params
      const url = endpoint.includes('?') ? 
        `${endpoint}&page=${page}` : 
        `${endpoint}?page=${page}`;
      
      const response = await apiClient.get(url);
      
      if (response.data.users || response.data.followers || response.data.following) {
        // Response format for paginated results
        const userData = response.data.users || response.data.followers || response.data.following;
        setUsers(userData);
        setTotalPages(response.data.totalPages || 1);
      } else if (Array.isArray(response.data)) {
        // Direct array format
        setUsers(response.data);
        setTotalPages(1); // Assume only one page for direct arrays
      } else {
        throw new Error('Unexpected API response format');
      }
      
      setError(null);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.error || 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  if (isLoading) {
    return (
      <div className="glass rounded-lg p-6 animate-pulse">
        <div className="h-6 bg-dark-light rounded w-1/3 mb-6"></div>
        
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center justify-between py-4 border-b border-dark-accent last:border-0">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-dark-light"></div>
              <div className="ml-3">
                <div className="h-4 bg-dark-light rounded w-24 mb-2"></div>
                <div className="h-3 bg-dark-light rounded w-32"></div>
              </div>
            </div>
            <div className="h-8 bg-dark-light rounded w-20"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <div className="text-red-400 text-center p-6">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="glass rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <div className="text-center p-8">
          <FaUserFriends className="mx-auto text-4xl text-accent mb-4" />
          <p className="text-accent">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      
      <div className="divide-y divide-dark-accent">
        {users.map(user => (
          <div key={user.id} className="py-4 flex items-center justify-between">
            <Link to={`/profile/${user.id}`} className="flex items-center group">
              <Avatar 
                src={user.profileImage} 
                alt={user.name}
                size="md"
              />
              <div className="ml-3">
                <h3 className="font-medium group-hover:text-blue-400 transition-colors">{user.name}</h3>
                {user.bio ? (
                  <p className="text-sm text-accent line-clamp-1">{user.bio}</p>
                ) : (
                  user._count && (
                    <p className="text-xs text-accent">
                      {user._count.notes || 0} notes · {user._count.followers || 0} followers
                    </p>
                  )
                )}
              </div>
            </Link>
            
            <div className="flex space-x-2">
              {showFollowButton && (
                <FollowButton userId={user.id} size="sm" />
              )}
              
              {showConnectButton && (
                <ConnectButton userId={user.id} size="sm" />
              )}
            </div>
          </div>
        ))}
      </div>
      
      {totalPages > 1 && (
        <div className="flex justify-center mt-6 space-x-2">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            className="px-3 py-1 rounded-md bg-dark-medium hover:bg-dark-light disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <span className="px-3 py-1">
            Page {page} of {totalPages}
          </span>
          
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
            className="px-3 py-1 rounded-md bg-dark-medium hover:bg-dark-light disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

const UserListWithErrorBoundary = (props: UserListProps) => (
  <ErrorBoundary
    fallback={
      <div className="glass rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">{props.title}</h2>
        <p className="text-accent text-center p-4">Error loading users</p>
      </div>
    }
  >
    <UserList {...props} />
  </ErrorBoundary>
);

export default UserListWithErrorBoundary; 