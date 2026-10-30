import { useEffect, useState, useMemo } from 'react';
import { FaUserFriends, FaUserPlus, FaSearch, FaTimesCircle } from 'react-icons/fa';
import { useNetworkStore } from '../store/networkStore';
import Avatar from '../components/shared/Avatar';
import ConnectionRequests from '../components/social/ConnectionRequests';
import { Link } from 'react-router-dom';

const ConnectionsPage = () => {
  const { connections, isLoading, fetchConnections } = useNetworkStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState<'name' | 'all'>('all');

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  // Advanced search functionality with multiple criteria
  const filteredConnections = useMemo(() => {
    if (!searchQuery.trim()) return connections;
    
    const query = searchQuery.toLowerCase().trim();
    
    return connections.filter(connection => {
      if (searchField === 'name') {
        return connection.name.toLowerCase().includes(query);
      }
      
      // Search in all fields
      return (
        connection.name.toLowerCase().includes(query) ||
        (connection.bio?.toLowerCase().includes(query) || false)
      );
    });
  }, [connections, searchQuery, searchField]);

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <h1 className="text-3xl font-bold mb-8 flex items-center">
        <FaUserFriends className="mr-3 text-purple-500" />
        Your Network
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main content area with connections */}
        <div className="md:col-span-2">
          <div className="glass p-6 rounded-lg mb-6">
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Your Connections</h2>
                <div className="flex space-x-2">
                  <select
                    value={searchField}
                    onChange={(e) => setSearchField(e.target.value as 'name' | 'all')}
                    className="bg-dark-light rounded-md text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">All Fields</option>
                    <option value="name">Name Only</option>
                  </select>
                </div>
              </div>
              
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search connections..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-10 py-2 bg-dark-light rounded-full text-sm w-full focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <FaSearch className="absolute left-3 top-2.5 text-accent" />
                {searchQuery && (
                  <button 
                    onClick={clearSearch}
                    className="absolute right-3 top-2.5 text-accent hover:text-white transition-colors"
                  >
                    <FaTimesCircle />
                  </button>
                )}
              </div>
              
              {searchQuery && (
                <div className="text-sm text-accent">
                  Found {filteredConnections.length} {filteredConnections.length === 1 ? 'connection' : 'connections'} 
                  {searchField !== 'all' && ` with ${searchField}: `}
                  {searchQuery && <span className="font-semibold text-purple-400">"{searchQuery}"</span>}
                </div>
              )}
            </div>

            {isLoading ? (
              <div className="animate-pulse space-y-4">
                {[...Array(5)].map((_, index) => (
                  <div key={index} className="flex items-center p-3 glass-light rounded-lg">
                    <div className="w-12 h-12 bg-dark-medium rounded-full"></div>
                    <div className="ml-3 flex-1">
                      <div className="h-4 bg-dark-medium rounded w-1/4 mb-2"></div>
                      <div className="h-3 bg-dark-medium rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredConnections.length === 0 ? (
              searchQuery ? (
                <div className="text-center p-8">
                  <div className="inline-block p-4 rounded-full bg-dark-light mb-4">
                    <FaSearch size={32} className="text-accent" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No results found</h3>
                  <p className="text-accent mb-4">Try a different search query or filter</p>
                  <button 
                    onClick={clearSearch}
                    className="inline-block px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md transition-colors text-white"
                  >
                    Clear search
                  </button>
                </div>
              ) : (
                <div className="text-center p-8">
                  <div className="inline-block p-4 rounded-full bg-dark-light mb-4">
                    <FaUserPlus size={32} className="text-accent" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No connections yet</h3>
                  <p className="text-accent mb-4">Connect with other users to start building your network</p>
                  <Link 
                    to="/network/suggestions" 
                    className="inline-block px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md transition-colors text-white"
                  >
                    Find people to connect with
                  </Link>
                </div>
              )
            ) : (
              <div className="space-y-3">
                {filteredConnections.map(connection => (
                  <div key={connection.id} className="flex items-center justify-between p-4 glass-light rounded-lg hover:bg-dark-medium transition-colors">
                    <div className="flex items-center">
                      <Avatar
                        src={connection.profileImage}
                        alt={connection.name}
                        size="md"
                      />
                      <div className="ml-3">
                        <Link to={`/profile/${connection.id}`} className="font-medium hover:text-purple-400 transition-colors">
                          {connection.name}
                        </Link>
                        {connection.bio && (
                          <p className="text-sm text-accent line-clamp-1">{connection.bio}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-accent">
                      {connection._count && (
                        <p>{connection._count.notes} notes · {connection._count.followers} followers</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar with connection requests */}
        <div className="space-y-6">
          <ConnectionRequests />
          
          <div className="glass rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">Network Management</h3>
            <div className="space-y-2">
              <Link 
                to="/network/followers" 
                className="block p-3 glass-light rounded-lg hover:bg-dark-medium transition-colors"
              >
                View your followers
              </Link>
              <Link 
                to="/network/following" 
                className="block p-3 glass-light rounded-lg hover:bg-dark-medium transition-colors"
              >
                People you follow
              </Link>
              <Link 
                to="/network/suggestions" 
                className="block p-3 glass-light rounded-lg hover:bg-dark-medium transition-colors"
              >
                Suggested connections
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectionsPage; 