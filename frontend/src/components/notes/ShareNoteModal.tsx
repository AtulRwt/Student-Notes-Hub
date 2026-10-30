import { useState, useEffect } from 'react';
import { useChatStore } from '../../store/chatStore';
import type { Chat } from '../../store/chatStore';
import Avatar from '../shared/Avatar';
import { FaTimes, FaShare, FaCheck, FaFileAlt } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

interface ShareNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  noteId: string;
  noteTitle: string;
  noteContent: string;
}

const ShareNoteModal = ({ isOpen, onClose, noteId, noteTitle, noteContent }: ShareNoteModalProps) => {
  const { chats, sendMessage, fetchChats, initializeSocket } = useChatStore();
  const [selectedChats, setSelectedChats] = useState<Set<string>>(new Set());
  const [isSharing, setIsSharing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Initialize chat store when modal opens
  useEffect(() => {
    if (isOpen) {
      const token = localStorage.getItem('token');
      if (token) {
        initializeSocket(token);
        fetchChats();
      }
    }
  }, [isOpen, fetchChats, initializeSocket]);

  if (!isOpen) return null;

  const toggleChat = (chatId: string) => {
    const newSelected = new Set(selectedChats);
    if (newSelected.has(chatId)) {
      newSelected.delete(chatId);
    } else {
      newSelected.add(chatId);
    }
    setSelectedChats(newSelected);
  };

  const handleShare = async () => {
    if (selectedChats.size === 0) {
      toast.error('Please select at least one chat');
      return;
    }

    setIsSharing(true);

    try {
      // Create a structured note share message
      const noteData = {
        type: 'note',
        noteId,
        title: noteTitle,
        preview: noteContent.substring(0, 150),
        url: `/notes/${noteId}`
      };

      const shareMessage = `NOTE_SHARE:${JSON.stringify(noteData)}`;

      for (const chatId of selectedChats) {
        await sendMessage(chatId, shareMessage);
      }

      toast.success(`Shared note with ${selectedChats.size} chat${selectedChats.size > 1 ? 's' : ''}`);
      onClose();
      setSelectedChats(new Set());
    } catch (error) {
      console.error('Share error:', error);
      toast.error('Failed to share note');
    } finally {
      setIsSharing(false);
    }
  };

  const getChatName = (chat: Chat) => {
    if (chat.type === 'group') {
      return chat.name || 'Group Chat';
    }
    return chat.otherMembers?.[0]?.name || 'Unknown User';
  };

  const getChatAvatar = (chat: Chat) => {
    if (chat.type === 'group') {
      return undefined;
    }
    return chat.otherMembers?.[0]?.profileImage;
  };

  const filteredChats = searchQuery
    ? chats.filter(chat =>
        getChatName(chat).toLowerCase().includes(searchQuery.toLowerCase())
      )
    : chats;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="glass-light rounded-xl max-w-md w-full max-h-[80vh] flex flex-col animate-scaleIn">
        {/* Header */}
        <div className="p-6 border-b border-dark-accent/20 flex items-center justify-between">
          <h2 className="text-xl font-bold gradient-text flex items-center gap-2">
            <FaShare /> Share Note
          </h2>
          <button
            onClick={onClose}
            className="text-accent hover:text-light transition-colors"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Note Preview */}
        <div className="p-4 border-b border-dark-accent/20 bg-dark-lighter/50">
          <div className="glass p-4 rounded-lg flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <FaFileAlt className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-light mb-1 truncate">{noteTitle}</h3>
              <p className="text-sm text-accent line-clamp-2">
                {noteContent.substring(0, 100)}...
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-dark-accent/20">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chats..."
            className="w-full bg-dark-lighter border border-dark-accent rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-light"
          />
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredChats.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-accent">
                {searchQuery ? 'No chats found' : 'No chats available. Start a chat first!'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredChats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => toggleChat(chat.id)}
                  className={`w-full p-3 rounded-lg flex items-center gap-3 transition-colors ${
                    selectedChats.has(chat.id)
                      ? 'bg-blue-600/20 border border-blue-500'
                      : 'glass hover:bg-dark-light/30'
                  }`}
                >
                  <Avatar
                    src={getChatAvatar(chat)}
                    alt={getChatName(chat)}
                    size="sm"
                  />
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-semibold text-light truncate">
                      {getChatName(chat)}
                    </p>
                    {chat.messages?.[0] && (
                      <p className="text-xs text-accent truncate">
                        {chat.messages[0].content || 'Attachment'}
                      </p>
                    )}
                  </div>
                  {selectedChats.has(chat.id) && (
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                      <FaCheck size={12} className="text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-dark-accent/20">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2 bg-dark-light hover:bg-dark-medium text-light rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleShare}
              disabled={selectedChats.size === 0 || isSharing}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-dark-accent disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isSharing ? (
                'Sharing...'
              ) : (
                <>
                  <FaShare /> Share ({selectedChats.size})
                </>
              )}
            </button>
          </div>
          {selectedChats.size > 0 && (
            <p className="text-xs text-accent text-center mt-3">
              Note will be shared with {selectedChats.size} chat{selectedChats.size > 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareNoteModal;
