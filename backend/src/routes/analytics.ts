import express from 'express';
import { prisma } from '../index';
import { Prisma } from '@prisma/client';

export const analyticsRouter = express.Router();

// Store online users in memory (in a real app, this would be in Redis or similar)
const onlineUsers = new Map<string, {
  id: string;
  name: string;
  department: string;
  lastAction: string;
  lastActive: Date;
}>();

// Store user actions for activity tracking
const userActions = new Map<string, {
  userId: string;
  action: string;
  timestamp: Date;
}[]>();

// Track explicitly logged out users to prevent re-adding them automatically
const loggedOutUsers = new Set<string>();

// Clear logged out users every hour (to prevent the set from growing too large)
setInterval(() => {
  loggedOutUsers.clear();
}, 60 * 60 * 1000); // 1 hour

// Function to get all departments from database
async function getAllDepartments() {
  // In a real app, you would have a departments table or field
  // Here we use education field from users as a proxy for department
  const users = await prisma.user.findMany({
    select: {
      education: true
    },
    where: {
      education: {
        not: null
      }
    },
    distinct: ['education']
  });
  
  // Extract unique departments/education values
  const departments = new Set<string>();
  users.forEach(user => {
    if (user.education) {
      departments.add(user.education);
    }
  });
  
  return Array.from(departments);
}

// Endpoint to track a specific user action
analyticsRouter.post('/track-action', async (req, res) => {
  try {
    const { userId, action } = req.body;
    
    if (!userId || !action) {
      return res.status(400).json({ error: 'User ID and action are required' });
    }
    
    // Get user information from database
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Record the action
    const userActionList = userActions.get(userId) || [];
    userActionList.push({
      userId,
      action,
      timestamp: new Date()
    });
    
    // Keep only the last 20 actions per user
    if (userActionList.length > 20) {
      userActionList.shift();
    }
    
    userActions.set(userId, userActionList);
    
    // Update online status with last action
    const existingUser = onlineUsers.get(userId);
    onlineUsers.set(userId, {
      id: userId,
      name: user.name,
      department: user.education || 'Unknown',
      lastAction: action,
      lastActive: new Date()
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error tracking user action:', error);
    res.status(500).json({ error: 'Failed to track user action' });
  }
});

// Helper to get recent user activity
async function getRecentUserActivity() {
  // Get most recent user actions from database
  try {
    const recentComments = await prisma.comment.findMany({
      include: {
        user: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });
    
    const recentFavorites = await prisma.favorite.findMany({
      include: {
        user: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });
    
    const recentNotes = await prisma.note.findMany({
      include: {
        user: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });
    
    // Combine and sort by timestamp
    const allActivity = [
      ...recentComments.map(c => ({
        userId: c.userId,
        name: c.user.name,
        department: c.user.education || 'Unknown',
        action: 'Commented on a note',
        timestamp: c.createdAt
      })),
      ...recentFavorites.map(f => ({
        userId: f.userId,
        name: f.user.name,
        department: f.user.education || 'Unknown',
        action: 'Favorited a note',
        timestamp: f.createdAt
      })),
      ...recentNotes.map(n => ({
        userId: n.userId,
        name: n.user.name,
        department: n.user.education || 'Unknown',
        action: 'Uploaded a note',
        timestamp: n.createdAt
      }))
    ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return allActivity;
  } catch (error) {
    console.error('Error getting recent activity:', error);
    return [];
  }
}

// Endpoint to get user engagement metrics
analyticsRouter.get('/engagement', async (req, res) => {
  try {
    // Get real metrics from database
    const totalNotes = await prisma.note.count();
    const totalUsers = await prisma.user.count();
    
    // Get daily views and page visits for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // Get actual notes created per day for the last 7 days
    const notesLastSevenDays = await prisma.$queryRaw<{ day: string, count: number }[]>`
      SELECT 
        DATE(DATE_TRUNC('day', "createdAt")) as day, 
        COUNT(*) as count
      FROM "Note"
      WHERE "createdAt" >= ${sevenDaysAgo}
      GROUP BY day
      ORDER BY day ASC
      LIMIT 7
    `;
    
    // Create a map of days to fill in missing days with zeros
    const dailyViewsMap = new Map<string, number>();
    const today = new Date();
    
    // Initialize the past 7 days with zeros
    for (let i = 6; i >= 0; i--) {
      const day = new Date(today);
      day.setDate(day.getDate() - i);
      const dayStr = day.toISOString().split('T')[0];
      dailyViewsMap.set(dayStr, 0);
    }
    
    // Fill in actual data
    notesLastSevenDays.forEach(day => {
      const dayStr = new Date(day.day).toISOString().split('T')[0];
      // Use actual note views (we have no view tracking, so use notes count directly)
      dailyViewsMap.set(dayStr, Number(day.count));
    });
    
    // Convert map to array preserving order
    const dailyViews = Array.from(dailyViewsMap.values());
    
    // Get weekly uploads from the last 7 days - using actual data only
    const weeklyUploads = await prisma.$queryRaw<{ day: string, count: number }[]>`
      SELECT 
        DATE(DATE_TRUNC('day', "createdAt")) as day, 
        COUNT(*) as count
      FROM "Note"
      WHERE "createdAt" >= ${sevenDaysAgo}
      GROUP BY day
      ORDER BY day ASC
      LIMIT 7
    `;
    
    // Create a map of days to fill in missing days with zeros
    const uploadsMap = new Map<string, number>();
    
    // Initialize the past 7 days with zeros
    for (let i = 6; i >= 0; i--) {
      const day = new Date(today);
      day.setDate(day.getDate() - i);
      const dayStr = day.toISOString().split('T')[0];
      uploadsMap.set(dayStr, 0);
    }
    
    // Fill in actual data
    weeklyUploads.forEach(day => {
      const dayStr = new Date(day.day).toISOString().split('T')[0];
      uploadsMap.set(dayStr, Number(day.count));
    });
    
    // Convert map to array preserving order
    const uploadsArray = Array.from(uploadsMap.values());
    
    // Get monthly active users data from actual user activity
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyUsers = await prisma.$queryRaw<{ month: string, count: number }[]>`
      SELECT 
        DATE_TRUNC('month', "createdAt") as month,
        COUNT(DISTINCT "userId") as count
      FROM "Note"
      WHERE "createdAt" >= ${sixMonthsAgo}
      GROUP BY month
      ORDER BY month ASC
    `;
    
    // Create a map of months to fill in missing months with zeros
    const monthlyActiveUsersMap = new Map<string, number>();
    
    // Initialize the past 6 months with zeros
    for (let i = 5; i >= 0; i--) {
      const month = new Date(today);
      month.setMonth(month.getMonth() - i);
      month.setDate(1); // First day of month
      const monthStr = month.toISOString().split('T')[0].substring(0, 7); // YYYY-MM format
      monthlyActiveUsersMap.set(monthStr, 0);
    }
    
    // Fill in actual data
    monthlyUsers.forEach(month => {
      const monthStr = new Date(month.month).toISOString().split('T')[0].substring(0, 7);
      monthlyActiveUsersMap.set(monthStr, Number(month.count));
    });
    
    // Convert map to array preserving order
    const monthlyActiveUsers = Array.from(monthlyActiveUsersMap.values());
    
    // Get resource type distribution from actual data
    const resourceTypes = await prisma.note.groupBy({
      by: ['semester'],
      _count: {
        id: true
      }
    });
    
    // Convert to the format expected by the frontend
    const resourceTypeDistribution: Record<string, number> = {};
    
    // Use actual data only
    resourceTypes.forEach(item => {
      if (item.semester && item._count.id) {
        resourceTypeDistribution[item.semester] = item._count.id;
      }
    });
    
    // If we have no data, just use an empty object
    if (Object.keys(resourceTypeDistribution).length === 0) {
      // No dummy data - leave empty
    }
    
    // Calculate user activity breakdown from actual data
    const commentCount = await prisma.comment.count();
    const favoriteCount = await prisma.favorite.count();
    const noteCount = totalNotes;
    
    // User activity breakdown - minimum time spent
    let timeSpent: Record<string, number> = {};
    
    // Calculate actual time spent percentages if we have activity
    const totalActivities = commentCount + favoriteCount + noteCount;
    
    if (totalActivities > 0) {
      // Reading is based on favorites
      const readingPercent = Math.round((favoriteCount / totalActivities) * 100) || 0;
      
      // Uploading based on note count
      const uploadingPercent = Math.round((noteCount / totalActivities) * 100) || 0;
      
      // Commenting based on comment count
      const commentingPercent = Math.round((commentCount / totalActivities) * 100) || 0;
      
      // Set at least 1% for each to show categories
      timeSpent = {
        'Reading': Math.max(1, readingPercent),
        'Uploading': Math.max(1, uploadingPercent),
        'Commenting': Math.max(1, commentingPercent)
      };
      
      // Calculate remaining for "Other" activities
      const allocatedPercent = Object.values(timeSpent).reduce((a, b) => a + b, 0);
      if (allocatedPercent < 100) {
        timeSpent['Other'] = 100 - allocatedPercent;
      }
      
      // If we managed to go over 100%, adjust proportionally
      if (allocatedPercent > 100) {
        const scaleFactor = 100 / allocatedPercent;
        Object.keys(timeSpent).forEach(key => {
          timeSpent[key] = Math.round(timeSpent[key] * scaleFactor);
        });
      }
    }
    
    // Calculate growth metrics based on actual data
    // Only calculate growth if we have data
    
    // Calculate weekly uploads growth
    let uploadsGrowth = 0;
    if (uploadsArray.some(v => v > 0)) {
      const previousWeekUploads = Math.max(1, uploadsArray.slice(0, 3).reduce((a, b) => a + b, 0));
      const currentWeekUploads = Math.max(1, uploadsArray.slice(3).reduce((a, b) => a + b, 0));
      uploadsGrowth = ((currentWeekUploads - previousWeekUploads) / previousWeekUploads) * 100;
    }
    
    // Calculate views growth based on actual daily views
    let viewsGrowth = 0;
    if (dailyViews.some(v => v > 0)) {
      const previousViews = Math.max(1, dailyViews.slice(0, 3).reduce((a, b) => a + b, 0));
      const currentViews = Math.max(1, dailyViews.slice(3).reduce((a, b) => a + b, 0));
      viewsGrowth = ((currentViews - previousViews) / previousViews) * 100;
    }
    
    // Calculate users growth based on monthly active users
    let usersGrowth = 0;
    if (monthlyActiveUsers.length >= 2 && monthlyActiveUsers.some(v => v > 0)) {
      const previousUsers = Math.max(1, monthlyActiveUsers[monthlyActiveUsers.length - 2] || 1);
      const currentUsers = Math.max(1, monthlyActiveUsers[monthlyActiveUsers.length - 1] || 1);
      usersGrowth = ((currentUsers - previousUsers) / previousUsers) * 100;
    }
    
    res.json({
      dailyViews,
      weeklyUploads: uploadsArray,
      monthlyActiveUsers,
      resourceTypeDistribution,
      timeSpent,
      totalNotes,
      totalUsers,
      growthMetrics: {
        viewsGrowth: parseFloat(viewsGrowth.toFixed(1)),
        uploadsGrowth: parseFloat(uploadsGrowth.toFixed(1)),
        usersGrowth: parseFloat(usersGrowth.toFixed(1))
      }
    });
  } catch (error) {
    console.error('Error fetching engagement metrics:', error);
    res.status(500).json({ error: 'Failed to fetch engagement metrics' });
  }
});

// Endpoint to get currently online users
analyticsRouter.get('/online-users', async (req, res) => {
  try {
    // Clean up inactive users (inactive for more than 15 minutes)
    const fifteenMinutesAgo = new Date();
    fifteenMinutesAgo.setMinutes(fifteenMinutesAgo.getMinutes() - 15);
    
    for (const [userId, userData] of onlineUsers.entries()) {
      if (userData.lastActive < fifteenMinutesAgo) {
        onlineUsers.delete(userId);
      }
    }
    
    // Always get recent user activity to supplement online users
    const recentActivity = await getRecentUserActivity();
    const now = new Date();
    
    // Add recent active users if they're not already tracked
    for (let i = 0; i < Math.min(10, recentActivity.length); i++) {
      const activity = recentActivity[i];
      
      // Only add if not already in the online users map, activity is recent, and not explicitly logged out
      const activityTime = new Date(activity.timestamp);
      const thirtyMinutesAgo = new Date();
      thirtyMinutesAgo.setMinutes(thirtyMinutesAgo.getMinutes() - 30);
      
      if (!onlineUsers.has(activity.userId) && 
          activityTime > thirtyMinutesAgo && 
          !loggedOutUsers.has(activity.userId)) {
        // Set last active time based on the activity timestamp with some randomness
        const lastActive = new Date(activityTime.getTime() + Math.random() * 15 * 60 * 1000);
        
        onlineUsers.set(activity.userId, {
          id: activity.userId,
          name: activity.name,
          department: activity.department,
          lastAction: activity.action,
          lastActive: lastActive > now ? now : lastActive
        });
      }
    }
    
    // Get all departments from database
    const allDepartments = await getAllDepartments();
    
    // Calculate department activity percentages based on actual online users
    const departmentCounts: Record<string, number> = {};
    let totalUsers = 0;
    
    // Count users by department
    for (const userData of onlineUsers.values()) {
      totalUsers++;
      const dept = userData.department || 'Other Departments';
      departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;
    }
    
    // If no users online, calculate from recent user activity instead
    if (totalUsers === 0 && recentActivity.length > 0) {
      for (const activity of recentActivity) {
        totalUsers++;
        const dept = activity.department || 'Other Departments';
        departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;
      }
    }
    
    // Ensure we have an entry for each known department
    for (const dept of allDepartments) {
      if (!departmentCounts[dept]) {
        departmentCounts[dept] = 0;
      }
    }
    
    // Make sure we have "Other Departments" category
    if (!departmentCounts['Other Departments']) {
      departmentCounts['Other Departments'] = 0;
    }
    
    // Calculate percentages
    const departmentActivity: Record<string, number> = {};
    if (totalUsers > 0) {
      for (const [dept, count] of Object.entries(departmentCounts)) {
        departmentActivity[dept] = Math.round((count / totalUsers) * 100);
      }
    } else {
      // Fetch some data from database as fallback
      try {
        const usersByDepartment = await prisma.user.groupBy({
          by: ['education'],
          _count: {
            id: true
          },
          where: {
            education: {
              not: null
            }
          }
        });
        
        const totalDBUsers = usersByDepartment.reduce((sum, item) => 
          sum + item._count.id, 0);
        
        if (totalDBUsers > 0) {
          for (const item of usersByDepartment) {
            if (item.education) {
              departmentActivity[item.education] = Math.round((item._count.id / totalDBUsers) * 100);
            }
          }
        }
      } catch (err) {
        // In case of database error, provide minimal fallback
        departmentActivity['Other Departments'] = 100;
      }
    }
    
    // Ensure percentages add up to 100%
    const total = Object.values(departmentActivity).reduce((a, b) => a + b, 0);
    if (total !== 100 && total > 0) {
      // Adjust largest department to make sum 100%
      const largestDept = Object.entries(departmentActivity)
        .sort((a, b) => b[1] - a[1])[0][0];
      departmentActivity[largestDept] += (100 - total);
    }
    
    // Return only departments with non-zero percentages for cleaner display
    const filteredDepartmentActivity: Record<string, number> = {};
    for (const [dept, percentage] of Object.entries(departmentActivity)) {
      if (percentage > 0) {
        filteredDepartmentActivity[dept] = percentage;
      }
    }
    
    res.json({
      onlineCount: onlineUsers.size,
      onlineUsers: Array.from(onlineUsers.values()),
      departmentActivity: filteredDepartmentActivity
    });
  } catch (error) {
    console.error('Error fetching online users:', error);
    res.status(500).json({ error: 'Failed to fetch online users data' });
  }
});

// Endpoint to update a user's online status
analyticsRouter.post('/online-status', async (req, res) => {
  try {
    const { userId, name, department, action } = req.body;
    
    if (!userId || !name) {
      return res.status(400).json({ error: 'User ID and name are required' });
    }
    
    // Get user from database for additional info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { education: true }
    });
    
    onlineUsers.set(userId, {
      id: userId,
      name,
      department: department || user?.education || 'Unknown',
      lastAction: action || 'Active',
      lastActive: new Date()
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating online status:', error);
    res.status(500).json({ error: 'Failed to update online status' });
  }
});

// Endpoint to remove a user from online users when they logout
analyticsRouter.post('/user-logout', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    // Remove user from online users map
    if (onlineUsers.has(userId)) {
      onlineUsers.delete(userId);
    }
    
    // Add to logged out users set to prevent automatic re-adding
    loggedOutUsers.add(userId);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error handling user logout:', error);
    res.status(500).json({ error: 'Failed to handle user logout' });
  }
}); 