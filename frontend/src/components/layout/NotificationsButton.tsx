import { useState, useEffect, useRef } from 'react';
import { FaBell } from 'react-icons/fa';
import apiClient from '../../api/axios';
import NotificationsPanel from '../social/NotificationsPanel';

const NotificationsButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchUnreadCount();
    
    // Set up interval to check for new notifications every minute
    const interval = setInterval(fetchUnreadCount, 60000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Add click outside handler
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen]);

  const fetchUnreadCount = async () => {
    try {
      const response = await apiClient.get('/api/users/notifications?limit=1');
      
      // Count unread notifications
      const unread = response.data.notifications.filter((n: any) => !n.read).length;
      
      // If there are more unread than just the ones on the first page
      if (unread === response.data.notifications.length && response.data.totalCount > response.data.notifications.length) {
        setUnreadCount(response.data.totalCount);
      } else {
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Error fetching notifications count:', error);
    }
  };

  const toggleNotifications = () => {
    setIsOpen(!isOpen);
  };

  // Handle notifications being marked as read
  const handleNotificationsRead = () => {
    setUnreadCount(0);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={toggleNotifications}
        className="relative p-2 rounded-full hover:bg-dark-light transition-colors"
        aria-label="Notifications"
      >
        <FaBell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 z-50 animate-fadeIn">
          <NotificationsPanel onClose={() => setIsOpen(false)} onNotificationsRead={handleNotificationsRead} />
        </div>
      )}
    </div>
  );
};

export default NotificationsButton; 