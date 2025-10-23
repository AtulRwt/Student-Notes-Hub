import { useEffect, useState } from 'react';
import { useChatStore } from '../store/chatStore';
import type { Chat } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import ChatList from '../components/chat/ChatList';
import ChatWindowWhatsApp from '../components/chat/ChatWindowWhatsApp';
import NewChatModal from '../components/chat/NewChatModal';
import { FaPlus, FaComments } from 'react-icons/fa';

const ChatPage = () => {
  const { user } = useAuthStore();
  const {
    chats,
    currentChat,
    fetchChats,
    setCurrentChat,
    initializeSocket,
    disconnectSocket,
    isConnected
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
    <div className="h-screen overflow-hidden bg-dark flex flex-col">
      <div className="container mx-auto px-4 py-4 flex-shrink-0">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold gradient-text">Messages</h1>
          
          <div className="flex items-center gap-4">
            {/* Connection Status */}
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
              <span className="text-sm text-accent">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            {/* New Chat Button */}
            <button
              onClick={() => setIsNewChatModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <FaPlus /> New Chat
            </button>
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="flex-1 overflow-hidden container mx-auto px-4 pb-4">
        <div className="glass rounded-lg overflow-hidden h-full">
          <div className="flex h-full">
            {/* Chat List - Hidden on mobile when chat is selected */}
            <div className={`${
              isMobileView 
                ? currentChat ? 'hidden' : 'w-full' 
                : 'w-full md:w-1/3 lg:w-1/4'
            } border-r border-dark-accent/20 flex flex-col`}>
              <ChatList
                chats={chats}
                currentChat={currentChat}
                onSelectChat={handleSelectChat}
              />
            </div>

            {/* Chat Window - Takes full width on mobile */}
            <div className={`${
              isMobileView 
                ? currentChat ? 'w-full' : 'hidden' 
                : 'flex-1'
            }`}>
              {currentChat ? (
                <ChatWindowWhatsApp
                  chat={currentChat}
                  onBack={isMobileView ? handleBackToList : undefined}
                />
              ) : (
                <div className="h-full flex items-center justify-center bg-dark-lighter/30">
                  <div className="text-center">
                    <FaComments className="text-6xl text-accent mx-auto mb-4" />
                    <h2 className="text-xl font-semibold mb-2">Welcome to Messages</h2>
                    <p className="text-accent max-w-md">
                      Select a conversation from the list or start a new chat to begin messaging.
                    </p>
                  </div>
                </div>
              )}
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
