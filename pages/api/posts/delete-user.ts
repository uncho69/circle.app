import { NextApiRequest, NextApiResponse } from 'next'
import { initDatabase, deleteUserPosts } from '../../../utils/database'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { author } = req.body

    if (!author) {
      return res.status(400).json({ error: 'Author pseudonym is required' })
    }

    // Initialize database
    initDatabase()

    // Delete all posts by this author
    const deletedCount = deleteUserPosts(author)

    console.log(`🗑️ Deleted ${deletedCount} posts by ${author}`)

    return res.status(200).json({
      success: true,
      deletedCount: deletedCount,
      message: `Deleted ${deletedCount} posts by ${author}`
    })

  } catch (error) {
    console.error('Delete user posts error:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to delete user posts',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 
 
 