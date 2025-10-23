import { useState, useEffect } from 'react';
import { useChatStore } from '../../store/chatStore';
import type { User, Chat } from '../../store/chatStore';
import Avatar from '../shared/Avatar';
import { FaTimes, FaSearch, FaSpinner } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChatCreated: (chat: Chat) => void;
}

const NewChatModal = ({ isOpen, onClose, onChatCreated }: NewChatModalProps) => {
  const { searchUsers, createDirectChat, fetchChats } = useChatStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        setIsSearching(true);
        try {
          const results = await searchUsers(searchQuery);
          setSearchResults(results);
        } catch (error) {
          console.error('Search error:', error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, searchUsers]);

  const handleSelectUser = async (user: User) => {
    setIsCreating(true);
    try {
      const chat = await createDirectChat(user.id);
      await fetchChats(); // Refresh chat list
      toast.success(`Started chat with ${user.name}`);
      onChatCreated(chat);
    } catch (error: any) {
      console.error('Error creating chat:', error);
      toast.error('Failed to start chat');
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="glass-light rounded-xl max-w-lg w-full max-h-[80vh] flex flex-col animate-scaleIn">
        {/* Header */}
        <div className="p-6 border-b border-dark-accent/20 flex items-center justify-between">
          <h2 className="text-2xl font-bold gradient-text">New Chat</h2>
          <button
            onClick={onClose}
            className="text-accent hover:text-light transition-colors"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-dark-accent/20">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-accent" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users by name or email..."
              className="w-full bg-dark-lighter border border-dark-accent rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-light"
              autoFocus
            />
            {isSearching && (
              <FaSpinner className="absolute right-3 top-1/2 -translate-y-1/2 text-accent animate-spin" />
            )}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4">
          {searchQuery.trim().length < 2 ? (
            <div className="text-center py-8 text-accent">
              <p>Type at least 2 characters to search</p>
            </div>
          ) : isSearching ? (
            <div className="text-center py-8">
              <FaSpinner className="animate-spin mx-auto text-3xl text-blue-400 mb-2" />
              <p className="text-accent">Searching...</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center py-8 text-accent">
              <p>No users found</p>
              <p className="text-sm mt-2">Try searching with a different term</p>
            </div>
          ) : (
            <div className="space-y-2">
              {searchResults.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  disabled={isCreating}
                  className="w-full p-3 flex items-center gap-3 hover:bg-dark-light/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Avatar
                    src={user.profileImage}
                    alt={user.name}
                    size="md"
                  />
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-light">{user.name}</h3>
                    <p className="text-sm text-accent">{user.email}</p>
                  </div>
                  {isCreating && (
                    <FaSpinner className="animate-spin text-blue-400" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-dark-accent/20 text-center">
          <p className="text-xs text-accent">
            Select a user to start a conversation
          </p>
        </div>
      </div>
    </div>
  );
};

export default NewChatModal;
