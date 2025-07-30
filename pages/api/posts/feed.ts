import { NextApiRequest, NextApiResponse } from 'next'
import { initDatabase, getPosts } from '../../../utils/database'

// Initialize database
let dbInitialized = false
const initDb = () => {
  if (!dbInitialized) {
    initDatabase()
    dbInitialized = true
  }
}

export interface Post {
  id: string
  content: string
  author: string
  timestamp: string
  encrypted: boolean
  signature?: string
  likes: number
  replies: number
  reposts: number
  views: number
  visibility: 'public' | 'followers' | 'private'
  image?: string
  replyTo?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Initialize database
    initDb()
    
    const { limit = '20', offset = '0' } = req.query
    const limitNum = parseInt(limit as string)
    const offsetNum = parseInt(offset as string)

    // Get posts from database
    const dbPosts = getPosts(limitNum, offsetNum)
    
    // Convert to API format
    const posts: Post[] = dbPosts.map((dbPost: any) => ({
      id: dbPost.id.toString(),
      author: dbPost.author,
      content: dbPost.content,
      timestamp: dbPost.created_at,
      encrypted: false,
      likes: dbPost.likes,
      replies: dbPost.replies,
      reposts: dbPost.reposts,
      views: 0, // Views not implemented yet
      visibility: dbPost.visibility as 'public' | 'followers' | 'private',
      image: dbPost.image || undefined,
      replyTo: dbPost.reply_to_id?.toString()
    }))

    // If no posts, return empty feed (no fake posts)
    if (posts.length === 0) {
      return res.status(200).json({
        success: true,
        posts: [],
        total: 0,
        hasMore: false,
        message: 'Feed is empty - create your first post!'
      })
    }

    return res.status(200).json({
      success: true,
      posts: posts,
      total: posts.length,
      hasMore: posts.length === limitNum,
      message: 'Feed retrieved successfully'
    })

  } catch (error) {
    console.error('Feed error:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve feed',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 