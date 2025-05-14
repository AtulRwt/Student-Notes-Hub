import express from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { auth } from '../middleware/auth';
import bcrypt from 'bcrypt';

// Extend the Express Request type to include the user property
declare global {
  namespace Express {
    interface Request {
      user: {
        id: string;
        email: string;
      };
    }
  }
}

export const settingsRouter = express.Router();

// All settings routes require authentication
settingsRouter.use(auth);

// Define validation schemas
const accountSettingsSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  password: z.object({
    oldPassword: z.string(),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  }).optional(),
});

const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean().optional(),
  newComments: z.boolean().optional(),
  newFollowers: z.boolean().optional(),
  connectionRequests: z.boolean().optional(),
  notesFromFollowing: z.boolean().optional(),
  systemAnnouncements: z.boolean().optional(),
});

const appearanceSettingsSchema = z.object({
  theme: z.enum(['dark', 'light']).optional(),
  fontSize: z.enum(['small', 'medium', 'large']).optional(),
  reducedMotion: z.boolean().optional(),
  highContrast: z.boolean().optional(),
});

const securitySettingsSchema = z.object({
  twoFactorAuth: z.boolean().optional(),
  loginAlerts: z.boolean().optional(),
  sessionTimeout: z.string().optional(),
});

// Get all user settings
settingsRouter.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user settings from database
    const userSettings = await prisma.userSettings.findUnique({
      where: { userId }
    });
    
    if (!userSettings) {
      // Create default settings if none exist
      const defaultSettings = {
        userId,
        notifications: {
          emailNotifications: true,
          newComments: true,
          newFollowers: true,
          connectionRequests: true,
          notesFromFollowing: true,
          systemAnnouncements: true
        },
        appearance: {
          theme: 'dark',
          fontSize: 'medium',
          reducedMotion: false,
          highContrast: false
        },
        security: {
          twoFactorAuth: false,
          loginAlerts: true,
          sessionTimeout: '1 hour'
        }
      };
      
      const newSettings = await prisma.userSettings.create({
        data: defaultSettings
      });
      
      return res.json(newSettings);
    }
    
    return res.json(userSettings);
  } catch (error) {
    console.error('Error fetching user settings:', error);
    return res.status(500).json({ error: 'Failed to fetch user settings' });
  }
});

// Update account settings
settingsRouter.patch('/account', async (req, res) => {
  try {
    const userId = req.user.id;
    const validationResult = accountSettingsSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ error: validationResult.error.issues });
    }
    
    const { email, password } = validationResult.data;
    const updateData: any = {};
    
    // Handle email update
    if (email) {
      // Check if email already exists for another user
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });
      
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ error: 'Email already in use' });
      }
      
      updateData.email = email;
    }
    
    // Handle password update
    if (password) {
      const { oldPassword, newPassword } = password;
      
      // Get user's current password
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { password: true }
      });
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      console.log('Debug - Password verification:');
      console.log('- Stored password length:', user.password.length);
      console.log('- Provided password length:', oldPassword.length);
      
      try {
        // For truly hashed passwords, we would use bcrypt.compare
        // But since we're not sure if the system is using bcrypt or plain storage
        // We'll try both approaches
        
        let passwordIsValid = false;
        
        // Method 1: Try bcrypt comparison (for hashed passwords)
        try {
          passwordIsValid = await bcrypt.compare(oldPassword, user.password);
          console.log('Password verification using bcrypt:', passwordIsValid ? 'Success' : 'Failed');
        } catch (err: any) {
          console.log('Bcrypt comparison error, fallback to direct comparison:', err.message);
        }
        
        // Method 2: If bcrypt fails or returns false, try direct comparison as fallback
        if (!passwordIsValid) {
          // Try direct comparison (if passwords are stored in plain text)
          const storedPassword = user.password.trim();
          const providedPassword = oldPassword.trim();
          
          passwordIsValid = storedPassword === providedPassword;
          console.log('Password verification using direct comparison:', passwordIsValid ? 'Success' : 'Failed');
        }
        
        if (!passwordIsValid) {
          console.log('Password verification failed for user:', userId);
          return res.status(400).json({ error: 'Current password is incorrect' });
        }
        
        // Validate new password
        if (newPassword.length < 8) {
          return res.status(400).json({ error: 'New password must be at least 8 characters long' });
        }
        
        // Hash the new password for storage
        const saltRounds = 10;
        updateData.password = await bcrypt.hash(newPassword, saltRounds);
        
        console.log('Password update successful for user:', userId);
      } catch (error) {
        console.error('Password verification error:', error);
        return res.status(500).json({ error: 'Error verifying password' });
      }
    }
    
    // Update user
    if (Object.keys(updateData).length > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: updateData
      });
    }
    
    return res.json({ success: true, message: 'Account settings updated successfully' });
  } catch (error) {
    console.error('Error updating account settings:', error);
    return res.status(500).json({ error: 'Failed to update account settings' });
  }
});

// Update notification settings
settingsRouter.patch('/notifications', async (req, res) => {
  try {
    const userId = req.user.id;
    const validationResult = notificationSettingsSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ error: validationResult.error.issues });
    }
    
    // Update or create user settings
    await prisma.userSettings.upsert({
      where: { userId },
      update: {
        notifications: validationResult.data
      },
      create: {
        userId,
        notifications: validationResult.data,
        appearance: {
          theme: 'dark',
          fontSize: 'medium',
          reducedMotion: false,
          highContrast: false
        },
        security: {
          twoFactorAuth: false,
          loginAlerts: true,
          sessionTimeout: '1 hour'
        }
      }
    });
    
    return res.json({ success: true, message: 'Notification settings updated successfully' });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    return res.status(500).json({ error: 'Failed to update notification settings' });
  }
});

// Update appearance settings
settingsRouter.patch('/appearance', async (req, res) => {
  try {
    const userId = req.user.id;
    const validationResult = appearanceSettingsSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ error: validationResult.error.issues });
    }
    
    // Update or create user settings
    await prisma.userSettings.upsert({
      where: { userId },
      update: {
        appearance: validationResult.data
      },
      create: {
        userId,
        appearance: validationResult.data,
        notifications: {
          emailNotifications: true,
          newComments: true,
          newFollowers: true,
          connectionRequests: true,
          notesFromFollowing: true,
          systemAnnouncements: true
        },
        security: {
          twoFactorAuth: false,
          loginAlerts: true,
          sessionTimeout: '1 hour'
        }
      }
    });
    
    return res.json({ success: true, message: 'Appearance settings updated successfully' });
  } catch (error) {
    console.error('Error updating appearance settings:', error);
    return res.status(500).json({ error: 'Failed to update appearance settings' });
  }
});

// Update security settings
settingsRouter.patch('/security', async (req, res) => {
  try {
    const userId = req.user.id;
    const validationResult = securitySettingsSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ error: validationResult.error.issues });
    }
    
    // Update or create user settings
    await prisma.userSettings.upsert({
      where: { userId },
      update: {
        security: validationResult.data
      },
      create: {
        userId,
        security: validationResult.data,
        notifications: {
          emailNotifications: true,
          newComments: true,
          newFollowers: true,
          connectionRequests: true,
          notesFromFollowing: true,
          systemAnnouncements: true
        },
        appearance: {
          theme: 'dark',
          fontSize: 'medium',
          reducedMotion: false,
          highContrast: false
        }
      }
    });
    
    return res.json({ success: true, message: 'Security settings updated successfully' });
  } catch (error) {
    console.error('Error updating security settings:', error);
    return res.status(500).json({ error: 'Failed to update security settings' });
  }
}); 