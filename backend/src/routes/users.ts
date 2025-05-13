import express, { Request, Response } from 'express';
import { prisma } from '../index';
import { auth } from '../middleware/auth';

export const usersRouter = express.Router();

// Follow a user
usersRouter.post('/follow/:userId', auth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const followerId = req.user!.id;

    // Check if user exists
    const userToFollow = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!userToFollow) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId: userId
        }
      }
    });

    if (existingFollow) {
      return res.status(400).json({ error: 'Already following this user' });
    }

    // Create follow relationship
    await prisma.follow.create({
      data: {
        followerId,
        followingId: userId
      }
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId, // user being followed receives notification
        causerId: followerId, // user who followed caused the notification
        type: 'follow'
      }
    });

    res.status(200).json({ message: 'Successfully followed user' });
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({ error: 'Failed to follow user' });
  }
});

// Unfollow a user
usersRouter.delete('/unfollow/:userId', auth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const followerId = req.user!.id;

    // Check if follow relationship exists
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId: userId
        }
      }
    });

    if (!existingFollow) {
      return res.status(400).json({ error: 'Not following this user' });
    }

    // Delete follow relationship
    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId: userId
        }
      }
    });

    res.status(200).json({ message: 'Successfully unfollowed user' });
  } catch (error) {
    console.error('Unfollow user error:', error);
    res.status(500).json({ error: 'Failed to unfollow user' });
  }
});

// Get user's followers
usersRouter.get('/:userId/followers', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get followers with pagination
    const followers = await prisma.follow.findMany({
      where: { followingId: userId },
      include: {
        follower: {
          select: {
            id: true,
            name: true,
            profileImage: true,
            bio: true,
            _count: {
              select: {
                followers: true,
                following: true,
                notes: true
              }
            }
          }
        }
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    // Get total count for pagination
    const totalCount = await prisma.follow.count({
      where: { followingId: userId }
    });

    res.status(200).json({
      followers: followers.map(f => f.follower),
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit)
    });
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({ error: 'Failed to get followers' });
  }
});

// Get users that a user is following
usersRouter.get('/:userId/following', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get following with pagination
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      include: {
        following: {
          select: {
            id: true,
            name: true,
            profileImage: true,
            bio: true,
            _count: {
              select: {
                followers: true,
                following: true,
                notes: true
              }
            }
          }
        }
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    // Get total count for pagination
    const totalCount = await prisma.follow.count({
      where: { followerId: userId }
    });

    res.status(200).json({
      following: following.map(f => f.following),
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit)
    });
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({ error: 'Failed to get following users' });
  }
});

// Send connection request (LinkedIn-style)
usersRouter.post('/connect/:userId', auth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const senderId = req.user!.id;

    // Check if user exists
    const userToConnect = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!userToConnect) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if request already exists
    const existingRequest = await prisma.connectionRequest.findUnique({
      where: {
        senderId_receiverId: {
          senderId,
          receiverId: userId
        }
      }
    });

    if (existingRequest) {
      return res.status(400).json({ 
        error: 'Connection request already exists',
        status: existingRequest.status 
      });
    }

    // Check if there's a request in the opposite direction
    const oppositeRequest = await prisma.connectionRequest.findUnique({
      where: {
        senderId_receiverId: {
          senderId: userId,
          receiverId: senderId
        }
      }
    });

    if (oppositeRequest) {
      // If there's a pending request from the other user, automatically accept it
      if (oppositeRequest.status === 'pending') {
        await prisma.connectionRequest.update({
          where: { id: oppositeRequest.id },
          data: { status: 'accepted' }
        });

        // Create notification for the accepted connection
        await prisma.notification.create({
          data: {
            userId, // other user
            causerId: senderId, // current user
            type: 'connection_accepted'
          }
        });

        return res.status(200).json({ 
          message: 'Connection established',
          status: 'accepted' 
        });
      }
    }

    // Create connection request
    const connectionRequest = await prisma.connectionRequest.create({
      data: {
        senderId,
        receiverId: userId,
        status: 'pending'
      }
    });

    // Create notification for connection request
    await prisma.notification.create({
      data: {
        userId, // user receiving the request gets notification
        causerId: senderId, // user who sent request caused the notification
        type: 'connection_request'
      }
    });

    res.status(200).json({ 
      message: 'Connection request sent',
      request: connectionRequest
    });
  } catch (error) {
    console.error('Connection request error:', error);
    res.status(500).json({ error: 'Failed to send connection request' });
  }
});

// Accept/reject connection request
usersRouter.post('/connect/:userId/:action', auth, async (req: Request, res: Response) => {
  try {
    const { userId, action } = req.params;
    const receiverId = req.user!.id;

    if (action !== 'accept' && action !== 'decline') {
      return res.status(400).json({ error: 'Invalid action' });
    }

    // Check if request exists
    const connectionRequest = await prisma.connectionRequest.findUnique({
      where: {
        senderId_receiverId: {
          senderId: userId,
          receiverId
        }
      }
    });

    if (!connectionRequest) {
      return res.status(404).json({ error: 'Connection request not found' });
    }

    if (connectionRequest.status !== 'pending') {
      return res.status(400).json({ 
        error: 'Connection request already processed',
        status: connectionRequest.status
      });
    }

    // Update connection request status
    const updatedRequest = await prisma.connectionRequest.update({
      where: { id: connectionRequest.id },
      data: { status: action === 'accept' ? 'accepted' : 'declined' }
    });

    if (action === 'accept') {
      // Create notification for the accepted connection
      await prisma.notification.create({
        data: {
          userId, // original sender
          causerId: receiverId, // current user who accepted
          type: 'connection_accepted'
        }
      });
    }

    res.status(200).json({ 
      message: `Connection request ${action}ed`,
      request: updatedRequest
    });
  } catch (error) {
    console.error('Process connection request error:', error);
    res.status(500).json({ error: 'Failed to process connection request' });
  }
});

// Get pending connection requests for current user
usersRouter.get('/connections/requests', auth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    
    const pendingRequests = await prisma.connectionRequest.findMany({
      where: { 
        receiverId: userId,
        status: 'pending'
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            profileImage: true,
            bio: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json(pendingRequests);
  } catch (error) {
    console.error('Get connection requests error:', error);
    res.status(500).json({ error: 'Failed to get connection requests' });
  }
});

// Get all connections for user (accepted only)
usersRouter.get('/connections', auth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    
    // Get connections where user is sender
    const sentConnections = await prisma.connectionRequest.findMany({
      where: { 
        senderId: userId,
        status: 'accepted'
      },
      include: {
        receiver: {
          select: {
            id: true,
            name: true,
            profileImage: true,
            bio: true,
            _count: {
              select: {
                notes: true,
                followers: true
              }
            }
          }
        }
      }
    });
    
    // Get connections where user is receiver
    const receivedConnections = await prisma.connectionRequest.findMany({
      where: { 
        receiverId: userId,
        status: 'accepted'
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            profileImage: true,
            bio: true,
            _count: {
              select: {
                notes: true,
                followers: true
              }
            }
          }
        }
      }
    });

    // Combine and format connections
    const connections = [
      ...sentConnections.map(conn => conn.receiver),
      ...receivedConnections.map(conn => conn.sender)
    ];

    res.status(200).json(connections);
  } catch (error) {
    console.error('Get connections error:', error);
    res.status(500).json({ error: 'Failed to get connections' });
  }
});

// Get suggested users to follow/connect
usersRouter.get('/suggestions', auth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 5;
    
    // Get users the current user is following
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true }
    });
    
    const followingIds = following.map(f => f.followingId);
    
    // Find users not being followed by the current user, ordered by most followed
    const suggestedUsers = await prisma.user.findMany({
      where: { 
        id: { 
          not: userId,
          notIn: followingIds 
        }
      },
      select: {
        id: true,
        name: true,
        profileImage: true,
        bio: true,
        _count: {
          select: {
            followers: true,
            notes: true
          }
        }
      },
      orderBy: [
        { followers: { _count: 'desc' } },
        { notes: { _count: 'desc' } }
      ],
      take: limit
    });

    res.status(200).json(suggestedUsers);
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({ error: 'Failed to get user suggestions' });
  }
});

// Get notifications for current user
usersRouter.get('/notifications', auth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    
    const notifications = await prisma.notification.findMany({
      where: { userId },
      include: {
        causer: {
          select: {
            id: true,
            name: true,
            profileImage: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });
    
    const totalCount = await prisma.notification.count({
      where: { userId }
    });
    
    res.status(200).json({
      notifications,
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit)
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
});

// Mark notifications as read
usersRouter.put('/notifications/read', auth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { notificationIds } = req.body;
    
    if (!notificationIds || !Array.isArray(notificationIds)) {
      return res.status(400).json({ error: 'Notification IDs are required' });
    }
    
    await prisma.notification.updateMany({
      where: { 
        id: { in: notificationIds },
        userId
      },
      data: { read: true }
    });
    
    res.status(200).json({ message: 'Notifications marked as read' });
  } catch (error) {
    console.error('Mark notifications read error:', error);
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
});

// Check follow/connection status between current user and another user
usersRouter.get('/relationship/:userId', auth, async (req: Request, res: Response) => {
  try {
    const currentUserId = req.user!.id;
    const { userId } = req.params;
    
    // Check follow status
    const followRelationship = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: userId
        }
      }
    });
    
    // Check connection status
    const sentConnectionRequest = await prisma.connectionRequest.findUnique({
      where: {
        senderId_receiverId: {
          senderId: currentUserId,
          receiverId: userId
        }
      }
    });
    
    const receivedConnectionRequest = await prisma.connectionRequest.findUnique({
      where: {
        senderId_receiverId: {
          senderId: userId,
          receiverId: currentUserId
        }
      }
    });
    
    const relationship = {
      following: !!followRelationship,
      sentRequest: sentConnectionRequest ? sentConnectionRequest.status : null,
      receivedRequest: receivedConnectionRequest ? receivedConnectionRequest.status : null,
      connected: (sentConnectionRequest && sentConnectionRequest.status === 'accepted') || 
                (receivedConnectionRequest && receivedConnectionRequest.status === 'accepted')
    };
    
    res.status(200).json(relationship);
  } catch (error) {
    console.error('Get relationship error:', error);
    res.status(500).json({ error: 'Failed to get relationship status' });
  }
});

// Get user profile by ID
usersRouter.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    // Find user by ID, excluding password
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        profileImage: true,
        bio: true,
        education: true,
        interests: true,
        socialLinks: true,
        createdAt: true,
        _count: {
          select: {
            notes: true,
            followers: true,
            following: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
});

// Get user's notes
usersRouter.get('/:userId/notes', auth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?.id;
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's notes
    const notes = await prisma.note.findMany({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profileImage: true
          }
        },
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        _count: {
          select: {
            favorites: true,
            comments: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Check if current user has favorited these notes
    const notesWithFavorited = await Promise.all(
      notes.map(async (note) => {
        let isFavorited = false;
        
        if (currentUserId) {
          const favorite = await prisma.favorite.findUnique({
            where: {
              userId_noteId: {
                userId: currentUserId,
                noteId: note.id
              }
            }
          });
          
          isFavorited = !!favorite;
        }
        
        return {
          ...note,
          isFavorited
        };
      })
    );

    res.status(200).json(notesWithFavorited);
  } catch (error) {
    console.error('Get user notes error:', error);
    res.status(500).json({ error: 'Failed to get user notes' });
  }
});

// Remove connection with another user
usersRouter.delete('/connections/:userId', auth, async (req: Request, res: Response) => {
  try {
    const currentUserId = req.user!.id;
    const { userId } = req.params;
    
    // Check and delete connection where current user is sender
    const sentConnection = await prisma.connectionRequest.findUnique({
      where: {
        senderId_receiverId: {
          senderId: currentUserId,
          receiverId: userId
        }
      }
    });
    
    // Check and delete connection where current user is receiver
    const receivedConnection = await prisma.connectionRequest.findUnique({
      where: {
        senderId_receiverId: {
          senderId: userId,
          receiverId: currentUserId
        }
      }
    });
    
    // Delete the appropriate connection
    if (sentConnection) {
      await prisma.connectionRequest.delete({
        where: {
          id: sentConnection.id
        }
      });
    }
    
    if (receivedConnection) {
      await prisma.connectionRequest.delete({
        where: {
          id: receivedConnection.id
        }
      });
    }
    
    if (!sentConnection && !receivedConnection) {
      return res.status(404).json({ error: 'Connection not found' });
    }
    
    res.status(200).json({ message: 'Connection removed successfully' });
  } catch (error) {
    console.error('Remove connection error:', error);
    res.status(500).json({ error: 'Failed to remove connection' });
  }
}); 