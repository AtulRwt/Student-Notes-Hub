import { format, isToday, isYesterday } from 'date-fns';
import type { Chat } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import Avatar from '../shared/Avatar';
import { FaCircle } from 'react-icons/fa';

interface ChatListProps {
  chats: Chat[];
  currentChat: Chat | null;
  onSelectChat: (chat: Chat) => void;
}

const ChatList = ({ chats, currentChat, onSelectChat }: ChatListProps) => {
  const { user } = useAuthStore();

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
      return undefined; // Could show group avatar
    }
    
    const otherMember = chat.otherMembers?.[0];
    return otherMember?.profileImage;
  };

  const getLastMessage = (chat: Chat) => {
    const lastMsg = chat.messages?.[0];
    if (!lastMsg) return 'No messages yet';
    
    if (lastMsg.deleted) return 'Message deleted';
    
    const isOwn = lastMsg.senderId === user?.id;
    const prefix = isOwn ? 'You: ' : '';
    
    if (lastMsg.type === 'image') return `${prefix}📷 Photo`;
    if (lastMsg.type === 'file') return `${prefix}📎 ${lastMsg.fileName}`;
    
    return `${prefix}${lastMsg.content}`;
  };

  if (chats.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center text-accent">
          <p>No conversations yet</p>
          <p className="text-sm mt-2">Start a new chat to begin messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {chats.map((chat) => {
        const isActive = currentChat?.id === chat.id;
        const hasUnread = (chat.unreadCount || 0) > 0;

        return (
          <button
            key={chat.id}
            onClick={() => onSelectChat(chat)}
            className={`w-full p-4 flex items-start gap-3 hover:bg-dark-light/30 transition-colors border-b border-dark-accent/10 ${
              isActive ? 'bg-blue-600/20' : ''
            }`}
          >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <Avatar
                src={getChatAvatar(chat)}
                alt={getChatName(chat)}
                size="md"
              />
              {hasUnread && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-[10px] text-white font-bold">
                    {chat.unreadCount! > 9 ? '9+' : chat.unreadCount}
                  </span>
                </div>
              )}
            </div>

            {/* Chat Info */}
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center justify-between mb-1">
                <h3 className={`font-semibold truncate ${hasUnread ? 'text-light' : 'text-light-darker'}`}>
                  {getChatName(chat)}
                </h3>
                <span className="text-xs text-accent flex-shrink-0 ml-2">
                  {chat.messages?.[0] && formatTime(chat.messages[0].createdAt)}
                </span>
              </div>
              
              <p className={`text-sm truncate ${hasUnread ? 'text-light font-medium' : 'text-accent'}`}>
                {getLastMessage(chat)}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default ChatList;
