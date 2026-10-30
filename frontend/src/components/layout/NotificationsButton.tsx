import { useState, useEffect, useRef, Fragment } from 'react';
import { FaBell } from 'react-icons/fa';
import apiClient from '../../api/axios';
import NotificationsPanel from '../social/NotificationsPanel';

const NotificationsButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchUnreadCount();

    // Set up interval to check for new notifications every minute
    const interval = setInterval(fetchUnreadCount, 60000);

    return () => clearInterval(interval);
  }, []);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      // Use a small delay to avoid the same click that opened the panel from closing it
      const timer = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 0);
      return () => {
        clearTimeout(timer);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  const fetchUnreadCount = async () => {
    try {
      // Fetch a full page of notifications to get an accurate unread count
      const response = await apiClient.get('/api/users/notifications?limit=50');

      // Count all unread notifications from the response
      const unread = response.data.notifications.filter((n: any) => !n.read).length;
      setUnreadCount(unread);
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

  const handleClose = () => {
    setIsOpen(false);
    fetchUnreadCount(); // Refresh count after closing
  };

  return (
    <Fragment>
      {/* Background overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
      )}

      <div className="relative">
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
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <div ref={panelRef} className="pointer-events-auto w-full max-w-md mx-4">
              <NotificationsPanel onClose={handleClose} onNotificationsRead={handleNotificationsRead} />
            </div>
          </div>
        )}
      </div>
    </Fragment>
  );
};

export default NotificationsButton;