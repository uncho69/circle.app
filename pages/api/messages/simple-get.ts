import { NextApiRequest, NextApiResponse } from 'next'

// Simple in-memory storage for messages (same as simple-send.ts)
let messages: any[] = []

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { wallet_address } = req.query

    if (!wallet_address || typeof wallet_address !== 'string') {
      return res.status(400).json({ success: false, error: 'Wallet address is required' })
    }

    // Get messages for this wallet (sent or received)
    const userMessages = messages.filter(msg => 
      msg.sender_wallet === wallet_address || msg.recipient_wallet === wallet_address
    )

    return res.status(200).json({
      success: true,
      messages: userMessages
    })

  } catch (error) {
    console.error('API error:', error)
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }
} 