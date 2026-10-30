import express, { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary';
import { prisma } from '../index';
import { auth } from '../middleware/auth';
import { geminiService } from '../services/ai/gemini';
import crypto from 'crypto';

export const notesRouter = express.Router();

// Temporary uploadDir for backward compatibility (file deletion code still uses it)
const uploadDir = path.resolve(process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads'));

// Configure Cloudinary storage for multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req: any, file: any) => {
    // 1. Get file extension and name
    const fileExtension = file.originalname.split('.').pop()?.toLowerCase() || '';
    const fileName = file.originalname.split('.').slice(0, -1).join('.').replace(/[^a-zA-Z0-9]/g, "_");

    // 2. Create a unique filename WITH extension (Critical for raw files)
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const publicId = `${fileName}-${uniqueSuffix}`;

    // 3. Determine resource type
    const isImage = file.mimetype.startsWith('image/');
    const isPdf = file.mimetype === 'application/pdf';

    // PDFs should be 'auto' (treated as viewable documents by Cloudinary)
    // Images are 'image'
    // Other docs (Word, Excel) MUST be 'raw'
    let resourceType = 'raw';
    if (isImage) resourceType = 'image';
    if (isPdf) resourceType = 'auto';

    // 4. Do NOT force download (Office docs) so they can be viewed inline via in-app viewers (Google Docs / MS Office)
    const flags = undefined;

    // CRITICAL FIX: For raw files, we MUST append extension to public_id manually.
    // Cloudinary stores raw files exactly as named. If no extension in name, URL has no extension.
    let finalPublicId = publicId;
    if (resourceType === 'raw' && fileExtension) {
      finalPublicId = `${publicId}.${fileExtension}`;
    }

    return {
      folder: 'student-notes-uploads',
      allowed_formats: [
        // Documents
        'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'csv', 'rtf', 'odt', 'odp', 'ods',
        // Images
        'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'tif', 'tiff', 'ico',
        // Archives
        'zip', 'rar',
      ],
      resource_type: resourceType,
      public_id: finalPublicId,
      format: fileExtension,
      flags: flags,
    };
  },
} as any);

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB max file size
  },
  fileFilter: (req, file, cb) => {
    console.log(`Checking file type: ${file.mimetype} for file: ${file.originalname}`);

    const allowedMimeTypes = new Set([
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
      'text/tab-separated-values',
      'application/rtf',
      'text/rtf',
      'application/vnd.oasis.opendocument.text',
      'application/vnd.oasis.opendocument.spreadsheet',
      'application/vnd.oasis.opendocument.presentation',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/bmp',
      'image/webp',
      'image/tiff',
      'image/svg+xml',
      'application/zip',
      'application/x-rar-compressed',
      'application/vnd.rar',
      'application/octet-stream', // generic fallback some browsers use for docx/pptx
    ]);

    const allowedExts = new Set([
      'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx',
      'txt', 'csv', 'tsv', 'rtf', 'odt', 'odp', 'ods',
      'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'tif', 'tiff',
      'zip', 'rar',
    ]);

    const fileExt = (file.originalname.split('.').pop() || '').toLowerCase();
    const isAllowed = allowedMimeTypes.has(file.mimetype) || allowedExts.has(fileExt);

    if (isAllowed) {
      console.log(`File type ${file.mimetype} (.${fileExt}) is allowed`);
      cb(null, true);
    } else {
      console.log(`File type ${file.mimetype} (.${fileExt}) is not allowed`);
      cb(new Error(`File type "${file.mimetype}" (.${fileExt}) is not supported.`));
    }
  }
});

// Custom error handling for multer
const uploadMiddleware = (req: Request, res: Response, next: NextFunction) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      console.error('Multer error:', err);
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
        }
      }
      return res.status(400).json({ error: err.message });
    }
    next();
  });
};

// Validation schemas
const createNoteSchema = z.object({
  title: z.string().min(3),
  description: z.string(),
  externalUrl: z.string().url().optional(),
  semester: z.string(),
  courseId: z.string().optional(),
  tags: z.array(z.string())
});

const updateNoteSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  externalUrl: z.string().url().optional(),
  semester: z.string().optional(),
  courseId: z.string().optional(),
  tags: z.array(z.string()).optional()
});

// Create a new note with file upload - use the custom middleware
notesRouter.post('/', auth, uploadMiddleware, async (req: Request, res: Response) => {
  try {
    console.log('File upload request received');
    console.log('Request body:', req.body);
    console.log('File details:', req.file);

    const { title, description, externalUrl, semester, courseId, tags } = req.body;

    // Validate input
    const validInput = createNoteSchema.safeParse({
      title,
      description,
      externalUrl,
      semester,
      courseId,
      tags: tags ? JSON.parse(tags) : []
    });

    if (!validInput.success) {
      // Delete uploaded file if validation fails
      if (req.file) {
        console.log('Validation failed, removing uploaded file:', req.file.path);
        fs.unlinkSync(req.file.path);
      }
      console.log('Validation errors:', validInput.error.issues);
      return res.status(400).json({ error: validInput.error.issues });
    }

    console.log('Validation passed, creating note in database');

    // Create note in database
    const note = await prisma.note.create({
      data: {
        title: validInput.data.title,
        description: validInput.data.description,
        externalUrl: validInput.data.externalUrl,
        fileUrl: req.file ? (req.file as any).path : null, // Cloudinary URL is in req.file.path
        semester: validInput.data.semester,
        courseId: validInput.data.courseId,
        user: {
          connect: { id: req.user!.id }
        }
      }
    });

    console.log('Note created:', note.id);
    console.log('File URL (if any):', note.fileUrl);

    // Create tags or connect existing ones
    const parsedTags = validInput.data.tags || [];

    if (parsedTags.length > 0) {
      console.log('Processing tags:', parsedTags);
      await Promise.all(
        parsedTags.map(async (tagName) => {
          // Find tag or create if doesn't exist
          const tag = await prisma.tag.upsert({
            where: { name: tagName },
            update: {},
            create: { name: tagName }
          });

          // Create relationship between note and tag
          await prisma.noteTags.create({
            data: {
              noteId: note.id,
              tagId: tag.id
            }
          });
        })
      );
      console.log('Tags processing completed');
    }

    // Get the created note with tags
    const noteWithTags = await prisma.note.findUnique({
      where: { id: note.id },
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
            tag: true
          }
        }
      }
    });

    console.log('Returning note with tags');
    res.status(201).json(noteWithTags);
  } catch (error) {
    console.error('Create note error details:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Create note error stack:', error instanceof Error ? error.stack : 'No stack trace');

    // Delete uploaded file if there's an error
    if (req.file) {
      console.log('Error occurred, removing uploaded file:', req.file.path);
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      error: 'Failed to create note',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all notes with filtering
notesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { search, semester, subject, course } = req.query;

    // Use proper Prisma types
    const filter: any = { AND: [] };

    // Enhanced search logic
    if (search && typeof search === 'string') {
      const trimmedSearch = search.trim();

      // Check if it's an exact search (enclosed in quotes)
      const isExactSearch = /^"[^"]+"$/.test(trimmedSearch);
      let searchText = trimmedSearch;

      if (isExactSearch) {
        // Remove the quotes for the search
        searchText = trimmedSearch.substring(1, trimmedSearch.length - 1);

        // For exact search, use equality where possible
        filter.OR = [
          { title: { equals: searchText, mode: 'insensitive' } },
          { description: { contains: searchText, mode: 'insensitive' } },
          {
            tags: {
              some: {
                tag: {
                  name: { equals: searchText, mode: 'insensitive' }
                }
              }
            }
          }
        ];
      } else {
        // Prepare search terms for more effective searching
        const searchTerms = searchText
          .toLowerCase()
          .split(/\s+/)
          .filter(term => term.length > 1); // Filter out single characters

        if (searchTerms.length > 0) {
          const searchConditions: any[] = [];

          // Title search (higher weight in relevance calculation)
          searchConditions.push({
            OR: searchTerms.map(term => ({
              title: {
                contains: term,
                mode: 'insensitive'
              }
            }))
          });

          // Description search
          searchConditions.push({
            OR: searchTerms.map(term => ({
              description: {
                contains: term,
                mode: 'insensitive'
              }
            }))
          });

          // Tag search
          searchConditions.push({
            OR: searchTerms.map(term => ({
              tags: {
                some: {
                  tag: {
                    name: {
                      contains: term,
                      mode: 'insensitive'
                    }
                  }
                }
              }
            }))
          });

          filter.OR = searchConditions;
        }
      }
    }

    // Other filters
    const andFilters: any[] = [];

    if (semester) {
      andFilters.push({ semester: semester as string });
    }

    if (subject) {
      andFilters.push({
        tags: {
          some: {
            tag: {
              name: subject as string
            }
          }
        }
      });
    }

    if (course) {
      // Since we don't have a direct course relation in this example,
      // we can search for it in tags or other relevant fields
      andFilters.push({
        OR: [
          // Look for course in tags
          {
            tags: {
              some: {
                tag: {
                  name: { contains: course as string, mode: 'insensitive' }
                }
              }
            }
          },
          // Look for course in title
          {
            title: { contains: course as string, mode: 'insensitive' }
          }
        ]
      });
    }

    // Add AND filters if they exist
    if (andFilters.length > 0) {
      filter.AND = andFilters;
    } else {
      delete filter.AND;
    }

    // Get notes with filtering
    const notes = await prisma.note.findMany({
      where: filter,
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

    // If search was performed, add a relevance score for the frontend
    let notesWithRelevance = notes;

    if (search && typeof search === 'string' && search.trim() !== '') {
      const searchTerms = search.toLowerCase().split(/\s+/);

      notesWithRelevance = notes.map(note => {
        // Calculate a simple relevance score based on search terms
        let relevanceScore = 0;

        // Title matches carry highest weight
        searchTerms.forEach(term => {
          if (note.title.toLowerCase().includes(term)) {
            relevanceScore += 3;
          }

          // Exact title match gets extra points
          if (note.title.toLowerCase() === search.toLowerCase()) {
            relevanceScore += 5;
          }

          // Description matches
          if (note.description.toLowerCase().includes(term)) {
            relevanceScore += 1;
          }

          // Tag matches (if tags exist)
          if (note.tags && Array.isArray(note.tags)) {
            note.tags.forEach((tagRel: any) => {
              if (tagRel.tag && tagRel.tag.name &&
                tagRel.tag.name.toLowerCase().includes(term)) {
                relevanceScore += 2;
              }
            });
          }
        });

        return {
          ...note,
          _relevance: relevanceScore
        };
      });

      // Sort by relevance score
      notesWithRelevance.sort((a: any, b: any) => b._relevance - a._relevance);
    }

    // Return search metadata with results
    res.json({
      results: notesWithRelevance,
      totalCount: notesWithRelevance.length,
      searchPerformed: !!search && typeof search === 'string' && search.trim() !== ''
    });
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({ error: 'Failed to get notes' });
  }
});

// Get a single note by ID
notesRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const note = await prisma.note.findUnique({
      where: { id },
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
            tag: true
          }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                profileImage: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            favorites: true
          }
        }
      }
    });

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json(note);
  } catch (error) {
    console.error('Get note error:', error);
    res.status(500).json({ error: 'Failed to get note' });
  }
});

// Update a note
notesRouter.put('/:id', auth, upload.single('file'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, externalUrl, semester, courseId, tags } = req.body;

    // Validate input
    const validInput = updateNoteSchema.safeParse({
      title,
      description,
      externalUrl,
      semester,
      courseId,
      tags: tags ? JSON.parse(tags) : undefined
    });

    if (!validInput.success) {
      // Delete uploaded file if validation fails
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ error: validInput.error.issues });
    }

    // Check if note exists and belongs to user
    const existingNote = await prisma.note.findUnique({
      where: { id },
      include: {
        tags: true
      }
    });

    if (!existingNote) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ error: 'Note not found' });
    }

    if (existingNote.userId !== req.user!.id) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(403).json({ error: 'Not authorized to update this note' });
    }

    // Handle file updates
    let fileUrl = existingNote.fileUrl;

    if (req.file) {
      // Delete old file if it exists
      if (existingNote.fileUrl) {
        const oldFilePath = path.join(
          process.cwd(),
          existingNote.fileUrl.replace(/^\/uploads\//, uploadDir + '/')
        );

        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      // Set new file URL
      fileUrl = `/uploads/${req.file.filename}`;
    }

    // Update note
    const updatedNote = await prisma.note.update({
      where: { id },
      data: {
        title: validInput.data.title,
        description: validInput.data.description,
        externalUrl: validInput.data.externalUrl,
        fileUrl,
        semester: validInput.data.semester,
        courseId: validInput.data.courseId
      }
    });

    // Update tags if provided
    if (validInput.data.tags) {
      // Delete existing tag relationships
      await prisma.noteTags.deleteMany({
        where: { noteId: id }
      });

      // Create new tag relationships
      await Promise.all(
        validInput.data.tags.map(async (tagName) => {
          // Find tag or create if doesn't exist
          const tag = await prisma.tag.upsert({
            where: { name: tagName },
            update: {},
            create: { name: tagName }
          });

          // Create relationship between note and tag
          await prisma.noteTags.create({
            data: {
              noteId: id,
              tagId: tag.id
            }
          });
        })
      );
    }

    // Get the updated note with tags
    const noteWithTags = await prisma.note.findUnique({
      where: { id },
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
            tag: true
          }
        }
      }
    });

    res.json(noteWithTags);
  } catch (error) {
    console.error('Update note error:', error);

    // Delete uploaded file if there's an error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ error: 'Failed to update note' });
  }
});

// Delete a note
notesRouter.delete('/:id', auth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if note exists and belongs to user
    const existingNote = await prisma.note.findUnique({
      where: { id }
    });

    if (!existingNote) {
      return res.status(404).json({ error: 'Note not found' });
    }

    if (existingNote.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Not authorized to delete this note' });
    }

    // Delete file if it exists
    if (existingNote.fileUrl) {
      const filePath = path.join(
        process.cwd(),
        existingNote.fileUrl.replace(/^\/uploads\//, uploadDir + '/')
      );

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Delete note (cascading will delete related tags)
    await prisma.note.delete({
      where: { id }
    });

    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

// Add/Remove a favorite
notesRouter.post('/:id/favorite', auth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check if note exists
    const note = await prisma.note.findUnique({
      where: { id }
    });

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Check if already favorited
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_noteId: {
          userId,
          noteId: id
        }
      }
    });

    let result;

    if (existingFavorite) {
      // Remove favorite
      result = await prisma.favorite.delete({
        where: {
          userId_noteId: {
            userId,
            noteId: id
          }
        }
      });

      res.json({ action: 'removed', favorite: result });
    } else {
      // Add favorite
      result = await prisma.favorite.create({
        data: {
          userId,
          noteId: id
        }
      });

      res.json({ action: 'added', favorite: result });
    }
  } catch (error) {
    console.error('Favorite note error:', error);
    res.status(500).json({ error: 'Failed to update favorite status' });
  }
});

// Add a comment to a note
notesRouter.post('/:id/comments', auth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    // Check if note exists
    const note = await prisma.note.findUnique({
      where: { id }
    });

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        content,
        userId: req.user!.id,
        noteId: id
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profileImage: true
          }
        }
      }
    });

    res.status(201).json(comment);
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

// Summarize a note using AI - now user-specific
notesRouter.get('/:id/summarize', auth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check if note exists
    const note = await prisma.note.findUnique({
      where: { id }
    });

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Check if user already has a summary for this note
    const existingSummary = await prisma.noteSummary.findUnique({
      where: {
        noteId_userId: {
          noteId: id,
          userId: userId
        }
      }
    });

    // If summary exists, return it without regenerating
    if (existingSummary) {
      return res.json({ summary: existingSummary.content });
    }

    let summary = '';
    let usedFallback = false;

    // Resolve file summarization
    if (note.fileUrl) {
      if (note.fileUrl.startsWith('http://') || note.fileUrl.startsWith('https://')) {
        try {
          console.log(`Generating summary for remote file URL: ${note.fileUrl}`);
          summary = await geminiService.summarizeFile(note.fileUrl);
        } catch (err) {
          console.warn(`Remote file summarization failed for ${note.fileUrl}:`, err);
          usedFallback = true;
        }
      } else {
        // File is stored as a relative path (e.g. /uploads/filename.pdf)
        const fileName = note.fileUrl.split('/').pop();
        if (fileName) {
          const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
          const filePath = path.join(uploadDir, fileName);
          console.log(`Attempting to access local file at: ${filePath}`);

          if (fs.existsSync(filePath)) {
            try {
              console.log(`Generating summary for local file: ${filePath}`);
              summary = await geminiService.summarizeFile(filePath);
            } catch (err) {
              console.warn(`Local file summarization failed:`, err);
              usedFallback = true;
            }
          } else {
            console.log(`Local file not found at ${filePath}. Falling back to metadata-based summary.`);
            usedFallback = true;
          }
        } else {
          usedFallback = true;
        }
      }
    } else {
      usedFallback = true;
    }

    // If file summarization failed or was skipped, generate summary from metadata (title + description)
    if (usedFallback || !summary || summary.includes('Summary unavailable')) {
      console.log(`Generating summary from note metadata (Title: "${note.title}")`);
      const contextText = `Note Title: ${note.title}\n\nNote Description: ${note.description || 'No description provided.'}`;
      summary = await geminiService.summarizeText(contextText);
    }

    // Store the summary in the database as user-specific (upsert to handle re-generation)
    const savedSummary = await prisma.noteSummary.upsert({
      where: {
        noteId_userId: {
          noteId: id,
          userId: userId
        }
      },
      update: {
        content: summary,
        updatedAt: new Date()
      },
      create: {
        id: crypto.randomUUID(),
        content: summary,
        noteId: id,
        userId: userId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    return res.json({ summary: savedSummary.content });
  } catch (error) {
    console.error('Error summarizing note:', error);
    return res.status(500).json({ error: 'Failed to summarize note: ' + (error instanceof Error ? error.message : 'Unknown error') });
  }
}); 