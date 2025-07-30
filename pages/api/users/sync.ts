import { NextApiRequest, NextApiResponse } from 'next'
import { initDatabase, createUser, getUserByWallet } from '../../../utils/database'

// Initialize database
let dbInitialized = false
const initDb = () => {
  if (!dbInitialized) {
    initDatabase()
    dbInitialized = true
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Initialize database
    initDb()
    
    const { walletAddress, pseudonym, displayName, bio } = req.body

    if (!walletAddress || !pseudonym) {
      return res.status(400).json({ error: 'Wallet address and pseudonym are required' })
    }

    // Check if user already exists in database
    console.log('🔍 Looking for user with wallet:', walletAddress)
    const existingUser = getUserByWallet(walletAddress)
    console.log('Found existing user:', existingUser)
    
    if (existingUser) {
      console.log('✅ User already exists in database')
      return res.status(200).json({
        success: true,
        user: existingUser,
        message: 'User already exists in database'
      })
    }

    // Create user in database
    console.log('📝 Creating new user in database:', {
      walletAddress: walletAddress.toLowerCase(),
      pseudonym,
      displayName: displayName || pseudonym
    })
    
    const userId = createUser({
      walletAddress: walletAddress.toLowerCase(),
      pseudonym,
      displayName: displayName || pseudonym,
      bio: bio || ''
    })
    
    console.log('✅ User created with ID:', userId)

    // Get the created user
    const newUser = getUserByWallet(walletAddress)
    
    if (!newUser) {
      throw new Error('Failed to retrieve created user')
    }

    console.log(`✅ User synced to database:`, {
      id: userId,
      walletAddress: walletAddress.toLowerCase(),
      pseudonym
    })

    return res.status(201).json({
      success: true,
      user: newUser,
      message: 'User synced to database successfully'
    })

  } catch (error) {
    console.error('User sync error:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to sync user',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 
 
 
 
 
 
 



