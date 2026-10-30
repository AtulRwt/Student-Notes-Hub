import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';

interface AuthSocket extends Socket {
  userId?: string;
}

const userSockets = new Map<string, string>(); // userId -> socketId
const socketUsers = new Map<string, string>(); // socketId -> userId

export const initializeSocket = (server: HTTPServer) => {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  // Authentication middleware
  io.use((socket: AuthSocket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; email: string };
      socket.userId = decoded.id;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: AuthSocket) => {
    const userId = socket.userId!;
    console.log(`User connected: ${userId} (${socket.id})`);

    // Store socket mapping
    userSockets.set(userId, socket.id);
    socketUsers.set(socket.id, userId);

    // Emit online status to user's contacts
    socket.broadcast.emit('user:online', { userId });

    // Join user's chat rooms
    prisma.chatMember.findMany({
      where: { userId }
    }).then(members => {
      members.forEach(member => {
        socket.join(`chat:${member.chatId}`);
      });
    });

    // Handle typing indicator
    socket.on('typing:start', ({ chatId }) => {
      socket.to(`chat:${chatId}`).emit('typing:start', {
        userId,
        chatId
      });
    });

    socket.on('typing:stop', ({ chatId }) => {
      socket.to(`chat:${chatId}`).emit('typing:stop', {
        userId,
        chatId
      });
    });

    // Handle new message
    socket.on('message:send', async (data) => {
      try {
        const { chatId, content, type: clientType = 'text', replyTo, fileUrl, fileName, fileType } = data;

        // Determine final message type
        let type = clientType as string;
        if (fileUrl) {
          if (fileType && typeof fileType === 'string' && fileType.startsWith('image/')) {
            type = 'image';
          } else {
            type = 'file';
          }
        }

        // Verify user is a member
        const member = await prisma.chatMember.findUnique({
          where: {
            chatId_userId: {
              chatId,
              userId
            }
          }
        });

        if (!member) {
          socket.emit('error', { message: 'Not a member of this chat' });
          return;
        }

        // Create message
        const message = await prisma.message.create({
          data: {
            chatId,
            senderId: userId,
            content,
            type,
            replyTo,
            fileUrl: fileUrl || null,
            fileName: fileName || null
          },
          include: {
            readBy: true,
            reactions: true
          }
        });

        // Update chat timestamp
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

        const messageWithSender = {
          ...message,
          sender,
          // Include fileType for frontend rendering (not persisted in DB)
          fileType: fileType || null
        };

        // Emit to all members in the chat room
        io.to(`chat:${chatId}`).emit('message:new', messageWithSender);

        // Send notification to offline users
        const chatMembers = await prisma.chatMember.findMany({
          where: { chatId, userId: { not: userId } }
        });

        chatMembers.forEach(async (m) => {
          const memberSocketId = userSockets.get(m.userId);
          if (!memberSocketId) {
            // User is offline, could send push notification here
            console.log(`User ${m.userId} is offline, should send notification`);
          }
        });

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle message read
    socket.on('message:read', async (data) => {
      try {
        const { chatId, messageIds } = data;

        // Update lastRead
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

        // Create read receipts
        if (messageIds && messageIds.length > 0) {
          await prisma.messageRead.createMany({
            data: messageIds.map((msgId: string) => ({
              messageId: msgId,
              userId
            })),
            skipDuplicates: true
          });

          // Emit read status to chat members
          socket.to(`chat:${chatId}`).emit('messages:read', {
            userId,
            messageIds,
            chatId
          });
        }
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    // Handle message reaction
    socket.on('message:react', async (data) => {
      try {
        const { messageId, emoji, action } = data; // action: 'add' or 'remove'

        if (action === 'add') {
          await prisma.messageReaction.create({
            data: {
              messageId,
              userId,
              emoji
            }
          });
        } else {
          await prisma.messageReaction.deleteMany({
            where: {
              messageId,
              userId,
              emoji
            }
          });
        }

        // Get message to find chatId
        const message = await prisma.message.findUnique({
          where: { id: messageId }
        });

        if (message) {
          const reactions = await prisma.messageReaction.findMany({
            where: { messageId }
          });

          io.to(`chat:${message.chatId}`).emit('message:reaction', {
            messageId,
            userId,
            emoji,
            action,
            reactions
          });
        }
      } catch (error) {
        console.error('Error handling reaction:', error);
      }
    });

    // Handle message delete
    socket.on('message:delete', async (data) => {
      try {
        const { messageId } = data;

        const message = await prisma.message.findUnique({
          where: { id: messageId }
        });

        if (!message) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }

        if (message.senderId !== userId) {
          socket.emit('error', { message: 'Not authorized' });
          return;
        }

        await prisma.message.update({
          where: { id: messageId },
          data: {
            deleted: true,
            content: 'This message was deleted'
          }
        });

        io.to(`chat:${message.chatId}`).emit('message:deleted', {
          messageId,
          chatId: message.chatId
        });
      } catch (error) {
        console.error('Error deleting message:', error);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${userId} (${socket.id})`);
      
      // Remove socket mapping
      userSockets.delete(userId);
      socketUsers.delete(socket.id);

      // Emit offline status
      socket.broadcast.emit('user:offline', { userId });
    });
  });

  return io;
};

export { userSockets, socketUsers };
