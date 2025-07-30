import { NextApiRequest, NextApiResponse } from 'next'
import { initDatabase, getPostById, addInteraction, removeInteraction, hasInteraction, getUserByWallet } from '../../../utils/database'

export interface InteractionRequest {
  postId: string
  action: 'like' | 'repost' | 'reply' | 'view'
  userId: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { postId, action, userId }: InteractionRequest = req.body
    
    console.log('Interaction request:', { postId, action, userId })

    // Validation
    if (!postId || !action || !userId) {
      console.error('Missing required fields:', { postId, action, userId })
      return res.status(400).json({ error: 'PostId, action, and userId are required' })
    }

    if (!['like', 'repost', 'reply', 'view'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action. Must be like, repost, reply, or view' })
    }

    // Initialize database
    initDatabase()

    // Find the post
    const post = getPostById(parseInt(postId))
    if (!post) {
      return res.status(404).json({ error: 'Post not found' })
    }

    // Handle view action (just log it for now)
    if (action === 'view') {
      console.log(`👁️ ${userId} viewed post ${postId.substring(0, 8)}...`)
      
      const updatedPost = getPostById(parseInt(postId))
      return res.status(200).json({
        success: true,
        post: updatedPost,
        action: 'view',
        message: 'View recorded successfully'
      })
    }

    // Get user ID from wallet address
    console.log('Looking up user by wallet:', userId)
    const user = getUserByWallet(userId)
    console.log('Found user:', user)
    
    if (!user) {
      console.error('User not found for wallet:', userId)
      return res.status(404).json({ error: 'User not found' })
    }

    const userIdNum = (user as any).id as number
    console.log('User ID for interactions:', userIdNum)

    // Check if user already interacted
    const hasAlreadyInteracted = hasInteraction(userIdNum, parseInt(postId), action as 'like' | 'repost')

    // Toggle interaction
    if (hasAlreadyInteracted) {
      // Remove interaction
      removeInteraction(userIdNum, parseInt(postId), action as 'like' | 'repost')
      console.log(`➖ ${userId} un-${action}d post ${postId.substring(0, 8)}...`)
    } else {
      // Add interaction
      addInteraction(userIdNum, parseInt(postId), action as 'like' | 'repost')
      console.log(`➕ ${userId} ${action}d post ${postId.substring(0, 8)}...`)
    }

    // Get updated post
    const updatedPost = getPostById(parseInt(postId))

    return res.status(200).json({
      success: true,
      post: updatedPost,
      action: hasAlreadyInteracted ? `un${action}` : action,
      message: `Post ${hasAlreadyInteracted ? `un-${action}d` : `${action}d`} successfully`
    })

  } catch (error) {
    console.error('Interaction error:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to process interaction',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 