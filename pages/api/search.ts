import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../utils/supabase'

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

    const results: any[] = []

    // Search users by pseudonym or display name
    const { data: users } = await supabase
      .from('users')
      .select('pseudonym, display_name')
      .or(`pseudonym.ilike.%${query}%,display_name.ilike.%${query}%`)
      .limit(5)

    if (users) {
      users.forEach((user: any) => {
        results.push({
          type: 'user',
          pseudonym: user.pseudonym,
          displayName: user.display_name || user.pseudonym,
          id: user.pseudonym
        })
      })
    }

    // Search posts by content
    const { data: posts } = await supabase
      .from('posts')
      .select(`
        id,
        content,
        author:users!author_id(pseudonym, display_name)
      `)
      .ilike('content', `%${query}%`)
      .limit(5)

    if (posts) {
      posts.forEach((post: any) => {
        results.push({
          type: 'post',
          id: post.id,
          content: post.content.substring(0, 100) + (post.content.length > 100 ? '...' : ''),
          author: post.author.display_name || post.author.pseudonym,
          pseudonym: post.author.pseudonym
        })
      })
    }

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