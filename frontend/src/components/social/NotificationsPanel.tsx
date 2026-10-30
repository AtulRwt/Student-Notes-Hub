import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { 
  FaUserPlus, 
  FaUserFriends, 
  FaComment, 
  FaHeart, 
  FaBell, 
  FaCheck,
  FaChevronLeft,
  FaChevronRight,
  FaRegBell,
  FaTimes,
  FaSpinner
} from 'react-icons/fa';
import Avatar from '../shared/Avatar';
import apiClient from '../../api/axios';
import { Link } from 'react-router-dom';

interface Notification {
  id: string;
  userId: string;
  causerId: string;
  type: string;
  read: boolean;
  data: any;
  createdAt: string;
  causer: {
    id: string;
    name: string;
    profileImage: string | null;
  };
}

interface NotificationsPanelProps {
  onClose?: () => void;
  onNotificationsRead?: () => void;
}

const NotificationsPanel = ({ onClose, onNotificationsRead }: NotificationsPanelProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMarkingAsRead, setIsMarkingAsRead] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, [page]);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get(`/api/users/notifications?page=${page}&limit=10`);
      setNotifications(response.data.notifications);
      setTotalPages(response.data.totalPages);
      
      // Count unread notifications
      const unread = response.data.notifications.filter((n: Notification) => !n.read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async () => {
    try {
      setIsMarkingAsRead(true);
      const unreadNotificationIds = notifications
        .filter(n => !n.read)
        .map(n => n.id);
      
      if (unreadNotificationIds.length === 0) return;
      
      await apiClient.put('/api/users/notifications/read', {
        notificationIds: unreadNotificationIds
      });
      
      // Update local state
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      
      // Call parent callback if provided
      if (onNotificationsRead) {
        onNotificationsRead();
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    } finally {
      setIsMarkingAsRead(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'follow':
        return <FaUserPlus className="text-blue-400" />;
      case 'connection_request':
        return <FaUserFriends className="text-purple-400" />;
      case 'connection_accepted':
        return <FaCheck className="text-green-400" />;
      case 'comment':
        return <FaComment className="text-yellow-400" />;
      case 'like':
        return <FaHeart className="text-red-400" />;
      default:
        return <FaBell className="text-blue-400" />;
    }
  };

  const getBackgroundColor = (type: string) => {
    switch (type) {
      case 'follow':
        return 'bg-blue-900/20';
      case 'connection_request':
        return 'bg-purple-900/20';
      case 'connection_accepted':
        return 'bg-green-900/20';
      case 'comment':
        return 'bg-yellow-900/20';
      case 'like':
        return 'bg-red-900/20';
      default:
        return 'bg-blue-900/20';
    }
  };

  const getNotificationMessage = (notification: Notification) => {
    const name = notification.causer.name;
    
    switch (notification.type) {
      case 'follow':
        return `${name} started following you`;
      case 'connection_request':
        return `${name} sent you a connection request`;
      case 'connection_accepted':
        return `${name} accepted your connection request`;
      case 'comment':
        return `${name} commented on your note`;
      case 'like':
        return `${name} liked your note`;
      default:
        return `New notification from ${name}`;
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  if (isLoading && notifications.length === 0) {
    return (
      <div className="glass backdrop-blur-md max-w-md w-full rounded-lg p-4 overflow-hidden shadow-xl animate-pulse">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <FaBell className="text-blue-400" />
            <div className="h-6 bg-dark-light rounded w-24"></div>
          </div>
          <div className="h-6 bg-dark-light rounded w-20"></div>
        </div>
        
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-3 p-3 rounded-lg bg-dark-light/30">
              <div className="w-10 h-10 rounded-full bg-dark-medium"></div>
              <div className="flex-1">
                <div className="h-4 bg-dark-medium rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-dark-medium rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass backdrop-blur-md max-w-md w-full rounded-lg overflow-hidden shadow-xl border border-dark-accent/30 animate-fadeIn">
      <div className="p-4 border-b border-dark-medium bg-dark-light/20">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FaBell className="text-blue-400" />
            <h2 className="text-lg font-semibold text-white">Notifications</h2>
            {unreadCount > 0 && (
              <span className="bg-blue-600 text-white text-xs font-bold rounded-full px-2 py-0.5 animate-pulse">
                {unreadCount} new
              </span>
            )}
          </div>
          
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <button 
                onClick={markAsRead}
                disabled={isMarkingAsRead}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
              >
                {isMarkingAsRead ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    <span>Marking...</span>
                  </>
                ) : (
                  <span>Mark all as read</span>
                )}
              </button>
            )}
            {onClose && (
              <button 
                onClick={onClose}
                className="text-accent hover:text-white transition-colors p-1 rounded-full hover:bg-dark-light/30"
                aria-label="Close"
              >
                <FaTimes />
              </button>
            )}
          </div>
        </div>
      </div>
      
      <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="py-12 px-4 text-center text-accent">
            <FaRegBell className="mx-auto text-3xl mb-3 text-blue-400/50 animate-scaleIn" />
            <p className="text-xl font-medium mb-1 animate-fadeIn" style={{ animationDelay: '100ms' }}>No notifications yet</p>
            <p className="text-sm animate-fadeIn" style={{ animationDelay: '200ms' }}>When you get notifications, they'll appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-dark-medium/30">
            {notifications.map((notification, index) => (
              <Link 
                to={`/profile/${notification.causer.id}`}
                key={notification.id} 
                className={`p-4 hover:bg-dark-light/20 flex gap-3 transition-all animate-slideIn ${
                  !notification.read ? 'bg-dark-light/10 border-l-2 border-blue-500' : ''
                } ${getBackgroundColor(notification.type)}`}
                style={{ 
                  animationDelay: `${index * 50}ms`,
                  animationFillMode: 'backwards'
                }}
              >
                <div className="flex-shrink-0">
                  <Avatar 
                    src={notification.causer.profileImage} 
                    alt={notification.causer.name} 
                    size="md"
                    className={`border-2 border-dark-medium ${!notification.read ? 'animate-glow' : ''}`}
                  />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-start gap-2">
                    <div className={`mt-1 p-1.5 rounded-full bg-dark-medium ${!notification.read ? 'animate-pulse' : ''}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {getNotificationMessage(notification)}
                      </p>
                      <p className="text-xs text-accent mt-1">
                        {getTimeAgo(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
                
                {!notification.read && (
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 animate-pulse"></div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
      
      {totalPages > 1 && (
        <div className="p-3 border-t border-dark-medium/50 flex justify-between items-center bg-dark-light/10">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-full hover:bg-dark-medium/50 disabled:opacity-30 transition-all disabled:hover:bg-transparent"
            aria-label="Previous page"
          >
            <FaChevronLeft size={14} />
          </button>
          <span className="text-xs font-medium bg-dark-medium/30 px-2 py-1 rounded-full">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-full hover:bg-dark-medium/50 disabled:opacity-30 transition-all disabled:hover:bg-transparent"
            aria-label="Next page"
          >
            <FaChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationsPanel; 