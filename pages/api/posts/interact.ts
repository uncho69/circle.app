import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../../utils/supabase'

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

    // Get user by wallet address
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', userId.toLowerCase())
      .single()

    if (userError || !user) {
      console.error('User not found for wallet:', userId)
      return res.status(404).json({ error: 'User not found' })
    }

    // Handle view action (just log it for now)
    if (action === 'view') {
      console.log(`👁️ ${userId} viewed post ${postId.substring(0, 8)}...`)
      return res.status(200).json({
        success: true,
        action: 'view',
        message: 'View recorded successfully'
      })
    }

    // Check if user already interacted
    let existingInteraction
    if (action === 'like') {
      const { data: like } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('post_id', postId)
        .single()
      existingInteraction = like
    } else if (action === 'repost') {
      const { data: repost } = await supabase
        .from('reposts')
        .select('id')
        .eq('user_id', user.id)
        .eq('post_id', postId)
        .single()
      existingInteraction = repost
    }

    // Toggle interaction
    if (existingInteraction) {
      // Remove interaction
      if (action === 'like') {
        await supabase
          .from('likes')
          .delete()
          .eq('id', existingInteraction.id)
      } else if (action === 'repost') {
        await supabase
          .from('reposts')
          .delete()
          .eq('id', existingInteraction.id)
      }
      console.log(`➖ ${userId} un-${action}d post ${postId.substring(0, 8)}...`)
    } else {
      // Add interaction
      if (action === 'like') {
        await supabase
          .from('likes')
          .insert({
            user_id: user.id,
            post_id: postId
          })
      } else if (action === 'repost') {
        await supabase
          .from('reposts')
          .insert({
            user_id: user.id,
            post_id: postId
          })
      }
      console.log(`➕ ${userId} ${action}d post ${postId.substring(0, 8)}...`)
    }

    return res.status(200).json({
      success: true,
      action: existingInteraction ? `un${action}` : action,
      message: `Post ${existingInteraction ? `un-${action}d` : `${action}d`} successfully`
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