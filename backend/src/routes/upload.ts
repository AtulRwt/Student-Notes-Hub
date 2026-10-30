import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary';
import { auth } from '../middleware/auth';
import { geminiService } from '../services/ai/gemini';

const router = express.Router();

// Configure Cloudinary storage for multer — allow all major document & media formats
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'student-notes-uploads',
    // 'auto' resource_type handles images, videos, and raw files (docs, pdfs, etc.)
    resource_type: 'auto',
    // Tell Cloudinary to allow these extensions
    allowed_formats: [
      // Documents
      'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'csv', 'rtf', 'odt', 'odp', 'ods',
      // Images
      'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'tif', 'tiff', 'ico',
      // Other
      'zip', 'rar',
    ],
  } as any,
});

// Comprehensive set of allowed MIME types
const ALLOWED_MIME_TYPES = new Set([
  // PDF
  'application/pdf',
  // Word
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  // PowerPoint
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // Excel
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  // Text / CSV
  'text/plain',
  'text/csv',
  'text/tab-separated-values',
  // OpenDocument
  'application/vnd.oasis.opendocument.text',
  'application/vnd.oasis.opendocument.spreadsheet',
  'application/vnd.oasis.opendocument.presentation',
  // Rich text
  'application/rtf',
  'text/rtf',
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/bmp',
  'image/webp',
  'image/tiff',
  'image/svg+xml',
  'image/x-icon',
  // Archives
  'application/zip',
  'application/x-rar-compressed',
  'application/vnd.rar',
]);

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit
  },
  fileFilter: (req, file, cb) => {
    console.log(`Checking file type: ${file.mimetype} for file: ${file.originalname}`);

    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      // Also allow by extension for files where the browser sends application/octet-stream
      const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
      const allowedExts = new Set([
        'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'csv', 'rtf',
        'odt', 'odp', 'ods', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp',
        'svg', 'tif', 'tiff', 'ico', 'zip', 'rar',
      ]);

      if (allowedExts.has(ext)) {
        console.log(`Allowing file by extension: .${ext} (mime: ${file.mimetype})`);
        cb(null, true);
      } else {
        cb(new Error(
          `File type "${file.mimetype}" (.${ext}) is not supported. ` +
          `Supported formats: PDF, Word, PowerPoint, Excel, Text, CSV, Images, and more.`
        ));
      }
    }
  }
});

// Custom error handling middleware for multer
const uploadMiddleware = (req: Request, res: Response, next: NextFunction) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      console.error('Multer error in upload route:', err);
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File too large. Maximum size is 25MB.' });
        }
      }
      return res.status(400).json({ error: err.message });
    }
    next();
  });
};

// Upload file endpoint
router.post('/', auth, uploadMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Return the Cloudinary file URL
    const fileUrl = (req.file as any).path; // Cloudinary URL is in req.file.path

    res.json({
      url: fileUrl,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      size: req.file.size
    });
  } catch (error: unknown) {
    console.error('Upload error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to upload file';
    res.status(500).json({ error: errorMessage });
  }
});

// AI-powered metadata extraction endpoint
router.post('/extract-metadata', auth, uploadMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log(`Extracting metadata from file: ${req.file.originalname}`);

    // req.file.path is the Cloudinary URL when using CloudinaryStorage
    const cloudinaryUrl = (req.file as any).path as string;

    // Extract text from the uploaded file (handles remote URLs via download)
    const extractedText = await geminiService.extractTextFromFile(cloudinaryUrl);

    // Use AI to extract metadata
    const metadata = await geminiService.extractDocumentMetadata(
      extractedText,
      req.file.originalname
    );

    // Return metadata along with file info
    res.json({
      url: cloudinaryUrl,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      size: req.file.size,
      metadata: {
        title: metadata.title,
        description: metadata.description,
        suggestedTags: metadata.suggestedTags,
        detectedSemester: metadata.detectedSemester,
        confidence: metadata.confidence
      }
    });
  } catch (error: unknown) {
    console.error('Metadata extraction error:', error);

    // If there's an error, still return the file info without metadata
    if (req.file) {
      res.json({
        url: (req.file as any).path,
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        size: req.file.size,
        metadata: null,
        error: 'Failed to extract metadata. Please fill the form manually.'
      });
    } else {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process file';
      res.status(500).json({ error: errorMessage });
    }
  }
});

export default router;
