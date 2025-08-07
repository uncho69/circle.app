import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../../utils/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { sender_wallet, recipient_pseudonym, content } = req.body

    if (!sender_wallet || !recipient_pseudonym || !content) {
      return res.status(400).json({ success: false, error: 'Sender wallet, recipient pseudonym, and content are required' })
    }

    // Get sender user
    const { data: senderUser } = await supabase
      .from('users')
      .select('id, pseudonym')
      .eq('wallet_address', sender_wallet)
      .single()

    if (!senderUser) {
      return res.status(404).json({ success: false, error: 'Sender user not found' })
    }

    // Get or create conversation
    const { data: conversationId, error: convError } = await supabase
      .rpc('get_or_create_conversation', {
        user1_pseudonym: senderUser.pseudonym,
        user2_pseudonym: recipient_pseudonym
      })

    if (convError) {
      console.error('Error creating conversation:', convError)
      return res.status(500).json({ success: false, error: 'Failed to create conversation' })
    }

    // Send message
    const { data: message, error: msgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderUser.id,
        content: content,
        is_encrypted: true
      })
      .select()
      .single()

    if (msgError) {
      console.error('Error sending message:', msgError)
      return res.status(500).json({ success: false, error: 'Failed to send message' })
    }

    return res.status(200).json({
      success: true,
      message: {
        id: message.id,
        content: message.content,
        sender_pseudonym: senderUser.pseudonym,
        created_at: message.created_at
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }
} 