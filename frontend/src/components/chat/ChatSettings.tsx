import { useState } from 'react';
import { FaTimes, FaBell, FaBellSlash, FaVolumeUp, FaVolumeMute, FaTrash } from 'react-icons/fa';
import { soundNotification } from '../../utils/soundNotification';
import { toast } from 'react-hot-toast';

interface ChatSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: string;
  chatName: string;
}

const ChatSettings = ({ isOpen, onClose, chatId, chatName }: ChatSettingsProps) => {
  const [soundEnabled, setSoundEnabled] = useState(soundNotification.isEnabled());
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    Notification.permission === 'granted'
  );

  const handleToggleSound = () => {
    if (soundEnabled) {
      soundNotification.disable();
      setSoundEnabled(false);
      toast.success('Sound notifications disabled');
    } else {
      soundNotification.enable();
      setSoundEnabled(true);
      soundNotification.play();
      toast.success('Sound notifications enabled');
    }
  };

  const handleToggleNotifications = async () => {
    if (notificationsEnabled) {
      setNotificationsEnabled(false);
      toast.success('Browser notifications disabled');
    } else {
      const granted = await Notification.requestPermission();
      if (granted === 'granted') {
        setNotificationsEnabled(true);
        toast.success('Browser notifications enabled');
      } else {
        toast.error('Notification permission denied');
      }
    }
  };

  const handleClearChat = async () => {
    if (window.confirm('Are you sure you want to clear all messages in this chat? This action cannot be undone.')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/chat/chats/${chatId}/messages`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          toast.success('Chat cleared successfully');
          // Refresh the page to show empty chat
          window.location.reload();
        } else {
          toast.error('Failed to clear chat');
        }
      } catch (error) {
        console.error('Clear chat error:', error);
        toast.error('Failed to clear chat');
      }
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="glass-light rounded-xl max-w-md w-full animate-scaleIn">
        {/* Header */}
        <div className="p-6 border-b border-dark-accent/20 flex items-center justify-between">
          <h2 className="text-xl font-bold gradient-text">Chat Settings</h2>
          <button
            onClick={onClose}
            className="text-accent hover:text-light transition-colors"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Chat Info */}
          <div>
            <h3 className="text-sm font-semibold text-accent mb-2">Chat Name</h3>
            <p className="text-light">{chatName}</p>
          </div>

          {/* Sound Notifications */}
          <div>
            <button
              onClick={handleToggleSound}
              className="w-full flex items-center justify-between p-4 glass rounded-lg hover:bg-dark-light/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                {soundEnabled ? (
                  <FaVolumeUp className="text-blue-400 text-xl" />
                ) : (
                  <FaVolumeMute className="text-accent text-xl" />
                )}
                <div className="text-left">
                  <p className="font-semibold">Sound Notifications</p>
                  <p className="text-sm text-accent">Play sound for new messages</p>
                </div>
              </div>
              <div
                className={`w-12 h-6 rounded-full transition-colors ${
                  soundEnabled ? 'bg-blue-600' : 'bg-dark-accent'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full mt-0.5 transition-transform ${
                    soundEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </div>
            </button>
          </div>

          {/* Browser Notifications */}
          <div>
            <button
              onClick={handleToggleNotifications}
              className="w-full flex items-center justify-between p-4 glass rounded-lg hover:bg-dark-light/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                {notificationsEnabled ? (
                  <FaBell className="text-blue-400 text-xl" />
                ) : (
                  <FaBellSlash className="text-accent text-xl" />
                )}
                <div className="text-left">
                  <p className="font-semibold">Browser Notifications</p>
                  <p className="text-sm text-accent">Show desktop notifications</p>
                </div>
              </div>
              <div
                className={`w-12 h-6 rounded-full transition-colors ${
                  notificationsEnabled ? 'bg-blue-600' : 'bg-dark-accent'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full mt-0.5 transition-transform ${
                    notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </div>
            </button>
          </div>

          {/* Danger Zone */}
          <div className="pt-4 border-t border-dark-accent/20">
            <h3 className="text-sm font-semibold text-red-400 mb-3">Danger Zone</h3>
            <button
              onClick={handleClearChat}
              className="w-full flex items-center gap-3 p-4 bg-red-900/20 hover:bg-red-900/30 rounded-lg text-red-400 transition-colors"
            >
              <FaTrash />
              <div className="text-left">
                <p className="font-semibold">Clear Chat History</p>
                <p className="text-sm opacity-70">Delete all messages in this chat</p>
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-dark-accent/20">
          <button
            onClick={onClose}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatSettings;
