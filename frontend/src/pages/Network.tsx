import { useState, useEffect } from 'react';
import { useParams, Link, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaUsers, FaUserFriends, FaUserPlus, FaRedo } from 'react-icons/fa';
import UserList from '../components/social/UserList';
import ConnectionRequests from '../components/social/ConnectionRequests';
import UserSuggestions from '../components/social/UserSuggestions';
import ErrorBoundary from '../components/ErrorBoundary';
import { useNetworkStore } from '../store/networkStore';
import { useAuthStore } from '../store/authStore';

const Network = () => {
  const { type } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<string>(type || 'connections');
  const { refreshNetworkData, isLoading } = useNetworkStore();
  const [refreshing, setRefreshing] = useState(false);
  
  useEffect(() => {
    if (type) {
      setActiveTab(type);
    } else if (!type) {
      // If no type is specified in URL, default to connections
      navigate('/network/connections', { replace: true });
    }
  }, [type, navigate]);

  // Refresh all network data
  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshNetworkData();
    setTimeout(() => setRefreshing(false), 500);
  };
  
  // When component mounts, refresh network data
  useEffect(() => {
    refreshNetworkData();
  }, [refreshNetworkData]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8 flex justify-between items-center">
        <Link to="/profile" className="flex items-center text-blue-400 hover:text-blue-300 transition-colors">
          <FaArrowLeft className="mr-2" />
          Back to Profile
        </Link>
        
        <button 
          onClick={handleRefresh}
          disabled={refreshing || isLoading}
          className="text-blue-400 hover:text-blue-300 flex items-center text-sm px-3 py-1 glass-light rounded-lg transition-all hover:bg-dark-medium disabled:opacity-50"
        >
          <FaRedo className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      
      <div className="flex items-center mb-6">
        <FaUserFriends className="text-3xl text-purple-500 mr-3" />
        <h1 className="text-3xl font-bold">Your Network</h1>
      </div>
      
      <div className="mb-6 glass p-1 rounded-lg flex overflow-x-auto no-scrollbar">
        <button
          onClick={() => navigate('/network/connections')}
          className={`px-4 py-2 rounded-lg mr-1 flex items-center whitespace-nowrap ${
            activeTab === 'connections' ? 'glass-light' : 'hover:bg-dark-light/50'
          }`}
        >
          <FaUserFriends className="mr-2" /> Connections
        </button>
        <button
          onClick={() => navigate('/network/followers')}
          className={`px-4 py-2 rounded-lg mr-1 flex items-center whitespace-nowrap ${
            activeTab === 'followers' ? 'glass-light' : 'hover:bg-dark-light/50'
          }`}
        >
          <FaUsers className="mr-2" /> Followers
        </button>
        <button
          onClick={() => navigate('/network/following')}
          className={`px-4 py-2 rounded-lg mr-1 flex items-center whitespace-nowrap ${
            activeTab === 'following' ? 'glass-light' : 'hover:bg-dark-light/50'
          }`}
        >
          <FaUsers className="mr-2" /> Following
        </button>
        <button
          onClick={() => navigate('/network/suggestions')}
          className={`px-4 py-2 rounded-lg flex items-center whitespace-nowrap ${
            activeTab === 'suggestions' ? 'glass-light' : 'hover:bg-dark-light/50'
          }`}
        >
          <FaUserPlus className="mr-2" /> Suggestions
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Routes>
            <Route 
              path="/" 
              element={<Navigate to="/network/connections" replace />} 
            />
            <Route 
              path="/followers" 
              element={
                <UserList 
                  endpoint={`/api/users/${currentUser?.id}/followers`} 
                  title="People Following You" 
                  emptyMessage="You don't have any followers yet."
                  showFollowButton={true}
                  showConnectButton={true}
                />
              } 
            />
            <Route 
              path="/following" 
              element={
                <UserList 
                  endpoint={`/api/users/${currentUser?.id}/following`} 
                  title="People You Follow" 
                  emptyMessage="You're not following anyone yet."
                  showFollowButton={true}
                  showConnectButton={true}
                />
              } 
            />
            <Route 
              path="/suggestions" 
              element={
                <UserList 
                  endpoint="/api/users/suggestions" 
                  title="Suggested Connections" 
                  emptyMessage="No suggestions available right now."
                  showFollowButton={true}
                  showConnectButton={true}
                />
              } 
            />
            <Route 
              path="/connections" 
              element={
                <UserList 
                  endpoint="/api/users/connections" 
                  title="Your Connections" 
                  emptyMessage="You don't have any connections yet."
                  showFollowButton={true}
                  showConnectButton={false}
                />
              } 
            />
          </Routes>
        </div>
        
        <div className="space-y-6">
          <ErrorBoundary>
            <ConnectionRequests />
          </ErrorBoundary>
          <ErrorBoundary>
            <UserSuggestions limit={5} />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
};

export default Network; 