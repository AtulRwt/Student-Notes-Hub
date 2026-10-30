import { create } from 'zustand';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { toast } from 'react-hot-toast';
import { soundNotification, showBrowserNotification } from '../utils/soundNotification';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:5000';

export interface User {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  type: 'text' | 'file' | 'image';
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  createdAt: string;
  updatedAt: string;
  deleted?: boolean;
  edited?: boolean;
  readBy?: Array<{ userId: string; readAt: string }>;
  reactions?: Array<{ userId: string; emoji: string }>;
  sender?: User;
  replyTo?: Message;
}

export interface Chat {
  id: string;
  name?: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  otherMembers?: User[];
  messages?: Message[];
  unreadCount?: number;
  lastRead?: string;
}

interface TypingStatus {
  [chatId: string]: { [userId: string]: boolean };
}

interface ChatStore {
  chats: Chat[];
  currentChat: Chat | null;
  messages: Message[];
  socket: Socket | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  typingStatus: TypingStatus;
  onlineUsers: Set<string>;

  // Actions
  initializeSocket: (token: string) => void;
  disconnectSocket: () => void;
  fetchChats: () => Promise<void>;
  fetchMessages: (chatId: string) => Promise<void>;
  sendMessage: (chatId: string, content: string, replyTo?: string, fileUrl?: string, fileName?: string, fileType?: string) => void;
  setCurrentChat: (chat: Chat | null) => void;
  createDirectChat: (otherUserId: string) => Promise<Chat>;
  markAsRead: (chatId: string, messageIds: string[]) => void;
  addReaction: (messageId: string, emoji: string) => void;
  removeReaction: (messageId: string, emoji: string) => void;
  deleteMessage: (messageId: string) => void;
  startTyping: (chatId: string) => void;
  stopTyping: (chatId: string) => void;
  searchUsers: (query: string) => Promise<User[]>;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  chats: [],
  currentChat: null,
  messages: [],
  socket: null,
  isConnected: false,
  isLoading: false,
  error: null,
  typingStatus: {},
  onlineUsers: new Set(),

  initializeSocket: (token: string) => {
    const socket = io(WS_URL, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socket.on('connect', () => {
      console.log('Socket connected');
      set({ isConnected: true, socket });
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      set({ isConnected: false });
    });

    socket.on('message:new', (message: Message) => {
      const { currentChat, messages } = get();
      const currentUserId = localStorage.getItem('userId');

      // Check if message is from another user
      const isFromOtherUser = message.senderId !== currentUserId;

      if (currentChat && message.chatId === currentChat.id) {
        set({ messages: [...messages, message] });

        // Auto mark as read if chat is open
        get().markAsRead(message.chatId, [message.id]);

        // Play sound if from other user
        if (isFromOtherUser) {
          soundNotification.play();
        }
      } else if (isFromOtherUser) {
        // Play sound for new message in other chats
        soundNotification.play();

        // Show browser notification
        const senderName = message.sender?.name || 'Someone';
        showBrowserNotification(`${senderName} sent a message`, {
          body: message.content || 'New message',
          tag: message.chatId
        });
      }

      // Update chat list
      const chats = get().chats.map(chat => {
        if (chat.id === message.chatId) {
          return {
            ...chat,
            messages: [message],
            updatedAt: message.createdAt,
            unreadCount: currentChat?.id === chat.id ? 0 : (chat.unreadCount || 0) + 1
          };
        }
        return chat;
      });

      set({
        chats: chats.sort((a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
      });
    });

    socket.on('messages:read', ({ userId, messageIds, chatId }) => {
      const { messages, currentChat } = get();

      if (currentChat && currentChat.id === chatId) {
        const updatedMessages = messages.map(msg => {
          if (messageIds.includes(msg.id)) {
            return {
              ...msg,
              readBy: [
                ...(msg.readBy || []),
                { userId, readAt: new Date().toISOString() }
              ]
            };
          }
          return msg;
        });
        set({ messages: updatedMessages });
      }
    });

    socket.on('message:reaction', ({ messageId, emoji, action, reactions }) => {
      const { messages } = get();
      const updatedMessages = messages.map(msg => {
        if (msg.id === messageId) {
          return { ...msg, reactions };
        }
        return msg;
      });
      set({ messages: updatedMessages });
    });

    socket.on('message:deleted', ({ messageId }) => {
      const { messages } = get();
      const updatedMessages = messages.map(msg => {
        if (msg.id === messageId) {
          return {
            ...msg,
            deleted: true,
            content: 'This message was deleted'
          };
        }
        return msg;
      });
      set({ messages: updatedMessages });
    });

    socket.on('typing:start', ({ userId, chatId }) => {
      const { typingStatus } = get();
      set({
        typingStatus: {
          ...typingStatus,
          [chatId]: {
            ...typingStatus[chatId],
            [userId]: true
          }
        }
      });
    });

    socket.on('typing:stop', ({ userId, chatId }) => {
      const { typingStatus } = get();
      set({
        typingStatus: {
          ...typingStatus,
          [chatId]: {
            ...typingStatus[chatId],
            [userId]: false
          }
        }
      });
    });

    socket.on('user:online', ({ userId }) => {
      const { onlineUsers } = get();
      set({ onlineUsers: new Set([...onlineUsers, userId]) });
    });

    socket.on('user:offline', ({ userId }) => {
      const { onlineUsers } = get();
      onlineUsers.delete(userId);
      set({ onlineUsers: new Set(onlineUsers) });
    });

    set({ socket });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  },

  fetchChats: async () => {
    try {
      set({ isLoading: true, error: null });
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/chat/chats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ chats: response.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchMessages: async (chatId: string) => {
    try {
      set({ isLoading: true, error: null });
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/chat/chats/${chatId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ messages: response.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  sendMessage: (chatId: string, content: string, replyTo?: string, fileUrl?: string, fileName?: string, fileType?: string) => {
    const { socket } = get();
    if (!socket) return;

    socket.emit('message:send', {
      chatId,
      content,
      type: fileUrl ? 'file' : 'text',
      replyTo,
      fileUrl,
      fileName,
      fileType
    });
  },

  setCurrentChat: (chat: Chat | null) => {
    set({ currentChat: chat, messages: [] });
    if (chat) {
      get().fetchMessages(chat.id);
    }
  },

  createDirectChat: async (otherUserId: string) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_URL}/chat/chats/direct`,
      { otherUserId },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const newChat = response.data;

    // Fetch full chat details
    await get().fetchChats();

    return newChat;
  },

  markAsRead: (chatId: string, messageIds: string[]) => {
    const { socket } = get();
    if (!socket) return;

    socket.emit('message:read', {
      chatId,
      messageIds
    });

    // Update local state
    const chats = get().chats.map(chat => {
      if (chat.id === chatId) {
        return { ...chat, unreadCount: 0 };
      }
      return chat;
    });
    set({ chats });
  },

  addReaction: (messageId: string, emoji: string) => {
    const { socket } = get();
    if (!socket) return;

    socket.emit('message:react', {
      messageId,
      emoji,
      action: 'add'
    });
  },

  removeReaction: (messageId: string, emoji: string) => {
    const { socket } = get();
    if (!socket) return;

    socket.emit('message:react', {
      messageId,
      emoji,
      action: 'remove'
    });
  },

  deleteMessage: (messageId: string) => {
    const { socket } = get();
    if (!socket) return;

    socket.emit('message:delete', { messageId });
  },

  startTyping: (chatId: string) => {
    const { socket } = get();
    if (!socket) return;

    socket.emit('typing:start', { chatId });
  },

  stopTyping: (chatId: string) => {
    const { socket } = get();
    if (!socket) return;

    socket.emit('typing:stop', { chatId });
  },

  searchUsers: async (query: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/chat/users/search`, {
        params: { query },
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error searching users:', error);
      return [];
    }
  }
}));
