import { NextApiRequest, NextApiResponse } from 'next'
import { walletAuth } from '../../../utils/walletAuth'

export interface ProfileUpdateRequest {
  walletAddress: string
  updates: {
    displayName?: string
    bio?: string
    location?: string
    website?: string
    avatar?: string
    bannerColor?: string
    socialLinks?: {
      twitter?: string
      github?: string
      telegram?: string
      discord?: string
    }
  }
  signature: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { walletAddress, updates, signature }: ProfileUpdateRequest = req.body

    // Validation
    if (!walletAddress || !signature) {
      return res.status(400).json({ error: 'Wallet address and signature required' })
    }

    // Get current profile
    const currentProfile = walletAuth.getProfile(walletAddress)
    if (!currentProfile) {
      return res.status(404).json({ error: 'Profile not found' })
    }

    // Validate signature (in production, verify the signature)
    // For demo, we'll just check if signature exists
    if (!signature || signature.length < 10) {
      return res.status(401).json({ error: 'Invalid signature' })
    }

    // Validate updates
    if (updates.displayName && updates.displayName.length > 50) {
      return res.status(400).json({ error: 'Display name must be 50 characters or less' })
    }

    if (updates.bio && updates.bio.length > 280) {
      return res.status(400).json({ error: 'Bio must be 280 characters or less' })
    }

    if (updates.website && !isValidUrl(updates.website)) {
      return res.status(400).json({ error: 'Invalid website URL' })
    }

    // Update profile with new data
    const updatedProfile = {
      ...currentProfile,
      displayName: updates.displayName || currentProfile.displayName || currentProfile.pseudonym,
      bio: updates.bio || currentProfile.bio || '',
      location: updates.location || currentProfile.location || '',
      website: updates.website || currentProfile.website || '',
      avatar: updates.avatar || currentProfile.avatar || generateDefaultAvatar(currentProfile.pseudonym),
      bannerColor: updates.bannerColor || currentProfile.bannerColor || generateRandomColor(),
      socialLinks: {
        ...currentProfile.socialLinks,
        ...updates.socialLinks
      },
      lastUpdated: new Date().toISOString()
    }

    // Save updated profile
    const success = await walletAuth.updateProfile(walletAddress, updatedProfile)

    if (!success) {
      return res.status(500).json({ error: 'Failed to update profile' })
    }

    console.log(`✅ Profile updated: ${currentProfile.pseudonym}`)

    return res.status(200).json({
      success: true,
      profile: updatedProfile,
      message: 'Profile updated successfully'
    })

  } catch (error) {
    console.error('Profile update error:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to update profile',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// Helper functions
function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

function generateDefaultAvatar(pseudonym: string): string {
  // Generate a deterministic avatar based on pseudonym
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
  return `gradient-${colorIndex}` // We'll use this to generate CSS gradients
}

function generateRandomColor(): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', 
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ]
  return colors[Math.floor(Math.random() * colors.length)]
} 