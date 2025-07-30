import { NextApiRequest, NextApiResponse } from 'next'
import { getPosts, initDatabase, getUserByWallet, getUserByPseudonym } from '../../../utils/database'
import { getFollowStats } from '../follow/action'

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

export interface ProfileStats {
  postsCount: number
  followersCount: number
  followingCount: number
  likesReceived: number
  repostsReceived: number
}

export interface PublicProfile {
  pseudonym: string
  displayName: string
  bio: string
  location: string
  website: string
  avatar: string
  bannerColor: string
  socialLinks: {
    twitter?: string
    github?: string
    telegram?: string
    discord?: string
  }
  createdAt: string
  reputation: number
  stats: ProfileStats
  zkProofs: number // Only count, not actual proofs for privacy
  walletAddressDisplay: string // Truncated wallet address for display (first 8 chars + ... + last 4)
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Initialize database
  initDatabase()

  try {
    const { pseudonym, walletAddress } = req.query

    let profile: DatabaseUser | null = null

    // Get profile by pseudonym or wallet address
    if (pseudonym) {
      profile = getUserByPseudonym(pseudonym as string) as DatabaseUser | null
    } else if (walletAddress) {
      profile = getUserByWallet(walletAddress as string) as DatabaseUser | null
    } else {
      return res.status(400).json({ error: 'Pseudonym or wallet address required' })
    }

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' })
    }

    // Calculate profile statistics
    const allPosts = getPosts()
    const userPosts = allPosts.filter((post: any) => post.author === profile!.pseudonym)
    const followStats = getFollowStats(profile!.pseudonym)
    
    const stats: ProfileStats = {
      postsCount: userPosts.length,
      followersCount: followStats.followersCount,
      followingCount: followStats.followingCount,
      likesReceived: userPosts.reduce((sum: number, post: any) => sum + (post.likes || 0), 0),
      repostsReceived: userPosts.reduce((sum: number, post: any) => sum + (post.reposts || 0), 0)
    }

    // Format posts for frontend
    const formattedPosts = userPosts.map((post: any) => ({
      id: post.id.toString(),
      author: post.author,
      content: post.content,
      image: post.image,
      likes: post.likes || 0,
      reposts: post.reposts || 0,
      replies: post.replies || 0,
      views: 0, // Views not implemented yet
      timestamp: post.created_at,
      visibility: post.visibility || 'public',
      replyTo: post.reply_to_id ? post.reply_to_id.toString() : null
    }))

    // Parse social links from JSON string
    const socialLinks = profile.social_links ? JSON.parse(profile.social_links) : {}

    // Create public profile (remove sensitive data)
    const publicProfile: PublicProfile = {
      pseudonym: profile.pseudonym,
      displayName: profile.display_name || profile.pseudonym,
      bio: profile.bio || '',
      location: profile.location || '',
      website: profile.website || '',
      avatar: profile.avatar || generateDefaultAvatar(profile.pseudonym),
      bannerColor: profile.banner_color || generateRandomColor(),
      socialLinks,
      createdAt: profile.created_at,
      reputation: profile.reputation || 0,
      stats,
      zkProofs: 0, // TODO: Implement ZK proofs count
      walletAddressDisplay: `${profile.wallet_address.substring(0, 8)}...${profile.wallet_address.substring(profile.wallet_address.length - 4)}`
    }

    return res.status(200).json({
      success: true,
      profile: publicProfile,
      posts: formattedPosts,
      message: 'Profile retrieved successfully'
    })

  } catch (error) {
    console.error('Profile retrieval error:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve profile',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// Helper functions (same as in update.ts)
function generateDefaultAvatar(pseudonym: string): string {
  const colors = [
    'from-red-400 to-pink-400',
    'from-blue-400 to-cyan-400', 
    'from-green-400 to-emerald-400',
    'from-purple-400 to-violet-400',
    'from-yellow-400 to-orange-400',
    'from-indigo-400 to-blue-400'
  ]
  
  const hash = pseudonym.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0)
    return a & a
  }, 0)
  
  const colorIndex = Math.abs(hash) % colors.length
  return `gradient-${colorIndex}`
}

function generateRandomColor(): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', 
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ]
  return colors[Math.floor(Math.random() * colors.length)]
} 