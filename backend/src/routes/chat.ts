import express from 'express';
import { prisma } from '../index';
import { auth } from '../middleware/auth';

const router = express.Router();

// Get all chats for a user
router.get('/chats', auth, async (req, res) => {
  try {
    const userId = req.user!.id;

    const chats = await prisma.chat.findMany({
      where: {
        members: {
          some: {
            userId: userId
          }
        }
      },
      include: {
        members: {
          include: {
            chat: {
              include: {
                messages: {
                  orderBy: { createdAt: 'desc' },
                  take: 1,
                  include: {
                    readBy: true
                  }
                }
              }
            }
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    // Get user details for all chat members
    const chatIds = chats.map(chat => chat.id);
    const allMembers = await prisma.chatMember.findMany({
      where: {
        chatId: { in: chatIds }
      }
    });

    const userIds = [...new Set(allMembers.map(m => m.userId))];
    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds }
      },
      select: {
        id: true,
        name: true,
        email: true,
        profileImage: true
      }
    });

    const userMap = new Map(users.map(u => [u.id, u]));

    // Format chats with user details and unread count
    const formattedChats = chats.map(chat => {
      const otherMembers = allMembers
        .filter(m => m.chatId === chat.id && m.userId !== userId)
        .map(m => userMap.get(m.userId));

      const currentMember = allMembers.find(m => m.chatId === chat.id && m.userId === userId);
      
      const unreadCount = chat.messages.filter(msg => {
        const readByUser = msg.readBy?.some(r => r.userId === userId);
        return !readByUser && msg.senderId !== userId;
      }).length;

      return {
        ...chat,
        otherMembers,
        unreadCount,
        lastRead: currentMember?.lastRead
      };
    });

    res.json(formattedChats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
});

// Get or create a direct chat with another user
router.post('/chats/direct', auth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { otherUserId } = req.body;

    if (!otherUserId) {
      return res.status(400).json({ error: 'Other user ID is required' });
    }

    // Check if chat already exists
    const existingChat = await prisma.chat.findFirst({
      where: {
        type: 'direct',
        members: {
          every: {
            userId: { in: [userId, otherUserId] }
          }
        }
      },
      include: {
        members: true
      }
    });

    if (existingChat && existingChat.members.length === 2) {
      return res.json(existingChat);
    }

    // Create new chat
    const chat = await prisma.chat.create({
      data: {
        type: 'direct',
        members: {
          create: [
            { userId },
            { userId: otherUserId }
          ]
        }
      },
      include: {
        members: true
      }
    });

    res.status(201).json(chat);
  } catch (error) {
    console.error('Error creating chat:', error);
    res.status(500).json({ error: 'Failed to create chat' });
  }
});

// Get messages for a chat
router.get('/chats/:chatId/messages', auth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { chatId } = req.params;
    const { limit = 50, before } = req.query;

    // Verify user is a member of the chat
    const member = await prisma.chatMember.findUnique({
      where: {
        chatId_userId: {
          chatId,
          userId
        }
      }
    });

    if (!member) {
      return res.status(403).json({ error: 'Not a member of this chat' });
    }

    const messages = await prisma.message.findMany({
      where: {
        chatId,
        ...(before && {
          createdAt: {
            lt: new Date(before as string)
          }
        })
      },
      include: {
        readBy: true,
        reactions: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: parseInt(limit as string)
    });

    // Get sender details
    const senderIds = [...new Set(messages.map(m => m.senderId))];
    const senders = await prisma.user.findMany({
      where: {
        id: { in: senderIds }
      },
      select: {
        id: true,
        name: true,
        profileImage: true
      }
    });

    const senderMap = new Map(senders.map(s => [s.id, s]));

    const formattedMessages = messages.map(msg => ({
      ...msg,
      sender: senderMap.get(msg.senderId)
    })).reverse();

    res.json(formattedMessages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send a message
router.post('/chats/:chatId/messages', auth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { chatId } = req.params;
    const { content, type = 'text', replyTo } = req.body;

    // Verify user is a member of the chat
    const member = await prisma.chatMember.findUnique({
      where: {
        chatId_userId: {
          chatId,
          userId
        }
      }
    });

    if (!member) {
      return res.status(403).json({ error: 'Not a member of this chat' });
    }

    const message = await prisma.message.create({
      data: {
        chatId,
        senderId: userId,
        content,
        type,
        replyTo
      },
      include: {
        readBy: true,
        reactions: true
      }
    });

    // Update chat's updatedAt
    await prisma.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() }
    });

    // Get sender details
    const sender = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        profileImage: true
      }
    });

    res.status(201).json({
      ...message,
      sender
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Mark messages as read
router.post('/chats/:chatId/read', auth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { chatId } = req.params;
    const { messageIds } = req.body;

    // Update lastRead timestamp for the member
    await prisma.chatMember.update({
      where: {
        chatId_userId: {
          chatId,
          userId
        }
      },
      data: {
        lastRead: new Date()
      }
    });

    // Create read receipts for messages
    if (messageIds && messageIds.length > 0) {
      await prisma.messageRead.createMany({
        data: messageIds.map((msgId: string) => ({
          messageId: msgId,
          userId
        })),
        skipDuplicates: true
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

// Add reaction to message
router.post('/messages/:messageId/reactions', auth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { messageId } = req.params;
    const { emoji } = req.body;

    const reaction = await prisma.messageReaction.create({
      data: {
        messageId,
        userId,
        emoji
      }
    });

    res.status(201).json(reaction);
  } catch (error) {
    console.error('Error adding reaction:', error);
    res.status(500).json({ error: 'Failed to add reaction' });
  }
});

// Remove reaction from message
router.delete('/messages/:messageId/reactions/:emoji', auth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { messageId, emoji } = req.params;

    await prisma.messageReaction.deleteMany({
      where: {
        messageId,
        userId,
        emoji
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error removing reaction:', error);
    res.status(500).json({ error: 'Failed to remove reaction' });
  }
});

// Delete a message
router.delete('/messages/:messageId', auth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { messageId } = req.params;

    const message = await prisma.message.findUnique({
      where: { id: messageId }
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.senderId !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this message' });
    }

    await prisma.message.update({
      where: { id: messageId },
      data: { deleted: true, content: 'This message was deleted' }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// Search users for chat
router.get('/users/search', auth, async (req, res) => {
  try {
    const { query } = req.query;
    const userId = req.user!.id;

    if (!query) {
      return res.json([]);
    }

    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: userId } },
          {
            OR: [
              { name: { contains: query as string, mode: 'insensitive' } },
              { email: { contains: query as string, mode: 'insensitive' } }
            ]
          }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        profileImage: true
      },
      take: 10
    });

    res.json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

// Clear all messages in a chat
router.delete('/chats/:chatId/messages', auth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { chatId } = req.params;

    // Verify user is a member of the chat
    const membership = await prisma.chatMember.findFirst({
      where: {
        chatId,
        userId
      }
    });

    if (!membership) {
      return res.status(403).json({ error: 'You are not a member of this chat' });
    }

    // Delete all messages in the chat
    await prisma.message.deleteMany({
      where: {
        chatId
      }
    });

    res.json({ message: 'Chat cleared successfully' });
  } catch (error) {
    console.error('Error clearing chat:', error);
    res.status(500).json({ error: 'Failed to clear chat' });
  }
});

export { router as chatRouter };
