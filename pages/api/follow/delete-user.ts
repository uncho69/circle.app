import { NextApiRequest, NextApiResponse } from 'next'

// Access the follow relationships from the action.ts file
let followRelationships: any[] = []

// Try to import the relationships array - this is a simple in-memory approach
try {
  const followModule = require('./action')
  if (followModule.followRelationships) {
    followRelationships = followModule.followRelationships
  }
} catch (error) {
  console.warn('Could not access follow relationships from action.ts')
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { pseudonym } = req.body

    if (!pseudonym) {
      return res.status(400).json({ error: 'Pseudonym is required' })
    }

    // Count relationships to delete
    const relationshipsToDelete = followRelationships.filter(
      rel => rel.follower === pseudonym || rel.following === pseudonym
    )
    const deletedCount = relationshipsToDelete.length

    // Remove all relationships involving this user
    const remainingRelationships = followRelationships.filter(
      rel => rel.follower !== pseudonym && rel.following !== pseudonym
    )

    // Update the relationships array
    followRelationships.length = 0
    followRelationships.push(...remainingRelationships)

    console.log(`🗑️ Deleted ${deletedCount} follow relationships for ${pseudonym}`)

    return res.status(200).json({
      success: true,
      deletedCount: deletedCount,
      message: `Deleted ${deletedCount} follow relationships for ${pseudonym}`
    })

  } catch (error) {
    console.error('Delete user follows error:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to delete user follows',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 
 
 
 
 
 
 