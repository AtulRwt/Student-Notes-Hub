import { useState } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import type { Chat } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import Avatar from '../shared/Avatar';
import { FaSearch, FaTimes, FaInbox } from 'react-icons/fa';

interface ChatListEnhancedProps {
    chats: Chat[];
    currentChat: Chat | null;
    onSelectChat: (chat: Chat) => void;
    isLoading?: boolean;
}

const ChatListEnhanced = ({ chats, currentChat, onSelectChat, isLoading = false }: ChatListEnhancedProps) => {
    const { user } = useAuthStore();
    const [searchQuery, setSearchQuery] = useState('');

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        if (isToday(date)) {
            return format(date, 'HH:mm');
        } else if (isYesterday(date)) {
            return 'Yesterday';
        } else {
            return format(date, 'MMM d');
        }
    };

    const getChatName = (chat: Chat) => {
        if (chat.type === 'group') {
            return chat.name || 'Group Chat';
        }

        const otherMember = chat.otherMembers?.[0];
        return otherMember?.name || 'Unknown User';
    };

    const getChatAvatar = (chat: Chat) => {
        if (chat.type === 'group') {
            return undefined;
        }

        const otherMember = chat.otherMembers?.[0];
        return otherMember?.profileImage;
    };

    const getLastMessage = (chat: Chat) => {
        const lastMsg = chat.messages?.[0];
        if (!lastMsg) return 'No messages yet';

        if (lastMsg.deleted) return '🚫 Message deleted';

        const isOwn = lastMsg.senderId === user?.id;
        const prefix = isOwn ? 'You: ' : '';

        if (lastMsg.type === 'image') return `${prefix}📷 Photo`;
        if (lastMsg.type === 'file') return `${prefix}📎 ${lastMsg.fileName}`;

        return `${prefix}${lastMsg.content}`;
    };

    // Filter chats based on search query
    const filteredChats = chats.filter(chat => {
        if (!searchQuery.trim()) return true;

        const chatName = getChatName(chat).toLowerCase();
        const lastMessage = getLastMessage(chat).toLowerCase();
        const query = searchQuery.toLowerCase();

        return chatName.includes(query) || lastMessage.includes(query);
    });

    // Loading skeleton
    if (isLoading) {
        return (
            <div className="flex-1 flex flex-col h-full">
                {/* Search Skeleton */}
                <div className="p-4 border-b border-white/5">
                    <div className="h-10 bg-white/5 rounded-xl animate-pulse" />
                </div>

                {/* Chat List Skeleton */}
                <div className="flex-1 overflow-y-auto p-2">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="p-4 flex items-start gap-3 mb-2 rounded-xl animate-pulse">
                            <div className="w-12 h-12 rounded-full bg-white/5" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-white/5 rounded w-3/4" />
                                <div className="h-3 bg-white/5 rounded w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full">
            {/* Search Bar */}
            <div className="p-4 border-b border-white/5 backdrop-blur-sm">
                <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-accent pointer-events-none">
                        <FaSearch size={14} />
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search conversations..."
                        className="w-full bg-white/5 hover:bg-white/10 focus:bg-white/10 border border-white/10 focus:border-blue-500/50 rounded-xl pl-11 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-light placeholder-accent transition-all duration-200"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-accent hover:text-light hover:bg-white/10 p-1.5 rounded-lg transition-all duration-200"
                        >
                            <FaTimes size={12} />
                        </button>
                    )}
                </div>
                {searchQuery && (
                    <p className="text-xs text-accent mt-2 px-1">
                        {filteredChats.length} result{filteredChats.length !== 1 ? 's' : ''} found
                    </p>
                )}
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {filteredChats.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center p-8 h-full">
                        <div className="text-center">
                            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-blue-500/20 flex items-center justify-center">
                                <FaInbox className="text-3xl text-accent" />
                            </div>
                            {searchQuery ? (
                                <>
                                    <p className="text-light-darker font-medium mb-1">No conversations found</p>
                                    <p className="text-sm text-accent">Try a different search term</p>
                                </>
                            ) : (
                                <>
                                    <p className="text-light-darker font-medium mb-1">No conversations yet</p>
                                    <p className="text-sm text-accent">Start a new chat to begin messaging</p>
                                </>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="p-2 space-y-1">
                        {filteredChats.map((chat) => {
                            const isActive = currentChat?.id === chat.id;
                            const hasUnread = (chat.unreadCount || 0) > 0;

                            return (
                                <button
                                    key={chat.id}
                                    onClick={() => onSelectChat(chat)}
                                    className={`group w-full p-3.5 flex items-start gap-3 rounded-xl transition-all duration-200 ${isActive
                                            ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 shadow-lg'
                                            : 'hover:bg-white/5 border border-transparent'
                                        }`}
                                >
                                    {/* Avatar */}
                                    <div className="relative flex-shrink-0">
                                        <div className={`${isActive ? 'ring-2 ring-blue-500/50 ring-offset-2 ring-offset-dark' : ''} rounded-full transition-all duration-200`}>
                                            <Avatar
                                                src={getChatAvatar(chat)}
                                                alt={getChatName(chat)}
                                                size="md"
                                            />
                                        </div>
                                        {hasUnread && (
                                            <div className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg ring-2 ring-dark">
                                                <span className="text-[10px] text-white font-bold">
                                                    {chat.unreadCount! > 99 ? '99+' : chat.unreadCount}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Chat Info */}
                                    <div className="flex-1 min-w-0 text-left">
                                        <div className="flex items-baseline justify-between mb-1 gap-2">
                                            <h3 className={`font-semibold truncate transition-colors ${hasUnread ? 'text-light' : isActive ? 'text-light' : 'text-light-darker group-hover:text-light'
                                                }`}>
                                                {getChatName(chat)}
                                            </h3>
                                            {chat.messages?.[0] && (
                                                <span className={`text-xs flex-shrink-0 transition-colors ${hasUnread ? 'text-blue-400 font-medium' : 'text-accent'
                                                    }`}>
                                                    {formatTime(chat.messages[0].createdAt)}
                                                </span>
                                            )}
                                        </div>

                                        <p className={`text-sm truncate transition-colors ${hasUnread ? 'text-light font-medium' : 'text-accent group-hover:text-light-darker'
                                            }`}>
                                            {getLastMessage(chat)}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatListEnhanced;
