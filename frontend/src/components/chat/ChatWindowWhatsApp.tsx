import { useState, useEffect, useRef } from 'react';
import { useChatStore } from '../../store/chatStore';
import type { Chat, Message } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import MessageBubbleWhatsApp from './MessageBubbleWhatsApp';
import Avatar from '../shared/Avatar';
import EmojiPicker from './EmojiPicker';
import ChatSettings from './ChatSettings';
import ForwardMessageModal from './ForwardMessageModal';
import { FaArrowLeft, FaPaperPlane, FaSmile, FaPaperclip, FaArrowDown, FaSearch, FaCog, FaTimes, FaImage } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';

interface ChatWindowWhatsAppProps {
  chat: Chat;
  onBack?: () => void;
}

const ChatWindowWhatsApp = ({ chat, onBack }: ChatWindowWhatsAppProps) => {
  const { user } = useAuthStore();
  const {
    messages,
    sendMessage,
    markAsRead,
    startTyping,
    stopTyping,
    typingStatus,
    onlineUsers,
    fetchMessages
  } = useChatStore();

  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [forwardingMessage, setForwardingMessage] = useState<Message | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load messages when chat opens
  useEffect(() => {
    if (chat.id) {
      fetchMessages(chat.id);
    }
  }, [chat.id]);

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 128) + 'px';
    }
  };

  // Scroll to bottom
  const scrollToBottom = (behavior: 'auto' | 'smooth' = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Check if should show scroll button
  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (container) {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom);
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    const timeout = setTimeout(() => scrollToBottom('auto'), 100);
    return () => clearTimeout(timeout);
  }, [messages.length]);

  // Mark messages as read
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
    adjustTextareaHeight();

    // Typing indicator
    if (value.trim() && !isTyping) {
      setIsTyping(true);
      startTyping(chat.id);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      stopTyping(chat.id);
    }, 1000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageInput.trim() && !selectedFile) return;

    // If there's a file, upload it first
    let fileUrl = undefined;
    let fileName = undefined;
    let fileType = undefined;

    if (selectedFile) {
      const uploadToast = toast.loading('Uploading file...');
      try {
        const formData = new FormData();
        formData.append('file', selectedFile);

        const token = localStorage.getItem('token');
        const apiUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
        const response = await fetch(`${apiUrl}/api/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        if (response.ok) {
          const data = await response.json();
          fileUrl = data.url;
          fileName = selectedFile.name;
          fileType = selectedFile.type;
          toast.success('File uploaded!', { id: uploadToast });
        } else {
          const errorData = await response.json();
          toast.error(errorData.error || 'Failed to upload file', { id: uploadToast });
          return;
        }
      } catch (error) {
        console.error('Upload error:', error);
        toast.error('Failed to upload file. Check your connection.', { id: uploadToast });
        return;
      }
    }

    sendMessage(chat.id, messageInput.trim(), replyingTo?.id, fileUrl, fileName, fileType);

    setMessageInput('');
    setReplyingTo(null);
    setSelectedFile(null);
    setFilePreview(null);
    setIsTyping(false);
    stopTyping(chat.id);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    // Scroll to bottom after sending
    setTimeout(() => scrollToBottom('auto'), 100);
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessageInput(prev => prev + emoji);
    inputRef.current?.focus();
    adjustTextareaHeight();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const handleReply = (message: Message) => {
    setReplyingTo(message);
    inputRef.current?.focus();
  };

  const handleForward = (message: Message) => {
    setForwardingMessage(message);
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

  const getDateSeparator = (date: string) => {
    const messageDate = new Date(date);
    if (isToday(messageDate)) {
      return 'Today';
    } else if (isYesterday(messageDate)) {
      return 'Yesterday';
    } else {
      return format(messageDate, 'MMMM d, yyyy');
    }
  };

  const shouldShowDateSeparator = (currentMsg: any, previousMsg: any) => {
    if (!previousMsg) return true;
    const currentDate = new Date(currentMsg.createdAt);
    const previousDate = new Date(previousMsg.createdAt);
    return !isSameDay(currentDate, previousDate);
  };

  const filteredMessages = searchQuery
    ? messages.filter(msg =>
      msg.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.sender?.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : messages;

  const isOnline = getOnlineStatus();
  const otherUserTyping = isOtherUserTyping();

  return (
    <div className="h-full flex flex-col">
      {/* Chat Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-white/5 backdrop-blur-xl bg-gradient-to-r from-dark/80 to-dark-lighter/80">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-white/10 rounded-xl transition-all duration-200 text-light hover:text-blue-400"
            >
              <FaArrowLeft size={18} />
            </button>
          )}

          <div className="relative">
            <div className={`${isOnline ? 'ring-2 ring-green-500/50 ring-offset-2 ring-offset-dark' : ''} rounded-full transition-all duration-200`}>
              <Avatar
                src={getChatAvatar()}
                alt={getChatName()}
                size="md"
              />
            </div>
            {isOnline && (
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-dark shadow-lg" />
            )}
          </div>

          <div className="flex-1 min-w-0 cursor-pointer group" onClick={() => setShowSettings(true)}>
            <h2 className="font-semibold text-light truncate group-hover:text-blue-400 transition-colors">{getChatName()}</h2>
            <p className="text-xs text-accent">
              {otherUserTyping ? (
                <span className="text-blue-400 font-medium animate-pulse">typing...</span>
              ) : isOnline !== null ? (
                isOnline ? <span className="text-green-400">Online</span> : 'Offline'
              ) : (
                `${chat.otherMembers?.length || 0} members`
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-2.5 text-light hover:text-blue-400 transition-all duration-200 rounded-xl hover:bg-white/10"
              title="Search messages"
            >
              <FaSearch size={16} />
            </button>

            <button
              onClick={() => setShowSettings(true)}
              className="p-2.5 text-light hover:text-blue-400 transition-all duration-200 rounded-xl hover:bg-white/10"
              title="Chat settings"
            >
              <FaCog size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Chat Settings Modal */}
      <ChatSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        chatId={chat.id}
        chatName={getChatName()}
      />

      {/* Forward Message Modal */}
      {forwardingMessage && (
        <ForwardMessageModal
          message={forwardingMessage}
          onClose={() => setForwardingMessage(null)}
        />
      )}

      {/* Search Bar */}
      {showSearch && (
        <div className="flex-shrink-0 px-6 py-3 border-b border-white/5 bg-dark-light/30 backdrop-blur-sm animate-fadeIn">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-accent" size={14} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in conversation..."
              className="w-full bg-white/5 border border-white/10 focus:border-blue-500/50 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-light text-sm placeholder-accent transition-all duration-200"
              autoFocus
            />
          </div>
          {searchQuery && (
            <p className="text-xs text-accent mt-2">
              {filteredMessages.length} message{filteredMessages.length !== 1 ? 's' : ''} found
            </p>
          )}
        </div>
      )}

      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-6 py-4 space-y-3 custom-scrollbar"
        style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255, 255, 255, 0.03) 1px, transparent 0)',
          backgroundSize: '32px 32px'
        }}
      >
        {filteredMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-2xl opacity-20 animate-pulse" />
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-blue-500/20 flex items-center justify-center backdrop-blur-xl">
                <FaArrowDown className="text-4xl text-blue-400" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-light mb-2">
                {searchQuery ? 'No messages found' : 'No messages yet'}
              </p>
              <p className="text-sm text-accent max-w-xs">
                {searchQuery
                  ? 'Try searching with different keywords'
                  : 'Start the conversation by sending a message below'}
              </p>
            </div>
          </div>
        ) : (
          <>
            {filteredMessages.map((message, index) => {
              const isOwn = message.senderId === user?.id;
              const showAvatar = index === 0 || filteredMessages[index - 1].senderId !== message.senderId;
              const showDateSeparator = shouldShowDateSeparator(message, filteredMessages[index - 1]);

              return (
                <div key={message.id}>
                  {showDateSeparator && (
                    <div className="flex items-center justify-center my-6">
                      <div className="bg-white/5 backdrop-blur-sm px-4 py-1.5 rounded-full text-xs text-accent border border-white/10 shadow-lg">
                        {getDateSeparator(message.createdAt)}
                      </div>
                    </div>
                  )}
                  <MessageBubbleWhatsApp
                    message={message}
                    isOwn={isOwn}
                    showAvatar={showAvatar}
                    onReply={handleReply}
                    onForward={handleForward}
                  />
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Scroll to Bottom Button */}
      {showScrollButton && (
        <button
          onClick={() => scrollToBottom('smooth')}
          className="absolute bottom-32 right-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white p-3 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 animate-fadeIn z-10 ring-4 ring-blue-500/20"
        >
          <FaArrowDown />
        </button>
      )}

      {/* Reply Preview */}
      {replyingTo && (
        <div className="flex-shrink-0 px-6 py-3 border-t border-white/5 bg-gradient-to-r from-blue-600/10 to-purple-600/10 backdrop-blur-sm animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0 border-l-4 border-blue-500 pl-3">
              <p className="text-xs text-blue-400 font-semibold mb-1">
                Replying to {replyingTo.sender?.name || 'User'}
              </p>
              <p className="text-sm text-light truncate">
                {replyingTo.content || 'Attachment'}
              </p>
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              className="p-2 hover:bg-white/10 rounded-lg transition-all duration-200 text-accent hover:text-light"
            >
              <FaTimes />
            </button>
          </div>
        </div>
      )}

      {/* File Preview */}
      {selectedFile && (
        <div className="flex-shrink-0 px-6 py-4 border-t border-white/5 bg-gradient-to-r from-blue-600/10 to-purple-600/10 backdrop-blur-sm animate-fadeIn">
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-blue-500/20">
            {filePreview ? (
              <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden">
                <img
                  src={filePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </div>
            ) : (
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg">
                <FaPaperclip className="text-white text-xl" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-light truncate mb-1">{selectedFile.name}</p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-blue-400 font-medium">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </span>
                <span className="text-xs text-accent">• Ready to send</span>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedFile(null);
                setFilePreview(null);
              }}
              className="p-2 hover:bg-red-500/20 rounded-lg transition-all duration-200 group"
              title="Remove file"
            >
              <FaTimes className="text-accent group-hover:text-red-400" />
            </button>
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="flex-shrink-0 px-6 py-4 border-t border-white/5 backdrop-blur-xl bg-gradient-to-r from-dark/80 to-dark-lighter/80">
        <form onSubmit={handleSendMessage} className="flex items-end gap-3">
          <div className="relative">
            {showEmojiPicker && (
              <EmojiPicker
                onEmojiSelect={handleEmojiSelect}
                onClose={() => setShowEmojiPicker(false)}
              />
            )}
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-3 text-accent hover:text-blue-400 hover:bg-white/10 rounded-xl transition-all duration-200"
            >
              <FaSmile size={20} />
            </button>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-accent hover:text-blue-400 hover:bg-white/10 rounded-xl transition-all duration-200"
          >
            <FaPaperclip size={20} />
          </button>

          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={messageInput}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              placeholder="Type a message..."
              className="w-full bg-white/5 hover:bg-white/10 focus:bg-white/10 border border-white/10 focus:border-blue-500/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none text-light placeholder-accent transition-all duration-200"
              rows={1}
              style={{
                minHeight: '48px',
                maxHeight: '128px'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={!messageInput.trim() && !selectedFile}
            className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-200 hover:shadow-lg disabled:opacity-50"
          >
            <FaPaperPlane size={18} />
          </button>
        </form>

        <p className="text-[10px] text-accent mt-2 text-center">
          Press Enter to send • Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};

export default ChatWindowWhatsApp;
