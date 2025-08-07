import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../../utils/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { pseudonym, wallet_address } = req.query

    if (!pseudonym && !wallet_address) {
      return res.status(400).json({ success: false, error: 'Pseudonym or wallet_address is required' })
    }

    let query = supabase
      .from('users')
      .select(`
        *,
        posts_count:posts(count),
        followers_count:follows!following_id(count),
        following_count:follows!follower_id(count)
      `)

    if (pseudonym) {
      query = query.eq('pseudonym', pseudonym)
    } else if (wallet_address) {
      query = query.eq('wallet_address', wallet_address.toString().toLowerCase())
    }

    const { data: user, error } = await query.single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ success: false, error: 'User not found' })
      }
      console.error('Supabase error:', error)
      return res.status(500).json({ success: false, error: 'Failed to fetch user' })
    }

    // Get user stats
    const { data: stats } = await supabase
      .rpc('get_user_stats', { user_uuid: user.id })

    const userWithStats = {
      ...user,
      stats: stats?.[0] || {
        posts_count: 0,
        followers_count: 0,
        following_count: 0,
        likes_received: 0
      }
    }

    return res.status(200).json({ success: true, user: userWithStats })

  } catch (error) {
    console.error('API error:', error)
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }
} 