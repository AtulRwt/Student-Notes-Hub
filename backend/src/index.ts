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

// Middleware
app.use(cors());
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

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/uploads/profiles', express.static(path.join(__dirname, '../uploads/profiles')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 