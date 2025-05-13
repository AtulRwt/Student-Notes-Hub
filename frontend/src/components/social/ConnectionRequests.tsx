import { useEffect, useState } from 'react';
import { FaUserCheck, FaUserTimes, FaExclamationTriangle, FaRedo } from 'react-icons/fa';
import Avatar from '../shared/Avatar';
import ErrorBoundary from '../ErrorBoundary';
import { useNetworkStore } from '../../store/networkStore';
import type { ConnectionRequest } from '../../store/networkStore';
import { Link } from 'react-router-dom';

const ConnectionRequests = () => {
  const { connectionRequests, isLoading, error, fetchConnectionRequests, acceptConnectionRequest, declineConnectionRequest } = useNetworkStore();
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    fetchConnectionRequests();
    // Set up refresh interval
    const intervalId = setInterval(() => {
      fetchConnectionRequests();
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(intervalId);
  }, [fetchConnectionRequests]);

  const handleAction = async (userId: string, action: 'accept' | 'decline') => {
    if (actionInProgress === userId) return;
    
    setActionInProgress(userId);
    setActionError(null);
    
    try {
      if (action === 'accept') {
        await acceptConnectionRequest(userId);
      } else {
        await declineConnectionRequest(userId);
      }
    } catch (error) {
      console.error(`Error ${action}ing connection request:`, error);
      setActionError(`Failed to ${action} request. Please try again.`);
    } finally {
      setActionInProgress(null);
    }
  };

  const renderRequestItem = (request: ConnectionRequest) => {
    // Skip requests without sender info
    if (!request.sender || !request.sender.id) {
      return null;
    }
    
    const sender = request.sender; // Non-null assertion through conditional above
    const isProcessing = actionInProgress === sender.id;
    
    return (
      <div key={request.id} className="p-4 glass-card rounded-lg mb-3 last:mb-0">
        <div className="flex items-center justify-between">
          <Link to={`/profile/${sender.id}`} className="flex items-center">
            <Avatar 
              src={sender.profileImage} 
              alt={sender.name || 'User'} 
              size="md"
            />
            <div className="ml-3">
              <h3 className="font-medium">{sender.name}</h3>
              {sender.bio && (
                <p className="text-sm text-accent line-clamp-1">{sender.bio}</p>
              )}
            </div>
          </Link>
          
          <div className="flex space-x-2">
            <button
              onClick={() => handleAction(sender.id, 'accept')}
              disabled={isProcessing}
              className={`p-2 rounded-full ${
                isProcessing 
                  ? 'bg-gray-700 cursor-not-allowed'
                  : 'bg-green-600/80 hover:bg-green-700'
              }`}
              title="Accept connection request"
            >
              {isProcessing ? (
                <div className="animate-spin h-5 w-5">
                  <FaRedo size={14} />
                </div>
              ) : (
                <FaUserCheck size={14} />
              )}
            </button>
            
            <button
              onClick={() => handleAction(sender.id, 'decline')}
              disabled={isProcessing}
              className={`p-2 rounded-full ${
                isProcessing 
                  ? 'bg-gray-700 cursor-not-allowed'
                  : 'bg-red-600/80 hover:bg-red-700'
              }`}
              title="Decline connection request"
            >
              <FaUserTimes size={14} />
            </button>
          </div>
        </div>
        
        {/* Time since request */}
        <div className="mt-2 text-xs text-accent">
          {new Date(request.createdAt).toLocaleDateString()}
        </div>
      </div>
    );
  };

  if (isLoading && connectionRequests.length === 0) {
    return (
      <div className="glass-card p-4 rounded-lg animate-pulse">
        <div className="h-6 bg-dark-light rounded w-2/3 mb-4"></div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-dark-light"></div>
            <div className="ml-3">
              <div className="h-4 bg-dark-light rounded w-24 mb-2"></div>
              <div className="h-3 bg-dark-light rounded w-32"></div>
            </div>
          </div>
          <div className="flex space-x-2">
            <div className="h-8 w-8 rounded-full bg-dark-light"></div>
            <div className="h-8 w-8 rounded-full bg-dark-light"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-4 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Connection Requests</h2>
          <button 
            onClick={() => fetchConnectionRequests()}
            className="p-1 text-blue-400 hover:text-blue-300"
            title="Refresh connection requests"
          >
            <FaRedo size={14} />
          </button>
        </div>
        <div className="text-red-400 py-3 flex items-center justify-center">
          <FaExclamationTriangle className="mr-2" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (connectionRequests.length === 0) {
    return (
      <div className="glass-card p-4 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Connection Requests</h2>
          <button 
            onClick={() => fetchConnectionRequests()}
            className="p-1 text-blue-400 hover:text-blue-300"
            title="Refresh connection requests"
          >
            <FaRedo size={14} />
          </button>
        </div>
        <p className="text-center text-accent py-4">No pending connection requests</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-4 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Connection Requests</h2>
        <button 
          onClick={() => fetchConnectionRequests()}
          className={`p-1 text-blue-400 hover:text-blue-300 ${isLoading ? 'animate-spin' : ''}`}
          disabled={isLoading}
          title="Refresh connection requests"
        >
          <FaRedo size={14} />
        </button>
      </div>
      
      {actionError && (
        <div className="text-red-400 mb-3 text-sm">
          {actionError}
        </div>
      )}
      
      <div className="space-y-3">
        {connectionRequests.map(renderRequestItem)}
      </div>
    </div>
  );
};

const ConnectionRequestsWithErrorBoundary = () => (
  <ErrorBoundary
    fallback={
      <div className="glass-card p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Connection Requests</h2>
        <p className="text-red-400 text-center">Failed to load connection requests</p>
      </div>
    }
  >
    <ConnectionRequests />
  </ErrorBoundary>
);

export default ConnectionRequestsWithErrorBoundary; 