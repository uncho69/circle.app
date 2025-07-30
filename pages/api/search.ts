import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { q } = req.query
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Search query is required' 
      })
    }

    const query = q.trim()
    if (query.length < 2) {
      return res.status(200).json({
        success: true,
        results: []
      })
    }

    // Initialize database (would be done in production)
    
    // For now, return empty results
    // In production, this would search the database
    const results: any[] = []

    return res.status(200).json({
      success: true,
      results: results.slice(0, 10) // Limit total results
    })

  } catch (error) {
    console.error('Search error:', error)
    return res.status(500).json({
      success: false,
      error: 'Search failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 