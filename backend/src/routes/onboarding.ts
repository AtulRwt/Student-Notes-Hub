import express from 'express';
import { prisma } from '../index';
import { auth } from '../middleware/auth';
import { z } from 'zod';

export const onboardingRouter = express.Router();

const onboardingSchema = z.object({
    interests: z.array(z.string()).default([]),
    education: z.string().optional(),
    skillLevel: z.string().optional(),
    goals: z.string().optional(),
    preferredContent: z.array(z.string()).default([])
});

// POST /api/onboarding/complete
// Saves chatbot-collected data and marks onboarding as complete
onboardingRouter.post('/complete', auth, async (req, res) => {
    try {
        const parsed = onboardingSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.issues });
        }

        const { interests, education, skillLevel, goals, preferredContent } = parsed.data;
        const userId = req.user!.id;

        // Prepare user update data
        const updateData: any = {
            onboardingCompleted: true
        };
        if (interests.length > 0) updateData.interests = interests;
        if (education) updateData.education = education;

        // Update user record
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData
        });

        // Store extra onboarding data (skillLevel, goals, preferredContent) in UserSettings
        // Upsert so it works whether settings already exist or not
        await prisma.userSettings.upsert({
            where: { userId },
            update: {
                appearance: {
                    onboarding: { skillLevel, goals, preferredContent }
                } as any
            },
            create: {
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
                    highContrast: false,
                    onboarding: { skillLevel, goals, preferredContent }
                },
                security: {
                    twoFactorAuth: false,
                    loginAlerts: true,
                    sessionTimeout: '7d'
                }
            }
        });

        // Return updated user without password
        const { password, ...userWithoutPassword } = updatedUser as any;
        res.json({ user: userWithoutPassword, message: 'Onboarding complete' });
    } catch (error) {
        console.error('Onboarding complete error:', error);
        res.status(500).json({ error: 'Failed to save onboarding data' });
    }
});
