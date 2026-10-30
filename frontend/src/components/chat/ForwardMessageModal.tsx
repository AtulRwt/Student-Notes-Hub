import { useState } from 'react';
import { useChatStore } from '../../store/chatStore';
import type { Message, Chat } from '../../store/chatStore';
import Avatar from '../shared/Avatar';
import { FaTimes, FaShare, FaCheck } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

interface ForwardMessageModalProps {
  message: Message;
  onClose: () => void;
}

const ForwardMessageModal = ({ message, onClose }: ForwardMessageModalProps) => {
  const { chats, sendMessage } = useChatStore();
  const [selectedChats, setSelectedChats] = useState<Set<string>>(new Set());
  const [isForwarding, setIsForwarding] = useState(false);

  const toggleChat = (chatId: string) => {
    const newSelected = new Set(selectedChats);
    if (newSelected.has(chatId)) {
      newSelected.delete(chatId);
    } else {
      newSelected.add(chatId);
    }
    setSelectedChats(newSelected);
  };

  const handleForward = async () => {
    if (selectedChats.size === 0) {
      toast.error('Please select at least one chat');
      return;
    }

    setIsForwarding(true);

    try {
      for (const chatId of selectedChats) {
        await sendMessage(
          chatId, 
          message.content || '', 
          undefined,
          message.fileUrl,
          message.fileName,
          message.fileType
        );
      }

      toast.success(`Forwarded to ${selectedChats.size} chat${selectedChats.size > 1 ? 's' : ''}`);
      onClose();
    } catch (error) {
      console.error('Forward error:', error);
      toast.error('Failed to forward message');
    } finally {
      setIsForwarding(false);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="glass-light rounded-xl max-w-md w-full max-h-[80vh] flex flex-col animate-scaleIn">
        {/* Header */}
        <div className="p-6 border-b border-dark-accent/20 flex items-center justify-between">
          <h2 className="text-xl font-bold gradient-text flex items-center gap-2">
            <FaShare /> Forward Message
          </h2>
          <button
            onClick={onClose}
            className="text-accent hover:text-light transition-colors"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Message Preview */}
        <div className="p-4 border-b border-dark-accent/20 bg-dark-lighter/50">
          <p className="text-sm text-accent mb-2">Forwarding:</p>
          <div className="glass p-3 rounded-lg">
            {message.fileUrl && (
              <p className="text-xs text-blue-400 mb-1">📎 {message.fileName || 'Attachment'}</p>
            )}
            <p className="text-light text-sm truncate">
              {message.content || 'Attachment'}
            </p>
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-sm text-accent mb-3">Select chats:</p>
          <div className="space-y-2">
            {chats.map((chat) => (
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
                </div>
                {selectedChats.has(chat.id) && (
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                    <FaCheck size={12} className="text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-dark-accent/20 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-dark-light hover:bg-dark-medium text-light rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleForward}
            disabled={selectedChats.size === 0 || isForwarding}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-dark-accent disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isForwarding ? (
              'Forwarding...'
            ) : (
              <>
                <FaShare /> Forward ({selectedChats.size})
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForwardMessageModal;
