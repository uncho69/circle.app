import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../../utils/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { wallet_address, other_user_pseudonym } = req.query

    if (!wallet_address || !other_user_pseudonym || 
        typeof wallet_address !== 'string' || typeof other_user_pseudonym !== 'string') {
      return res.status(400).json({ success: false, error: 'Wallet address and other user pseudonym are required' })
    }

    // Get current user
    const { data: currentUser } = await supabase
      .from('users')
      .select('id, pseudonym')
      .eq('wallet_address', wallet_address)
      .single()

    if (!currentUser) {
      return res.status(404).json({ success: false, error: 'Current user not found' })
    }

    // Get conversation
    const { data: conversationId, error: convError } = await supabase
      .rpc('get_or_create_conversation', {
        user1_pseudonym: currentUser.pseudonym,
        user2_pseudonym: other_user_pseudonym
      })

    if (convError) {
      console.error('Error getting conversation:', convError)
      return res.status(500).json({ success: false, error: 'Failed to get conversation' })
    }

    // Get messages
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select(`
        id,
        content,
        created_at,
        sender:users!sender_id(pseudonym, display_name)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (msgError) {
      console.error('Error fetching messages:', msgError)
      return res.status(500).json({ success: false, error: 'Failed to fetch messages' })
    }

    // Mark messages as read
    await supabase
      .from('user_conversation_reads')
      .upsert({
        user_id: currentUser.id,
        conversation_id: conversationId,
        last_read: new Date().toISOString()
      })

    return res.status(200).json({
      success: true,
      messages: messages?.map(msg => ({
        id: msg.id,
        content: msg.content,
        sender_pseudonym: msg.sender.pseudonym,
        sender_display_name: msg.sender.display_name || msg.sender.pseudonym,
        created_at: msg.created_at,
        is_own: msg.sender.pseudonym === currentUser.pseudonym
      })) || []
    })

  } catch (error) {
    console.error('API error:', error)
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }
} 