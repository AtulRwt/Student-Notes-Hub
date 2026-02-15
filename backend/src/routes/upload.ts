import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { auth } from '../middleware/auth';
import { geminiService } from '../services/ai/gemini';
import fs from 'fs';

const router = express.Router();

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images, PDFs, and documents (Word/Excel/OpenXML)
    const allowedExts = ['.jpeg', '.jpg', '.png', '.gif', '.webp', '.bmp', '.svg', '.pdf', '.doc', '.docx', '.txt', '.xls', '.xlsx'];
    const allowedMimes = new Set([
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml',
      'application/pdf', 'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]);

    const ext = path.extname(file.originalname).toLowerCase();
    const extAllowed = allowedExts.includes(ext);
    const mimeAllowed = allowedMimes.has(file.mimetype);

    if (extAllowed || mimeAllowed) {
      return cb(null, true);
    }

    cb(new Error('Invalid file type. Only images, PDFs, and documents are allowed.'));
  }
});

// Upload file endpoint
router.post('/', auth, upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Return the file URL
    const fileUrl = `/uploads/${req.file.filename}`;

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
      url: `/uploads/${req.file.filename}`,
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
        url: `/uploads/${req.file.filename}`,
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
