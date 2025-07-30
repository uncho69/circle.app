import { NextApiRequest, NextApiResponse } from 'next'

// In-memory storage for notifications (in production, this would be in the database)
let notifications: any[] = []

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Initialize database (would be done in production)

    // For now, return empty notifications
    // In production, this would query the database for user-specific notifications
    return res.status(200).json({
      success: true,
      notifications: notifications.slice(0, 20) // Latest 20 notifications
    })

  } catch (error) {
    console.error('Error fetching notifications:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications'
    })
  }
}

// Helper function to add notifications (called from other APIs)
export const addNotification = (notification: {
  type: 'like' | 'repost' | 'reply' | 'follow'
  message: string
  userId: string
  data?: any
}) => {
  const newNotification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...notification,
    timestamp: new Date().toISOString(),
    read: false
  }
  
  notifications.unshift(newNotification)
  
  // Keep only last 100 notifications
  if (notifications.length > 100) {
    notifications = notifications.slice(0, 100)
  }
  
  console.log(`🔔 New notification: ${notification.type} for ${notification.userId}`)
} 