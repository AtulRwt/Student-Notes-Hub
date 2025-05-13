import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { auth } from '../middleware/auth';

export const authRouter = express.Router();

// Set up multer for profile image uploads
const uploadDir = process.env.PROFILE_UPLOAD_DIR || './uploads/profiles';

// Ensure uploads directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const profileUpload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Accept image files only
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

// Register a new user
authRouter.post('/register', async (req, res) => {
  try {
    // Validate input
    const validInput = registerSchema.safeParse(req.body);
    if (!validInput.success) {
      return res.status(400).json({ error: validInput.error.issues });
    }

    const { email, password, name } = validInput.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name
      }
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '7d' }
    );

    // Return user info and token (exclude password)
    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json({
      user: userWithoutPassword,
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Login
authRouter.post('/login', async (req, res) => {
  try {
    // Validate input
    const validInput = loginSchema.safeParse(req.body);
    if (!validInput.success) {
      return res.status(400).json({ error: validInput.error.issues });
    }

    const { email, password } = validInput.data;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Compare passwords
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '7d' }
    );

    // Return user info and token (exclude password)
    const { password: _, ...userWithoutPassword } = user;
    res.json({
      user: userWithoutPassword,
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Get current user
authRouter.get('/me', async (req, res) => {
  try {
    // Get auth header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as { id: string };
    
    // Get user
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return user info (exclude password)
    const { password, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
    
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Update user profile
authRouter.put('/profile', auth, profileUpload.single('profileImage'), async (req, res) => {
  try {
    const userId = req.user!.id;
    const { name, bio, education, interests, socialLinks } = req.body;
    
    // Prepare data for update
    const updateData: any = {};
    
    if (name) updateData.name = name;
    if (bio) updateData.bio = bio;
    if (education) updateData.education = education;
    
    // Parse JSON strings if they exist
    if (interests) {
      try {
        updateData.interests = JSON.parse(interests);
      } catch (error) {
        console.error('Error parsing interests:', error);
      }
    }
    
    if (socialLinks) {
      try {
        updateData.socialLinks = JSON.parse(socialLinks);
      } catch (error) {
        console.error('Error parsing socialLinks:', error);
      }
    }
    
    // Add profile image if uploaded
    if (req.file) {
      updateData.profileImage = `/uploads/profiles/${req.file.filename}`;
      
      // Find and delete old profile image if exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          profileImage: true
        }
      });
      
      if (user?.profileImage) {
        try {
          const oldImagePath = path.join(__dirname, '../../', user.profileImage);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        } catch (error) {
          console.error('Error deleting old profile image:', error);
        }
      }
    }
    
    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData
    });
    
    // Return user without password
    const { password, ...userWithoutPassword } = updatedUser;
    res.json(userWithoutPassword);
    
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
}); 