import { NextApiRequest, NextApiResponse } from 'next'

export interface FollowActionRequest {
  follower: string // pseudonym of who is following
  following: string // pseudonym of who is being followed
  action: 'follow' | 'unfollow'
}

export interface FollowRelationship {
  follower: string
  following: string
  followedAt: string
}

// Simple in-memory storage for demo
let followRelationships: FollowRelationship[] = []

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { follower, following, action }: FollowActionRequest = req.body

    // Validation
    if (!follower || !following || !action) {
      return res.status(400).json({ error: 'Follower, following, and action are required' })
    }

    if (follower === following) {
      return res.status(400).json({ error: 'Cannot follow yourself' })
    }

    if (!['follow', 'unfollow'].includes(action)) {
      return res.status(400).json({ error: 'Action must be follow or unfollow' })
    }

    // Check if relationship already exists
    const existingRelationship = followRelationships.find(
      rel => rel.follower === follower && rel.following === following
    )

    if (action === 'follow') {
      if (existingRelationship) {
        return res.status(400).json({ error: 'Already following this user' })
      }

      // Create new follow relationship
      const newRelationship: FollowRelationship = {
        follower,
        following,
        followedAt: new Date().toISOString()
      }

      followRelationships.push(newRelationship)
      console.log(`👥 ${follower} started following ${following}`)

      return res.status(200).json({
        success: true,
        action: 'followed',
        relationship: newRelationship,
        message: `Now following ${following}`
      })

    } else if (action === 'unfollow') {
      if (!existingRelationship) {
        return res.status(400).json({ error: 'Not following this user' })
      }

      // Remove follow relationship
      followRelationships = followRelationships.filter(
        rel => !(rel.follower === follower && rel.following === following)
      )

      console.log(`👥 ${follower} unfollowed ${following}`)

      return res.status(200).json({
        success: true,
        action: 'unfollowed',
        message: `Unfollowed ${following}`
      })
    }

  } catch (error) {
    console.error('Follow action error:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to process follow action',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// Helper functions to get follow stats
export function getFollowStats(pseudonym: string): {
  followersCount: number
  followingCount: number
  followers: string[]
  following: string[]
} {
  const followers = followRelationships
    .filter(rel => rel.following === pseudonym)
    .map(rel => rel.follower)

  const following = followRelationships
    .filter(rel => rel.follower === pseudonym)
    .map(rel => rel.following)

  return {
    followersCount: followers.length,
    followingCount: following.length,
    followers,
    following
  }
}

export function isFollowing(follower: string, following: string): boolean {
  return followRelationships.some(
    rel => rel.follower === follower && rel.following === following
  )
}

// Export relationships for access from other endpoints
export { followRelationships } 