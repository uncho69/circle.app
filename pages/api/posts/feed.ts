import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../../utils/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { page = '1', limit = '20', wallet_address } = req.query
    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)
    const offset = (pageNum - 1) * limitNum

    // Build query for posts with author info and stats
    let query = supabase
      .from('posts')
      .select(`
        *,
        author:users!author_id(
          id,
          pseudonym,
          display_name,
          avatar_url
        ),
        likes_count:likes(count),
        reposts_count:reposts(count),
        replies_count:replies(count)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1)

    // If wallet_address provided, filter to show posts from followed users + public posts
    if (wallet_address) {
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('wallet_address', wallet_address.toString().toLowerCase())
        .single()

      if (user) {
        // Get followed user IDs
        const { data: following } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id)

        const followingIds = following?.map(f => f.following_id) || []
        
        // Filter posts: from followed users OR public posts from anyone
        query = query.or(`author_id.in.(${followingIds.join(',')}),is_private.eq.false`)
      } else {
        // If user not found, show only public posts
        query = query.eq('is_private', false)
      }
    } else {
      // No wallet provided, show only public posts
      query = query.eq('is_private', false)
    }

    const { data: posts, error } = await query

    if (error) {
      console.error('Supabase error:', error)
      return res.status(500).json({ success: false, error: 'Failed to fetch posts' })
    }

    // Transform data to match expected format
    const transformedPosts = posts?.map(post => ({
      id: post.id,
      author: post.author.display_name || post.author.pseudonym,
      content: post.content,
      timestamp: post.created_at,
      image: post.image_url,
      likes: post.likes_count?.[0]?.count || 0,
      reposts: post.reposts_count?.[0]?.count || 0,
      replies: post.replies_count?.[0]?.count || 0,
      views: 0, // TODO: Implement view tracking
      is_private: post.is_private,
      author_display_name: post.author.display_name,
      author_avatar: post.author.avatar_url,
      author_pseudonym: post.author.pseudonym
    })) || []

    console.log(`✅ Feed loaded: ${transformedPosts.length} posts`)
    return res.status(200).json({ 
      success: true, 
      posts: transformedPosts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        hasMore: transformedPosts.length === limitNum
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }
} 