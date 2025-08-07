import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../../utils/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { wallet_address } = req.query

    if (!wallet_address || typeof wallet_address !== 'string') {
      return res.status(400).json({ success: false, error: 'Wallet address is required' })
    }

    // Get user by wallet address
    const { data: user } = await supabase
      .from('users')
      .select('pseudonym')
      .eq('wallet_address', wallet_address)
      .single()

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' })
    }

    // Get conversations using the function
    const { data: conversations, error } = await supabase
      .rpc('get_user_conversations', { user_pseudonym: user.pseudonym })

    if (error) {
      console.error('Error fetching conversations:', error)
      return res.status(500).json({ success: false, error: 'Failed to fetch conversations' })
    }

    return res.status(200).json({
      success: true,
      conversations: conversations || []
    })

  } catch (error) {
    console.error('API error:', error)
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }
} 