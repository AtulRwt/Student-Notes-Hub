import { useEffect, useState } from 'react';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';

const ChatDebugPage = () => {
  const { user } = useAuthStore();
  const {
    chats,
    currentChat,
    messages,
    isConnected,
    isLoading,
    error,
    fetchChats,
    initializeSocket,
    socket
  } = useChatStore();

  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      console.log('🔑 Token found:', token.substring(0, 20) + '...');
      initializeSocket(token);
      fetchChats();
    } else {
      console.error('❌ No token found');
    }
  }, []);

  useEffect(() => {
    setDebugInfo({
      user: user ? { id: user.id, name: user.name, email: user.email } : null,
      token: localStorage.getItem('token') ? 'Present' : 'Missing',
      socketConnected: isConnected,
      socketId: socket?.id || 'Not connected',
      chatsCount: chats.length,
      currentChatId: currentChat?.id || 'None',
      messagesCount: messages.length,
      isLoading,
      error,
      apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
      wsUrl: import.meta.env.VITE_WS_URL || 'http://localhost:5000'
    });
  }, [user, isConnected, chats, currentChat, messages, isLoading, error, socket]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="glass rounded-xl p-6">
        <h1 className="text-3xl font-bold gradient-text mb-6">Chat Debug Information</h1>

        {/* Connection Status */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Connection Status</h2>
          <div className="glass-light p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="font-semibold">
                {isConnected ? '✅ Connected' : '❌ Disconnected'}
              </span>
            </div>
            <p className="text-sm text-accent">Socket ID: {debugInfo.socketId}</p>
          </div>
        </div>

        {/* User Info */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">User Information</h2>
          <div className="glass-light p-4 rounded-lg">
            {user ? (
              <>
                <p><strong>ID:</strong> {user.id}</p>
                <p><strong>Name:</strong> {user.name}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Token:</strong> {debugInfo.token}</p>
              </>
            ) : (
              <p className="text-red-400">❌ No user logged in</p>
            )}
          </div>
        </div>

        {/* API Configuration */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">API Configuration</h2>
          <div className="glass-light p-4 rounded-lg">
            <p><strong>API URL:</strong> {debugInfo.apiUrl}</p>
            <p><strong>WebSocket URL:</strong> {debugInfo.wsUrl}</p>
          </div>
        </div>

        {/* Chat Data */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Chat Data</h2>
          <div className="glass-light p-4 rounded-lg">
            <p><strong>Total Chats:</strong> {debugInfo.chatsCount}</p>
            <p><strong>Current Chat:</strong> {debugInfo.currentChatId}</p>
            <p><strong>Messages in Current Chat:</strong> {debugInfo.messagesCount}</p>
            <p><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
            {error && <p className="text-red-400"><strong>Error:</strong> {error}</p>}
          </div>
        </div>

        {/* Chats List */}
        {chats.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3">Available Chats</h2>
            <div className="glass-light p-4 rounded-lg space-y-2">
              {chats.map((chat) => (
                <div key={chat.id} className="border-b border-dark-accent/20 pb-2">
                  <p><strong>Chat ID:</strong> {chat.id}</p>
                  <p><strong>Type:</strong> {chat.type}</p>
                  <p><strong>Members:</strong> {chat.otherMembers?.map(m => m.name).join(', ') || 'Unknown'}</p>
                  <p><strong>Unread:</strong> {chat.unreadCount || 0}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3">Messages in Current Chat</h2>
            <div className="glass-light p-4 rounded-lg space-y-2 max-h-96 overflow-y-auto">
              {messages.map((msg) => (
                <div key={msg.id} className="border-b border-dark-accent/20 pb-2">
                  <p><strong>From:</strong> {msg.sender?.name || msg.senderId}</p>
                  <p><strong>Content:</strong> {msg.content}</p>
                  <p><strong>Time:</strong> {new Date(msg.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Raw Debug Data */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Raw Debug Data</h2>
          <div className="glass-light p-4 rounded-lg">
            <pre className="text-xs overflow-auto max-h-96">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        </div>

        {/* Test Actions */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Test Actions</h2>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => fetchChats()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Refresh Chats
            </button>
            <button
              onClick={() => {
                const token = localStorage.getItem('token');
                if (token) initializeSocket(token);
              }}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
            >
              Reconnect Socket
            </button>
            <button
              onClick={() => console.log('Current State:', { chats, messages, isConnected })}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
            >
              Log to Console
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatDebugPage;
