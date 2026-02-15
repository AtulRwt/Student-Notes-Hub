import { useEffect, useState } from 'react';
import { useChatStore } from '../store/chatStore';
import type { Chat } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import ChatListEnhanced from '../components/chat/ChatListEnhanced';
import ChatWindowWhatsApp from '../components/chat/ChatWindowWhatsApp';
import NewChatModal from '../components/chat/NewChatModal';
import { FaPlus, FaComments, FaCircle } from 'react-icons/fa';

const ChatPage = () => {
  const { user } = useAuthStore();
  const {
    chats,
    currentChat,
    fetchChats,
    setCurrentChat,
    initializeSocket,
    disconnectSocket,
    isConnected,
    isLoading
  } = useChatStore();

  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      initializeSocket(token);
      fetchChats();
    }

    return () => {
      disconnectSocket();
    };
  }, []);

  const handleSelectChat = (chat: Chat) => {
    setCurrentChat(chat);
  };

  const handleBackToList = () => {
    setCurrentChat(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark via-dark-lighter to-dark relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header */}
      <div className="relative z-10 border-b border-white/5 backdrop-blur-xl bg-dark/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Title Section */}
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Messages
                </span>
              </h1>
              <p className="text-sm text-accent">
                {chats.length} conversation{chats.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {/* Connection Status */}
              <div className="glass-light px-4 py-2 rounded-full flex items-center gap-2">
                <div className={`relative ${isConnected ? 'animate-pulse' : ''}`}>
                  <FaCircle
                    className={`text-xs ${isConnected ? 'text-green-400' : 'text-red-400'}`}
                  />
                  {isConnected && (
                    <div className="absolute inset-0 animate-ping">
                      <FaCircle className="text-xs text-green-400 opacity-75" />
                    </div>
                  )}
                </div>
                <span className="text-sm font-medium text-light hidden sm:inline">
                  {isConnected ? 'Connected' : 'Reconnecting...'}
                </span>
              </div>

              {/* New Chat Button */}
              <button
                onClick={() => setIsNewChatModalOpen(true)}
                className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-6 py-2.5 rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
              >
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <FaPlus className="relative z-10" />
                <span className="relative z-10 hidden sm:inline">New Chat</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="h-[calc(100vh-200px)] rounded-2xl overflow-hidden shadow-2xl">
          <div className="h-full glass backdrop-blur-xl border border-white/10">
            <div className="flex h-full">
              {/* Chat List Sidebar */}
              <div
                className={`${isMobileView
                    ? currentChat ? 'hidden' : 'w-full'
                    : 'w-full sm:w-96 lg:w-[420px]'
                  } flex flex-col border-r border-white/5 bg-dark/30`}
              >
                <ChatListEnhanced
                  chats={chats}
                  currentChat={currentChat}
                  onSelectChat={handleSelectChat}
                  isLoading={isLoading}
                />
              </div>

              {/* Chat Window */}
              <div
                className={`${isMobileView
                    ? currentChat ? 'w-full' : 'hidden'
                    : 'flex-1'
                  } flex flex-col bg-dark-lighter/20`}
              >
                {currentChat ? (
                  <ChatWindowWhatsApp
                    chat={currentChat}
                    onBack={isMobileView ? handleBackToList : undefined}
                  />
                ) : (
                  /* Empty State */
                  <div className="h-full flex items-center justify-center p-8">
                    <div className="text-center max-w-md">
                      {/* Animated Icon */}
                      <div className="relative inline-block mb-8">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-2xl opacity-30 animate-pulse" />
                        <div className="relative w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30 flex items-center justify-center backdrop-blur-xl">
                          <FaComments className="text-6xl text-blue-400" />
                        </div>
                      </div>

                      {/* Text Content */}
                      <h2 className="text-2xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        Welcome to Messages
                      </h2>
                      <p className="text-accent leading-relaxed mb-6">
                        Select a conversation from the sidebar or start a new chat to begin your conversation.
                      </p>

                      {/* Quick Action */}
                      <button
                        onClick={() => setIsNewChatModalOpen(true)}
                        className="group inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-8 py-3 rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        <FaPlus className="group-hover:rotate-90 transition-transform duration-300" />
                        <span>Start New Chat</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Chat Modal */}
      <NewChatModal
        isOpen={isNewChatModalOpen}
        onClose={() => setIsNewChatModalOpen(false)}
        onChatCreated={(chat) => {
          setIsNewChatModalOpen(false);
          setCurrentChat(chat);
        }}
      />
    </div>
  );
};

export default ChatPage;
