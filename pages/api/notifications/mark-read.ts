import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { notificationId } = req.body

    if (!notificationId) {
      return res.status(400).json({
        success: false,
        error: 'Notification ID is required'
      })
    }

    // In production, this would update the database
    // For now, just return success
    return res.status(200).json({
      success: true,
      message: 'Notification marked as read'
    })

  } catch (error) {
    console.error('Error marking notification as read:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read'
    })
  }
} 