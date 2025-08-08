import { NextApiRequest, NextApiResponse } from 'next'

// Simple in-memory storage for messages
let messages: any[] = []

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { sender_wallet, recipient_wallet, content } = req.body

    if (!sender_wallet || !recipient_wallet || !content) {
      return res.status(400).json({ success: false, error: 'Sender wallet, recipient wallet, and content are required' })
    }

    // Create simple message
    const message = {
      id: Date.now().toString(),
      sender_wallet,
      recipient_wallet,
      content,
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
} 