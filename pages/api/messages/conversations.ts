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

    // Get conversations manually
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select(`
        id,
        user1:users!user1_id(id, pseudonym, display_name, wallet_address),
        user2:users!user2_id(id, pseudonym, display_name, wallet_address)
      `)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)

    if (error) {
      console.error('Error fetching conversations:', error)
      return res.status(500).json({ success: false, error: 'Failed to fetch conversations' })
    }

    // Transform conversations data
    const transformedConversations = conversations?.map(conv => {
      const isUser1 = conv.user1.wallet_address === wallet_address
      const otherUser = isUser1 ? conv.user2 : conv.user1
      
      return {
        conversation_id: conv.id,
        other_user_pseudonym: otherUser.wallet_address,
        other_user_display_name: otherUser.display_name || otherUser.pseudonym,
        last_message: null,
        last_message_time: null,
        unread_count: 0
      }
    }) || []

    return res.status(200).json({
      success: true,
      conversations: transformedConversations
    })

  } catch (error) {
    console.error('API error:', error)
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }
} 