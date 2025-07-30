import { NextApiRequest, NextApiResponse } from 'next'
import { initDatabase, createUser, getUserByWallet, getUserByPseudonym } from '../../../utils/database'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Initialize database
  initDatabase()

  try {
    const { walletAddress, pseudonym, displayName, bio, location, website, avatar, bannerColor, socialLinks } = req.body

    // Validation
    if (!walletAddress || !pseudonym) {
      return res.status(400).json({ 
        success: false, 
        error: 'Wallet address and pseudonym are required' 
      })
    }

    // Check if wallet already exists
    const existingUserByWallet = getUserByWallet(walletAddress)
    if (existingUserByWallet) {
      return res.status(400).json({ 
        success: false, 
        error: 'Wallet address already registered' 
      })
    }

    // Check if pseudonym already exists
    const existingUserByPseudonym = getUserByPseudonym(pseudonym)
    if (existingUserByPseudonym) {
      return res.status(400).json({ 
        success: false, 
        error: 'Pseudonym already taken' 
      })
    }

    // Create new user profile
    const newUser = createUser({
      walletAddress,
      pseudonym,
      displayName: displayName || pseudonym,
      bio: bio || '',
      location: location || '',
      website: website || '',
      avatar: avatar || '',
      bannerColor: bannerColor || '#1DA1F2',
      socialLinks: socialLinks || {},
      reputation: 0,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    })

    console.log(`✅ Profile created for ${pseudonym} (${walletAddress})`)

    return res.status(201).json({
      success: true,
      profile: newUser,
      message: 'Profile created successfully'
    })

  } catch (error) {
    console.error('Profile creation error:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to create profile',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 
 
 
 
 
 
 