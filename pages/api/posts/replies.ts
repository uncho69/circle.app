import { NextApiRequest, NextApiResponse } from 'next'
import { initDatabase, getPostById, getPosts } from '../../../utils/database'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { postId } = req.query

    if (!postId || typeof postId !== 'string') {
      return res.status(400).json({ error: 'Post ID is required' })
    }

    // Initialize database
    initDatabase()

    // Check if parent post exists
    const parentPost = getPostById(parseInt(postId))
    if (!parentPost) {
      return res.status(404).json({ error: 'Parent post not found' })
    }

    // Get all posts and filter for replies
    const allPosts = getPosts(1000, 0) // Get all posts
    const replies = allPosts
      .filter((post: any) => post.reply_to_id === parseInt(postId))
      .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) // Oldest first for replies

    console.log(`📄 Retrieved ${replies.length} replies for post ${postId.substring(0, 8)}...`)

    return res.status(200).json({
      success: true,
      replies: replies,
      parentPost: parentPost,
      count: replies.length,
      message: 'Replies retrieved successfully'
    })

  } catch (error) {
    console.error('Replies retrieval error:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve replies',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 
 
 