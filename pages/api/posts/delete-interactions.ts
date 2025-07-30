import { NextApiRequest, NextApiResponse } from 'next'

// Access the user interactions from interact.ts
let userInteractions: Map<string, Set<string>> = new Map()

// Try to import the interactions map
try {
  const interactModule = require('./interact')
  if (interactModule.userInteractions) {
    userInteractions = interactModule.userInteractions
  }
} catch (error) {
  console.warn('Could not access user interactions from interact.ts')
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userId } = req.body

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' })
    }

    let deletedCount = 0

    // Remove all interactions by this user
    const interactionTypes = ['like', 'repost', 'reply']
    
    for (const type of interactionTypes) {
      const userKey = `${userId}_${type}`
      if (userInteractions.has(userKey)) {
        const interactions = userInteractions.get(userKey)
        deletedCount += interactions?.size || 0
        userInteractions.delete(userKey)
      }
    }

    console.log(`🗑️ Deleted ${deletedCount} interactions for ${userId}`)

    return res.status(200).json({
      success: true,
      deletedCount: deletedCount,
      message: `Deleted ${deletedCount} interactions for ${userId}`
    })

  } catch (error) {
    console.error('Delete user interactions error:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to delete user interactions',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 
 
 
 
 
 
 