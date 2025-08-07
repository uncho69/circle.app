import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../../utils/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { action, follower, following } = req.body

    if (!action || !follower || !following) {
      return res.status(400).json({ success: false, error: 'Action, follower, and following are required' })
    }

    // Get user IDs by pseudonyms
    const { data: followerUser } = await supabase
      .from('users')
      .select('id')
      .eq('pseudonym', follower)
      .single()

    const { data: followingUser } = await supabase
      .from('users')
      .select('id')
      .eq('pseudonym', following)
      .single()

    if (!followerUser || !followingUser) {
      return res.status(404).json({ success: false, error: 'User not found' })
    }

    if (action === 'check') {
      // Check if already following
      const { data: existingFollow } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', followerUser.id)
        .eq('following_id', followingUser.id)
        .single()

      return res.status(200).json({ 
        success: true, 
        isFollowing: !!existingFollow 
      })
    }

    if (action === 'follow') {
      // Check if already following
      const { data: existingFollow } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', followerUser.id)
        .eq('following_id', followingUser.id)
        .single()

      if (existingFollow) {
        return res.status(409).json({ success: false, error: 'Already following' })
      }

      // Create follow relationship
      const { error } = await supabase
        .from('follows')
        .insert({
          follower_id: followerUser.id,
          following_id: followingUser.id
        })

      if (error) {
        console.error('Follow error:', error)
        return res.status(500).json({ success: false, error: 'Failed to follow' })
      }

      return res.status(200).json({ success: true, message: 'Followed successfully' })
    }

    if (action === 'unfollow') {
      // Remove follow relationship
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', followerUser.id)
        .eq('following_id', followingUser.id)

      if (error) {
        console.error('Unfollow error:', error)
        return res.status(500).json({ success: false, error: 'Failed to unfollow' })
      }

      return res.status(200).json({ success: true, message: 'Unfollowed successfully' })
    }

    return res.status(400).json({ success: false, error: 'Invalid action' })

  } catch (error) {
    console.error('API error:', error)
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }
} 