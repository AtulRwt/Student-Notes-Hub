import { format } from 'date-fns';
import { useChatStore } from '../../store/chatStore';
import type { Message } from '../../store/chatStore';
import Avatar from '../shared/Avatar';
import { FaCheck, FaCheckDouble, FaTrash, FaReply, FaCopy, FaEdit } from 'react-icons/fa';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
}

const MessageBubble = ({ message, isOwn, showAvatar }: MessageBubbleProps) => {
  const { deleteMessage, addReaction, removeReaction } = useChatStore();
  const [showActions, setShowActions] = useState(false);

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'HH:mm');
  };

  const handleDelete = () => {
    if (window.confirm('Delete this message?')) {
      deleteMessage(message.id);
      toast.success('Message deleted');
    }
  };

  const handleCopy = () => {
    if (message.content) {
      navigator.clipboard.writeText(message.content);
      toast.success('Message copied to clipboard');
    }
  };

  const handleReaction = (emoji: string) => {
    const hasReacted = message.reactions?.some(r => r.emoji === emoji);
    if (hasReacted) {
      removeReaction(message.id, emoji);
    } else {
      addReaction(message.id, emoji);
    }
  };

  const isRead = message.readBy && message.readBy.length > 0;

  return (
    <div
      className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      {showAvatar && !isOwn ? (
        <div className="flex-shrink-0">
          <Avatar
            src={message.sender?.profileImage}
            alt={message.sender?.name || 'User'}
            size="sm"
          />
        </div>
      ) : (
        <div className="w-8" />
      )}

      {/* Message Content */}
      <div className={`flex flex-col max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {/* Sender Name (for received messages) */}
        {!isOwn && showAvatar && (
          <span className="text-xs text-accent mb-1 px-2">
            {message.sender?.name || 'Unknown'}
          </span>
        )}

        {/* Message Bubble */}
        <div
          className={`relative px-4 py-2 rounded-2xl ${
            isOwn
              ? 'bg-blue-600 text-white rounded-br-sm'
              : 'bg-dark-light text-light rounded-bl-sm'
          } ${message.deleted ? 'italic opacity-70' : ''}`}
        >
          {/* Message Text */}
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.content}
          </p>

          {/* File Attachment (if any) */}
          {message.type !== 'text' && message.fileUrl && (
            <div className="mt-2">
              {message.type === 'image' ? (
                <img
                  src={message.fileUrl}
                  alt={message.fileName || 'Image'}
                  className="max-w-full rounded-lg"
                />
              ) : (
                <a
                  href={message.fileUrl}
                  download={message.fileName}
                  className="flex items-center gap-2 text-sm underline hover:no-underline"
                >
                  📎 {message.fileName}
                  {message.fileSize && (
                    <span className="text-xs opacity-70">
                      ({(message.fileSize / 1024).toFixed(1)} KB)
                    </span>
                  )}
                </a>
              )}
            </div>
          )}

          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex gap-1 mt-1">
              {Array.from(new Set(message.reactions.map(r => r.emoji))).map(emoji => {
                const count = message.reactions!.filter(r => r.emoji === emoji).length;
                return (
                  <button
                    key={emoji}
                    onClick={() => handleReaction(emoji)}
                    className="text-xs bg-dark/50 px-2 py-0.5 rounded-full hover:scale-110 transition-transform"
                  >
                    {emoji} {count > 1 && count}
                  </button>
                );
              })}
            </div>
          )}

          {/* Timestamp and Status */}
          <div className={`flex items-center gap-1 mt-1 text-[10px] ${
            isOwn ? 'text-white/70' : 'text-accent'
          }`}>
            <span>{formatTime(message.createdAt)}</span>
            {message.edited && <span>• edited</span>}
            {isOwn && (
              <span className="ml-1">
                {isRead ? (
                  <FaCheckDouble className="text-blue-300" />
                ) : (
                  <FaCheck className="text-white/50" />
                )}
              </span>
            )}
          </div>
        </div>

        {/* Quick Actions (on hover) */}
        {showActions && !message.deleted && (
          <div className={`flex gap-1 mt-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
            {/* Quick Reactions */}
            {['👍', '❤️', '😂', '😮', '🎉'].map(emoji => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className="text-sm hover:scale-125 transition-transform bg-dark-light px-2 py-1 rounded-full"
                title={`React with ${emoji}`}
              >
                {emoji}
              </button>
            ))}
            
            {/* Copy */}
            {message.content && (
              <button
                onClick={handleCopy}
                className="text-blue-400 hover:text-blue-500 hover:scale-110 transition-all bg-dark-light px-2 py-1 rounded-full"
                title="Copy message"
              >
                <FaCopy size={12} />
              </button>
            )}
            
            {/* Delete (only for own messages) */}
            {isOwn && (
              <button
                onClick={handleDelete}
                className="text-red-400 hover:text-red-500 hover:scale-110 transition-all bg-dark-light px-2 py-1 rounded-full"
                title="Delete message"
              >
                <FaTrash size={12} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
