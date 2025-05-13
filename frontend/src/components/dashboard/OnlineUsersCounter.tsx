import { useState, useEffect, useRef } from 'react';
import { FaCircle, FaUserFriends } from 'react-icons/fa';
import { useAuthStore } from '../../store/authStore';
import { useAnalyticsStore } from '../../store/analyticsStore';

// API base URL - use environment variable in production
const API_URL = 'http://localhost:5000/api';

// Interface for the data from the store
interface OnlineUserWithAvatar extends Record<string, any> {
  id: string;
  name: string;
  department: string;
  lastAction: string;
  lastActive: Date;
  avatar?: string;
}

// Department activity interface
interface DepartmentActivity {
  [key: string]: number;
}

const OnlineUsersCounter = () => {
  const { user } = useAuthStore();
  const { 
    onlineData, 
    isLoading, 
    fetchOnlineUsers, 
    trackUserAction, 
    updateOnlineStatus 
  } = useAnalyticsStore(state => ({
    onlineData: state.onlineData,
    isLoading: state.isLoading,
    fetchOnlineUsers: state.fetchOnlineUsers,
    trackUserAction: state.trackUserAction,
    updateOnlineStatus: state.updateOnlineStatus
  }));
  
  const [showAnimation, setShowAnimation] = useState(false);
  const [previousCount, setPreviousCount] = useState(0);
  const [newUserIds, setNewUserIds] = useState<string[]>([]);
  const previousUsers = useRef<{[key: string]: boolean}>({});

  // Initial data fetch
  useEffect(() => {
    fetchOnlineUsers();
    
    // Update current user's online status
    if (user) {
      // Track initial page view action
      trackUserAction('Viewing dashboard');
      updateOnlineStatus();
    }
  }, [user, fetchOnlineUsers, trackUserAction, updateOnlineStatus]);

  // Poll for updates every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOnlineUsers();
      
      // Periodically update the current user's online status
      if (user) {
        updateOnlineStatus();
      }
    }, 10000);
    
    return () => {
      clearInterval(interval);
      
      // If component is unmounting due to logout, ensure user is removed from online users
      if (user && !window.location.pathname.includes('/login')) {
        useAnalyticsStore.getState().userLogout().catch(error => {
          console.error('Error during component unmount logout:', error);
        });
      }
    };
  }, [user, fetchOnlineUsers, updateOnlineStatus]);

  // Track page interactions
  useEffect(() => {
    if (!user) return;

    let lastTrackTime = Date.now();
    const TRACKING_INTERVAL = 30000; // 30 seconds between tracking events

    // Track user interactions with the page, but throttle to avoid too many requests
    const trackInteraction = () => {
      const now = Date.now();
      if (now - lastTrackTime > TRACKING_INTERVAL) {
        trackUserAction('Interacting with page');
        lastTrackTime = now;
      }
    };

    // Listen for user activity
    window.addEventListener('click', trackInteraction);
    window.addEventListener('keydown', trackInteraction);
    
    return () => {
      window.removeEventListener('click', trackInteraction);
      window.removeEventListener('keydown', trackInteraction);
    };
  }, [user, trackUserAction]);

  // Update animation when online count changes and track new users
  useEffect(() => {
    if (!onlineData) return;
    
    const currentUserIds: {[key: string]: boolean} = {};
    const newIds: string[] = [];
    
    // Find new users that weren't in the previous data
    onlineData.onlineUsers.forEach(user => {
      currentUserIds[user.id] = true;
      if (!previousUsers.current[user.id]) {
        newIds.push(user.id);
      }
    });
    
    // Update states based on changes
    if (onlineData.onlineCount > previousCount || newIds.length > 0) {
      setShowAnimation(true);
      setNewUserIds(newIds);
      setTimeout(() => {
        setShowAnimation(false);
        setNewUserIds([]);
      }, 3000);
    }
    
    setPreviousCount(onlineData.onlineCount);
    previousUsers.current = currentUserIds;
  }, [onlineData, previousCount]);

  // Function to format elapsed time
  const formatElapsedTime = (dateString: string | Date) => {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour ago';
    return `${hours} hours ago`;
  };

  // Loading state UI
  if (isLoading && !onlineData) {
    return (
      <div className="glass rounded-lg p-6 mb-8 min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-400 border-r-transparent mb-4"></div>
          <p>Loading online users...</p>
        </div>
      </div>
    );
  }

  // Fall back to empty data if onlineData is null
  const data = onlineData || {
    onlineCount: 0,
    onlineUsers: [],
    departmentActivity: {}
  };

  return (
    <div className="glass rounded-lg p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold gradient-text">Real-time Activity</h2>
        <div className="flex items-center bg-dark-lighter rounded-full px-4 py-2">
          <div className={`relative ${showAnimation ? 'animate-ping-once' : ''}`}>
            <FaCircle className="text-green-500 text-sm mr-2" />
            {showAnimation && (
              <FaCircle className="text-green-500 text-sm absolute top-0 left-0 animate-ping opacity-75" />
            )}
          </div>
          <span className="font-bold">{data.onlineCount}</span>
          <span className="text-light-darker ml-2">online now</span>
        </div>
      </div>
      
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <FaUserFriends className="text-blue-400 mr-2" />
          <h3 className="text-lg font-semibold">Currently Active Users</h3>
        </div>
        
        <div className="glass-light rounded-lg overflow-hidden">
          <div className="max-h-80 overflow-y-auto">
            {data.onlineUsers.length > 0 ? (
              data.onlineUsers.map(user => {
                // Treat user as our extended type with optional avatar
                const onlineUser = user as OnlineUserWithAvatar;
                const isNew = newUserIds.includes(onlineUser.id);
                
                return (
                  <div 
                    key={onlineUser.id} 
                    className={`flex items-center p-3 border-b border-dark-accent/20 last:border-b-0 hover:bg-dark-lighter/30 transition-colors ${
                      isNew ? 'bg-dark-accent/10' : ''
                    }`}
                  >
                    {/* User avatar - either image or initials */}
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-r from-blue-500/40 to-purple-500/40 flex items-center justify-center mr-3 flex-shrink-0 ${
                      isNew ? 'ring-2 ring-green-400 ring-opacity-70' : ''
                    }`}>
                      {onlineUser.avatar ? (
                        <img src={onlineUser.avatar} alt={onlineUser.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="text-sm font-medium">{onlineUser.name.split(' ').map(n => n[0]).join('')}</span>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <p className="font-medium truncate">{onlineUser.name}</p>
                        <span className="text-xs text-light-darker">{formatElapsedTime(onlineUser.lastActive)}</span>
                      </div>
                      <div className="flex justify-between">
                        <p className="text-xs text-light-darker truncate">{onlineUser.department}</p>
                        <p className="text-xs text-blue-400 truncate italic">{onlineUser.lastAction || 'Online'}</p>
                      </div>
                    </div>
                    
                    <div className={`ml-2 w-2 h-2 rounded-full bg-green-500 ${isNew ? 'animate-pulse' : ''}`}></div>
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center text-light-darker">
                No users currently online
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Activity by Department</h3>
          <span className="text-xs text-light-darker">Real-time data</span>
        </div>
        
        <div className="space-y-3">
          {Object.entries(data.departmentActivity).length > 0 ? (
            Object.entries(data.departmentActivity).map(([department, percentage]) => {
              // Generate a consistent color based on the department name
              const getColorClass = (dept: string) => {
                const deptHash = dept.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                const colorIndex = deptHash % 6;
                const colors = [
                  'bg-blue-500', 'bg-green-500', 'bg-purple-500', 
                  'bg-amber-500', 'bg-cyan-500', 'bg-pink-500'
                ];
                return colors[colorIndex];
              };
              
              return (
                <div key={department} className="glass-light p-3 rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <p className="font-medium">{department}</p>
                    <span className="text-sm font-bold">{percentage}%</span>
                  </div>
                  <div className="h-2 w-full bg-dark-light rounded-full overflow-hidden">
                    <div 
                      className={`h-2 rounded-full ${getColorClass(department)}`} 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-4 text-center text-light-darker">
              No department activity data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnlineUsersCounter; 