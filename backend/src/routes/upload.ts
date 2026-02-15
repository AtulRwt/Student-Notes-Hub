import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary';
import { auth } from '../middleware/auth';
import { geminiService } from '../services/ai/gemini';

const router = express.Router();

// Configure Cloudinary storage for multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'student-notes-uploads',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx'],
    resource_type: 'auto', // Automatically detect resource type (image, raw, video)
  } as any,
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
});

// Upload file endpoint
router.post('/', auth, upload.single('file'), async (req: Request, res: Response) => {
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

// NEW: AI-powered metadata extraction endpoint
router.post('/extract-metadata', auth, upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log(`Extracting metadata from file: ${req.file.originalname}`);

    // Extract text from the uploaded file
    const filePath = req.file.path;
    const extractedText = await geminiService.extractTextFromFile(filePath);

    // Use AI to extract metadata
    const metadata = await geminiService.extractDocumentMetadata(
      extractedText,
      req.file.originalname
    );

    // Return metadata along with file info
    res.json({
      url: (req.file as any).path, // Cloudinary URL
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
        url: (req.file as any).path, // Cloudinary URL
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
