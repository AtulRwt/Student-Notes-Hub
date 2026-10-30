import { useState, useEffect, useRef } from 'react';
import { useChatStore } from '../../store/chatStore';
import type { Chat } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import MessageBubble from './MessageBubble';
import Avatar from '../shared/Avatar';
import { FaArrowLeft, FaPaperPlane, FaSmile, FaEllipsisV } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

interface ChatWindowProps {
  chat: Chat;
  onBack?: () => void;
}

const ChatWindow = ({ chat, onBack }: ChatWindowProps) => {
  const { user } = useAuthStore();
  const {
    messages,
    sendMessage,
    markAsRead,
    startTyping,
    stopTyping,
    typingStatus,
    onlineUsers
  } = useChatStore();

  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read when chat opens or new messages arrive
  useEffect(() => {
    if (messages.length > 0 && user) {
      const unreadMessages = messages
        .filter(msg => !msg.readBy?.some(r => r.userId === user.id) && msg.senderId !== user.id)
        .map(msg => msg.id);
      
      if (unreadMessages.length > 0) {
        markAsRead(chat.id, unreadMessages);
      }
    }
  }, [messages, chat.id, user]);

  const handleInputChange = (value: string) => {
    setMessageInput(value);

    // Handle typing indicator
    if (value.trim() && !isTyping) {
      setIsTyping(true);
      startTyping(chat.id);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      stopTyping(chat.id);
    }, 1000);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageInput.trim()) return;

    sendMessage(chat.id, messageInput.trim());
    setMessageInput('');
    setIsTyping(false);
    stopTyping(chat.id);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const getChatName = () => {
    if (chat.type === 'group') {
      return chat.name || 'Group Chat';
    }
    
    const otherMember = chat.otherMembers?.[0];
    return otherMember?.name || 'Unknown User';
  };

  const getChatAvatar = () => {
    if (chat.type === 'group') {
      return undefined;
    }
    
    const otherMember = chat.otherMembers?.[0];
    return otherMember?.profileImage;
  };

  const getOnlineStatus = () => {
    if (chat.type === 'group') return null;
    
    const otherMember = chat.otherMembers?.[0];
    if (!otherMember) return null;
    
    return onlineUsers.has(otherMember.id);
  };

  const isOtherUserTyping = () => {
    if (!user) return false;
    const typing = typingStatus[chat.id];
    if (!typing) return false;
    
    return Object.entries(typing).some(
      ([userId, isTyping]) => userId !== user.id && isTyping
    );
  };

  const isOnline = getOnlineStatus();
  const otherUserTyping = isOtherUserTyping();

  return (
    <div className="h-full flex flex-col bg-dark-lighter/20">
      {/* Chat Header */}
      <div className="p-4 border-b border-dark-accent/20 flex items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="mr-2 text-light hover:text-blue-400 transition-colors"
          >
            <FaArrowLeft size={20} />
          </button>
        )}
        
        <div className="relative">
          <Avatar
            src={getChatAvatar()}
            alt={getChatName()}
            size="md"
          />
          {isOnline && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-dark" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-light truncate">{getChatName()}</h2>
          <p className="text-xs text-accent">
            {otherUserTyping ? (
              <span className="text-blue-400 animate-pulse">typing...</span>
            ) : isOnline !== null ? (
              isOnline ? 'Online' : 'Offline'
            ) : (
              `${chat.otherMembers?.length || 0} members`
            )}
          </p>
        </div>

        <button className="text-light hover:text-blue-400 transition-colors">
          <FaEllipsisV />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-accent">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const isOwn = message.senderId === user?.id;
              const showAvatar = index === 0 || messages[index - 1].senderId !== message.senderId;
              
              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwn={isOwn}
                  showAvatar={showAvatar}
                />
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-dark-accent/20">
        <form onSubmit={handleSendMessage} className="flex items-end gap-2">
          <button
            type="button"
            className="p-3 text-accent hover:text-blue-400 transition-colors"
            onClick={() => toast('Emoji picker coming soon!', { icon: '😊' })}
          >
            <FaSmile size={20} />
          </button>

          <div className="flex-1">
            <textarea
              value={messageInput}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              placeholder="Type a message..."
              className="w-full bg-dark-light border border-dark-accent rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none max-h-32 text-light"
              rows={1}
              style={{
                minHeight: '48px',
                maxHeight: '128px'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={!messageInput.trim()}
            className="p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-dark-accent disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            <FaPaperPlane size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
