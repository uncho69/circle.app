import { NextApiRequest, NextApiResponse } from 'next'
import { initDatabase, createPost, getUserByPseudonym, getPostById } from '../../../utils/database'

interface DatabaseUser {
  id: number
  wallet_address: string
  pseudonym: string
  display_name: string
  bio: string
  location: string
  website: string
  avatar: string
  banner_color: string
  social_links: string
  reputation: number
  created_at: string
  last_login: string
  updated_at: string
}

interface DatabasePost {
  id: number
  author_id: number
  author: string
  content: string
  image: string | null
  visibility: string
  likes: number
  replies: number
  reposts: number
  views: number
  created_at: string
  updated_at: string
  reply_to_id: number | null
}

// Initialize database
let dbInitialized = false
const initDb = () => {
  if (!dbInitialized) {
    initDatabase()
    dbInitialized = true
  }
}

export interface CreatePostRequest {
  content: string
  author: string
  visibility?: 'public' | 'followers' | 'private'
  signature?: string
  image?: string
  replyTo?: string // ID of post being replied to
}

export interface Post {
  id: string
  author: string
  content: string
  timestamp: string
  encrypted: boolean
  signature?: string
  likes: number
  replies: number
  reposts: number
  views: number
  visibility: 'public' | 'public' | 'followers' | 'private'
  image?: string
  replyTo?: string // ID of parent post if this is a reply
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Initialize database
    initDb()
    
    const { content, author, visibility = 'public', signature, image, replyTo }: CreatePostRequest = req.body

    // Validation
    if (!content || !author) {
      return res.status(400).json({ error: 'Content and author are required' })
    }

    if (content.length > 280) {
      return res.status(400).json({ error: 'Content must be 280 characters or less' })
    }

    // Get user by pseudonym
    const user = getUserByPseudonym(author) as DatabaseUser | null
    if (!user || !user.id) {
      return res.status(404).json({ error: 'User not found' })
    }

    // If this is a reply, validate parent post exists
    let replyToId: number | undefined
    if (replyTo) {
      const parentPost = getPostById(parseInt(replyTo))
      if (!parentPost) {
        return res.status(404).json({ error: 'Parent post not found' })
      }
      replyToId = parseInt(replyTo)
    }

    // Validate image if provided
    if (image) {
      // Basic validation for base64 image
      if (!image.startsWith('data:image/')) {
        return res.status(400).json({ error: 'Invalid image format' })
      }
      
      // Check image size (rough estimate - base64 is ~33% larger than binary)
      const imageSizeEstimate = (image.length * 3) / 4
      if (imageSizeEstimate > 5 * 1024 * 1024) { // 5MB limit
        return res.status(400).json({ error: 'Image too large (max 5MB)' })
      }
    }

    // Create post in database
    const postId = createPost({
      authorId: user.id,
      content: content,
      image: image,
      visibility: visibility,
      replyToId: replyToId
    })

    // Get the created post
    const newPost = getPostById(Number(postId)) as DatabasePost | null
    if (!newPost) {
      throw new Error('Failed to retrieve created post')
    }

    // Convert to API format
    const apiPost: Post = {
      id: newPost.id.toString(),
      author: newPost.author,
      content: newPost.content,
      timestamp: newPost.created_at,
      encrypted: false,
      signature: signature,
      likes: newPost.likes,
      replies: newPost.replies,
      reposts: newPost.reposts,
      views: newPost.views,
      visibility: newPost.visibility as 'public' | 'followers' | 'private',
      image: newPost.image || undefined,
      replyTo: replyToId?.toString()
    }

    console.log(`✅ ${replyTo ? 'Reply' : 'Post'} created:`, {
      id: postId,
      author: author,
      content: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
      replyTo: replyTo || null
    })

    return res.status(201).json({
      success: true,
      post: apiPost,
      message: `${replyTo ? 'Reply' : 'Post'} created successfully`
    })

  } catch (error) {
    console.error('Create post error:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to create post',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 