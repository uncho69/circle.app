import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../../utils/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { pseudonym } = req.query

    if (!pseudonym) {
      return res.status(400).json({ success: false, error: 'Pseudonym is required' })
    }

    // Get user by pseudonym
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        *,
        posts_count:posts(count),
        followers_count:follows!following_id(count),
        following_count:follows!follower_id(count)
      `)
      .eq('pseudonym', pseudonym)
      .single()

    if (userError || !user) {
      return res.status(404).json({ success: false, error: 'Profile not found' })
    }

    // Get user posts
    const { data: posts, error: postsError } = await supabase
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
      .eq('author_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (postsError) {
      console.error('Error fetching posts:', postsError)
    }

    // Transform data to match expected format
    const profile = {
      pseudonym: user.pseudonym,
      displayName: user.display_name || user.pseudonym,
      bio: user.bio,
      location: null,
      website: null,
      walletAddressDisplay: `${user.wallet_address.substring(0, 6)}...${user.wallet_address.substring(-4)}`,
      createdAt: user.created_at,
      stats: {
        postsCount: user.posts_count?.[0]?.count || 0,
        followersCount: user.followers_count?.[0]?.count || 0,
        followingCount: user.following_count?.[0]?.count || 0
      },
      reputation: user.reputation || 0,
      zkProofs: user.zk_proofs || 0,
      bannerColor: user.banner_color
    }

    const transformedPosts = posts?.map(post => ({
      id: post.id,
      author: post.author.display_name || post.author.pseudonym,
      content: post.content,
      timestamp: post.created_at,
      likes: post.likes_count?.[0]?.count || 0,
      reposts: post.reposts_count?.[0]?.count || 0,
      replies: post.replies_count?.[0]?.count || 0,
      views: 0,
      image: post.image_url
    })) || []

    console.log('✅ Profile loaded:', profile.pseudonym)
    return res.status(200).json({ 
      success: true, 
      profile,
      posts: transformedPosts
    })

  } catch (error) {
    console.error('API error:', error)
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }
} 