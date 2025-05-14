import express from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { auth } from '../middleware/auth';
import { sendEmail, formatFeedbackEmail } from '../services/emailService';

export const feedbackRouter = express.Router();

// Validation schema
const feedbackSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  email: z.string().email('Invalid email address'),
  message: z.string().min(10, 'Message must be at least 10 characters long'),
  rating: z.number().min(1).max(5).optional(),
  category: z.string().optional()
});

// Submit feedback (no auth required so anyone can submit)
feedbackRouter.post('/', async (req, res) => {
  try {
    // Validate input
    const validInput = feedbackSchema.safeParse(req.body);
    if (!validInput.success) {
      return res.status(400).json({ error: validInput.error.issues });
    }

    const { name, email, message, rating, category } = validInput.data;

    // Set fixed recipient email - use environment variable if available, otherwise use hardcoded value
    const emailTo = process.env.FEEDBACK_EMAIL || 'studentnoteshub@gmail.com';
    console.log(`Feedback will be sent to: ${emailTo}`);

    // Save feedback to database
    // Using 'any' type temporarily until Prisma client generates types
    const feedback: any = await (prisma as any).feedback.create({
      data: {
        name,
        email,
        message,
        rating,
        category,
        emailTo
      }
    });

    // Send email notification - but don't wait for it to complete
    sendEmail(formatFeedbackEmail(feedback))
      .then(success => {
        if (success) {
          console.log('Feedback notification email sent successfully');
        } else {
          console.log('Feedback notification email could not be sent, but feedback was stored');
        }
      })
      .catch(emailError => {
        console.error('Error sending feedback notification email:', emailError);
      });

    // Return success
    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: feedback
    });
  } catch (error) {
    console.error('Feedback submission error:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

// Get all feedback (requires auth to view)
feedbackRouter.get('/', auth, async (req, res) => {
  try {
    // Using 'any' type temporarily until Prisma client generates types
    const feedbackEntries = await (prisma as any).feedback.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(feedbackEntries);
  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({ error: 'Failed to retrieve feedback' });
  }
}); 