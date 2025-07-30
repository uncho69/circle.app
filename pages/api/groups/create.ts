import { NextApiRequest, NextApiResponse } from 'next'
import { initDatabase, createUser, getUserByPseudonym } from '../../../utils/database'
import { randomBytes } from 'crypto'

// Initialize database
let dbInitialized = false
const initDb = () => {
  if (!dbInitialized) {
    initDatabase()
    dbInitialized = true
  }
}

interface Group {
  id: string
  name: string
  description: string
  minEthRequired: number
  memberCount: number
  isPrivate: boolean
  owner: string
  members: string[]
  createdAt: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Initialize database
    initDb()
    
    const { name, description, minEthRequired, isPrivate, owner, transactionHash } = req.body

    if (!name || !owner) {
      return res.status(400).json({ error: 'Circle name and owner are required' })
    }

    // Check if owner exists
    const ownerUser = getUserByPseudonym(owner)
    if (!ownerUser) {
      return res.status(400).json({ error: 'Circle owner not found' })
    }

    // Validate blockchain transaction
    if (!transactionHash) {
      return res.status(400).json({ 
        error: 'Blockchain transaction required for circle creation' 
      })
    }

    // In a real implementation, here you would:
    // 1. Verify the transaction on-chain
            // 2. Check that the transaction amount is correct (0.15 ETH)
    // 3. Verify the transaction is confirmed

    console.log(`💰 Circle creation transaction: ${transactionHash}`)

    // Create group
    const group: Group = {
      id: randomBytes(16).toString('hex'),
      name: name.trim(),
      description: description?.trim() || '',
      minEthRequired: minEthRequired || 0,
      memberCount: 1, // Owner is first member
      isPrivate: isPrivate !== false,
      owner: owner,
      members: [owner],
      createdAt: new Date().toISOString()
    }

    // For now, store in memory (later will be in database)
    // In a real implementation, this would be stored in the database
    console.log(`✅ Circle created:`, group)

    return res.status(201).json({
      success: true,
      group: group,
      message: `Circle created successfully! Transaction: ${transactionHash.substring(0, 10)}...`,
      transaction: {
        hash: transactionHash,
                        amount: 0.15 // 0.15 ETH
      }
    })

  } catch (error) {
    console.error('Group creation error:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to create group',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 
 
 
 
 
 
 



