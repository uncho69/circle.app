import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { address } = req.query

    if (!address || typeof address !== 'string') {
      return res.status(400).json({ error: 'Wallet address is required' })
    }

    // In a real implementation, this would call an Ethereum node or API
    // For now, we'll return mock data that simulates real blockchain data
    const mockBalance = Math.random() * 2 + 0.1 // Random balance between 0.1 and 2.1 ETH
    const mockTransactions = Math.floor(Math.random() * 100) + 5 // Random transaction count

    console.log(`🔍 Fetching blockchain data for: ${address}`)

    return res.status(200).json({
      success: true,
      data: {
        address,
        balance: mockBalance,
        balanceWei: Math.floor(mockBalance * Math.pow(10, 18)),
        transactions: mockTransactions,
        lastUpdated: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Blockchain balance error:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch blockchain data',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 