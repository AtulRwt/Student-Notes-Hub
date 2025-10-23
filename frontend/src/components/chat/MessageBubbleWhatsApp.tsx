import { format } from 'date-fns';
import { useChatStore } from '../../store/chatStore';
import type { Message } from '../../store/chatStore';
import Avatar from '../shared/Avatar';
import { FaCheck, FaCheckDouble, FaTrash, FaReply, FaCopy, FaShare, FaStar, FaFile, FaDownload, FaImage, FaFileAlt, FaExternalLinkAlt } from 'react-icons/fa';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

interface MessageBubbleWhatsAppProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  onReply?: (message: Message) => void;
  onForward?: (message: Message) => void;
}

const MessageBubbleWhatsApp = ({ message, isOwn, showAvatar, onReply, onForward }: MessageBubbleWhatsAppProps) => {
  const { deleteMessage, addReaction, removeReaction } = useChatStore();
  const navigate = useNavigate();
  const [showActions, setShowActions] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'HH:mm');
  };

  const handleDelete = () => {
    if (window.confirm('Delete this message?')) {
      deleteMessage(message.id);
      toast.success('Message deleted');
    }
    setShowContextMenu(false);
  };

  const handleCopy = () => {
    if (message.content) {
      navigator.clipboard.writeText(message.content);
      toast.success('Message copied');
    }
    setShowContextMenu(false);
  };

  const handleReply = () => {
    onReply?.(message);
    setShowContextMenu(false);
  };

  const handleForward = () => {
    onForward?.(message);
    setShowContextMenu(false);
  };

  const handleReaction = (emoji: string) => {
    const hasReacted = message.reactions?.some(r => r.emoji === emoji);
    if (hasReacted) {
      removeReaction(message.id, emoji);
    } else {
      addReaction(message.id, emoji);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  const isRead = message.readBy && message.readBy.length > 0;
  const reactions = message.reactions || [];
  const reactionGroups = reactions.reduce((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Check if message is a note share
  const isNoteShare = message.content?.startsWith('NOTE_SHARE:');
  
  // Parse note data if it's a note share
  const getNoteData = () => {
    if (!isNoteShare || !message.content) return null;
    try {
      const jsonStr = message.content.replace('NOTE_SHARE:', '');
      return JSON.parse(jsonStr);
    } catch {
      return null;
    }
  };

  const noteData = getNoteData();

  // Render note card
  const renderNoteCard = () => {
    if (!noteData) return null;

    return (
      <div 
        onClick={() => navigate(noteData.url)}
        className="mb-2 p-4 bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-lg cursor-pointer hover:border-blue-500 transition-all hover:scale-[1.02] group"
      >
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <FaFileAlt className="text-white text-xl" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-light mb-1 line-clamp-1">{noteData.title}</h4>
            <p className="text-sm text-accent line-clamp-2 mb-2">{noteData.preview}...</p>
            <div className="flex items-center gap-2 text-xs text-blue-400">
              <FaExternalLinkAlt />
              <span className="font-medium">Click to view note</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render file attachment if present
  const renderAttachment = () => {
    if (!message.fileUrl) return null;

    // Helpers: absolute URL + detect type from URL when fileType missing
    const absoluteUrl = message.fileUrl.startsWith('http') 
      ? message.fileUrl 
      : `http://localhost:5000${message.fileUrl.startsWith('/') ? message.fileUrl : `/${message.fileUrl}`}`;

    const detectTypeFromUrl = (url: string): string => {
      const ext = url.split('?')[0].split('#')[0].split('.').pop()?.toLowerCase();
      if (!ext) return 'application/octet-stream';
      if (['jpg','jpeg','png','gif','bmp','webp','svg'].includes(ext)) return `image/${ext}`;
      if (ext === 'pdf') return 'application/pdf';
      if (['doc','docx'].includes(ext)) return 'application/msword';
      if (['xls','xlsx'].includes(ext)) return 'application/vnd.ms-excel';
      if (ext === 'txt') return 'text/plain';
      return 'application/octet-stream';
    };

    const fileType = message.fileType || detectTypeFromUrl(absoluteUrl);

    if (fileType.startsWith('image/')) {
      return (
        <div className="mb-2 rounded-lg overflow-hidden shadow-lg">
          <img 
            src={absoluteUrl} 
            alt="Attachment" 
            className="max-w-xs max-h-96 object-cover cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(absoluteUrl, '_blank')}
          />
        </div>
      );
    }

    if (fileType === 'application/pdf' || fileType.includes('pdf')) {
      return (
        <div className="mb-2 p-3 bg-dark-light/50 border border-dark-accent/30 rounded-lg flex items-center gap-3 hover:bg-dark-light transition-colors">
          <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
            <FaFile className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate text-light">{message.fileName || 'Document.pdf'}</p>
            <p className="text-xs text-accent">PDF Document</p>
          </div>
          <a 
            href={absoluteUrl} 
            download
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 hover:bg-blue-600 bg-blue-600/20 rounded-full transition-colors"
          >
            <FaDownload className="text-blue-400" />
          </a>
        </div>
      );
    }

    if (fileType.includes('document') || fileType.includes('word') || fileType.includes('msword')) {
      return (
        <div className="mb-2 p-3 bg-dark-light/50 border border-dark-accent/30 rounded-lg flex items-center gap-3 hover:bg-dark-light transition-colors">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <FaFile className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate text-light">{message.fileName || 'Document.docx'}</p>
            <p className="text-xs text-accent">Word Document</p>
          </div>
          <a 
            href={absoluteUrl} 
            download
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 hover:bg-blue-600 bg-blue-600/20 rounded-full transition-colors"
          >
            <FaDownload className="text-blue-400" />
          </a>
        </div>
      );
    }

    if (fileType.includes('excel') || fileType.includes('spreadsheet')) {
      return (
        <div className="mb-2 p-3 bg-dark-light/50 border border-dark-accent/30 rounded-lg flex items-center gap-3 hover:bg-dark-light transition-colors">
          <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
            <FaFile className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate text-light">{message.fileName || 'Spreadsheet.xlsx'}</p>
            <p className="text-xs text-accent">Excel Spreadsheet</p>
          </div>
          <a 
            href={absoluteUrl} 
            download
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 hover:bg-blue-600 bg-blue-600/20 rounded-full transition-colors"
          >
            <FaDownload className="text-blue-400" />
          </a>
        </div>
      );
    }

    return (
      <div className="mb-2 p-3 bg-dark-light/50 border border-dark-accent/30 rounded-lg flex items-center gap-3 hover:bg-dark-light transition-colors">
        <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center">
          <FaFile className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate text-light">{message.fileName || 'File'}</p>
          <p className="text-xs text-accent">File</p>
        </div>
        <a 
          href={absoluteUrl} 
          download
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 hover:bg-blue-600 bg-blue-600/20 rounded-full transition-colors"
        >
          <FaDownload className="text-blue-400" />
        </a>
      </div>
    );
  };

  // Render replied message
  const renderReplyPreview = () => {
    if (!message.replyTo) return null;

    return (
      <div className="mb-2 p-2 border-l-4 border-blue-500 bg-dark-light/50 rounded">
        <p className="text-xs text-blue-400 font-semibold mb-1">
          {message.replyTo.sender?.name || 'User'}
        </p>
        <p className="text-xs text-accent truncate">
          {message.replyTo.content || 'Attachment'}
        </p>
      </div>
    );
  };

  return (
    <div
      className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'} group`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onContextMenu={handleContextMenu}
    >
      {/* Avatar */}
      {!isOwn && (
        <div className="flex-shrink-0">
          {showAvatar ? (
            <Avatar
              src={message.sender?.profileImage}
              alt={message.sender?.name || 'User'}
              size="sm"
            />
          ) : (
            <div className="w-8" />
          )}
        </div>
      )}

      {/* Message Content */}
      <div className={`flex flex-col max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {/* Sender Name (for group chats) */}
        {!isOwn && showAvatar && (
          <span className="text-xs text-accent mb-1 px-2">
            {message.sender?.name || 'Unknown'}
          </span>
        )}

        {/* Message Bubble */}
        <div
          className={`rounded-2xl px-4 py-2 ${
            isOwn
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-br-sm'
              : 'glass-light text-light rounded-bl-sm'
          } ${message.deleted ? 'opacity-50 italic' : ''} shadow-lg relative`}
        >
          {/* Reply Preview */}
          {renderReplyPreview()}

          {/* Note Card */}
          {isNoteShare && renderNoteCard()}

          {/* File Attachment */}
          {renderAttachment()}

          {/* Message Text */}
          {message.content && !isNoteShare && (
            <p className="break-words whitespace-pre-wrap">{message.content}</p>
          )}

          {/* Deleted Message */}
          {message.deleted && (
            <p className="text-sm italic opacity-70">This message was deleted</p>
          )}

          {/* Message Info */}
          <div className={`flex items-center gap-2 mt-1 text-xs ${isOwn ? 'text-blue-100' : 'text-accent'}`}>
            {message.edited && <span className="opacity-70">edited</span>}
            <span className="opacity-90">{formatTime(message.createdAt)}</span>
            {isOwn && (
              <span className={isRead ? 'text-blue-200' : 'opacity-70'}>
                {isRead ? (
                  <FaCheckDouble size={14} />
                ) : (
                  <FaCheck size={14} />
                )}
              </span>
            )}
          </div>

          {/* Reactions */}
          {Object.keys(reactionGroups).length > 0 && (
            <div className="absolute -bottom-2 left-2 flex gap-1">
              {Object.entries(reactionGroups).map(([emoji, count]) => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className="text-xs bg-dark-lighter border border-dark-accent px-2 py-0.5 rounded-full hover:scale-110 transition-transform shadow-md"
                >
                  {emoji} {count > 1 && count}
                </button>
              ))}
            </div>
          )}
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
            
            {/* Reply */}
            <button
              onClick={handleReply}
              className="text-blue-400 hover:text-blue-500 hover:scale-110 transition-all bg-dark-light px-2 py-1 rounded-full"
              title="Reply"
            >
              <FaReply size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Context Menu */}
      {showContextMenu && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowContextMenu(false)}
          />
          <div
            className="fixed z-50 glass rounded-lg shadow-2xl py-2 min-w-[200px] border border-dark-accent/30"
            style={{ 
              left: `${contextMenuPos.x}px`, 
              top: `${contextMenuPos.y}px`,
              transform: 'translate(-50%, 0)'
            }}
          >
            <button
              onClick={handleReply}
              className="w-full px-4 py-2 text-left hover:bg-dark-light flex items-center gap-3 text-light"
            >
              <FaReply /> Reply
            </button>
            <button
              onClick={handleForward}
              className="w-full px-4 py-2 text-left hover:bg-dark-light flex items-center gap-3 text-light"
            >
              <FaShare /> Forward
            </button>
            {message.content && (
              <button
                onClick={handleCopy}
                className="w-full px-4 py-2 text-left hover:bg-dark-light flex items-center gap-3 text-light"
              >
                <FaCopy /> Copy
              </button>
            )}
            <div className="border-t border-dark-accent/20 my-1" />
            {isOwn && (
              <button
                onClick={handleDelete}
                className="w-full px-4 py-2 text-left hover:bg-dark-light flex items-center gap-3 text-red-400"
              >
                <FaTrash /> Delete
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default MessageBubbleWhatsApp;
