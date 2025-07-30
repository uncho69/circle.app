import { NextApiRequest, NextApiResponse } from 'next'
import { initDatabase } from '../../utils/database'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Initialize database
    const db = initDatabase()
    
    res.status(200).json({
      success: true,
      message: 'Database initialized successfully',
      tables: ['users', 'posts', 'interactions', 'follows', 'notifications', 'zk_proofs']
    })
  } catch (error) {
    console.error('Database initialization error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to initialize database',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 
 
 
 
 
 
 