import express, { Request, Response } from 'express';
import { prisma } from '../index';

export const tagsRouter = express.Router();

// Get all tags
tagsRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const tags = await prisma.tag.findMany({
      orderBy: {
        name: 'asc'
      }
    });
    
    res.json(tags);
  } catch (error) {
    console.error('Get tags error:', error);
    res.status(500).json({ error: 'Failed to get tags' });
  }
});

// Get notes by tag
tagsRouter.get('/:tagId/notes', async (req: Request, res: Response) => {
  try {
    const { tagId } = req.params;
    
    // Check if tag exists
    const tag = await prisma.tag.findUnique({
      where: { id: tagId }
    });
    
    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }
    
    // Get notes with this tag
    const notes = await prisma.note.findMany({
      where: {
        tags: {
          some: {
            tagId
          }
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        },
        tags: {
          include: {
            tag: true
          }
        },
        _count: {
          select: {
            favorites: true,
            comments: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    res.json(notes);
  } catch (error) {
    console.error('Get notes by tag error:', error);
    res.status(500).json({ error: 'Failed to get notes by tag' });
  }
}); 