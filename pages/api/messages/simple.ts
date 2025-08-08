import { NextApiRequest, NextApiResponse } from 'next'

// Simple in-memory storage for messages
let messages: any[] = []

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    // Send message
    try {
      const { sender_wallet, recipient_wallet, content } = req.body

      if (!sender_wallet || !recipient_wallet || !content) {
        return res.status(400).json({ success: false, error: 'Sender wallet, recipient wallet, and content are required' })
      }

      // Create simple message
      const message = {
        id: Date.now().toString(),
        sender_wallet: String(sender_wallet).toLowerCase(),
        recipient_wallet: String(recipient_wallet).toLowerCase(),
        content: String(content),
        created_at: new Date().toISOString()
      }

      messages.push(message)

      console.log(`💬 Message sent: ${sender_wallet} -> ${recipient_wallet}: ${content}`)

      return res.status(200).json({
        success: true,
        message
      })

    } catch (error) {
      console.error('API error:', error)
      return res.status(500).json({ success: false, error: 'Internal server error' })
    }
  } else if (req.method === 'GET') {
    // Get messages
    try {
      const { wallet_address } = req.query

      if (!wallet_address || typeof wallet_address !== 'string') {
        return res.status(400).json({ success: false, error: 'Wallet address is required' })
      }

      // Get messages for this wallet (sent or received)
      const wa = String(wallet_address).toLowerCase()
      const userMessages = messages.filter(msg => 
        msg.sender_wallet === wa || msg.recipient_wallet === wa
      )

      return res.status(200).json({
        success: true,
        messages: userMessages
      })

    } catch (error) {
      console.error('API error:', error)
      return res.status(500).json({ success: false, error: 'Internal server error' })
    }
  } else if (req.method === 'DELETE') {
    // Delete messages by id (supports ephemeral auto-delete)
    try {
      const ids = (req.body?.ids as string[]) || []
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, error: 'ids array required' })
      }

      const before = messages.length
      messages = messages.filter(m => !ids.includes(m.id))
      const removed = before - messages.length

      return res.status(200).json({ success: true, removed })
    } catch (error) {
      console.error('API error:', error)
      return res.status(500).json({ success: false, error: 'Internal server error' })
    }
  } else {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }
} 