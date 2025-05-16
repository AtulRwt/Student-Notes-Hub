import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { authRouter } from './routes/auth';
import { notesRouter } from './routes/notes';
import { tagsRouter } from './routes/tags';
import { usersRouter } from './routes/users';
import { analyticsRouter } from './routes/analytics';
import { feedbackRouter } from './routes/feedback';
import { settingsRouter } from './routes/settings';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware with expanded CORS options
app.use(cors({
  origin: '*',  // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Disposition'],
  credentials: true
}));
app.use(express.json());

// Create and export Prisma client
export const prisma = new PrismaClient();

// Configure routes
app.use('/api/auth', authRouter);
app.use('/api/notes', notesRouter);
app.use('/api/tags', tagsRouter);
app.use('/api/users', usersRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/feedback', feedbackRouter);
app.use('/api/settings', settingsRouter);

// Static files - use absolute paths to ensure consistency
const uploadsPath = path.resolve(path.join(__dirname, '../uploads'));
console.log('Serving uploads from absolute path:', uploadsPath);
app.use('/uploads', express.static(uploadsPath));

const profilesPath = path.resolve(path.join(__dirname, '../uploads/profiles'));
console.log('Serving profile uploads from absolute path:', profilesPath);
app.use('/uploads/profiles', express.static(profilesPath));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 