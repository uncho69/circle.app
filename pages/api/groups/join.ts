import { NextApiRequest, NextApiResponse } from 'next'

export interface Group {
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

// Real groups storage - only groups created by actual users
const groups: Group[] = []

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { groupId, userId, userEthBalance } = req.body

    if (!groupId || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      })
    }

    // Find the group
    const group = groups.find(g => g.id === groupId)
    
    if (!group) {
      return res.status(404).json({
        success: false,
        error: 'Group not found'
      })
    }

    // Check if user already is a member
    if (group.members.includes(userId)) {
      return res.status(400).json({
        success: false,
        error: 'User is already a member of this group'
      })
    }

    // Check ETH requirement
    if (userEthBalance < group.minEthRequired) {
      return res.status(403).json({
        success: false,
        error: `Insufficient ETH balance. Required: ${group.minEthRequired} ETH, Current: ${userEthBalance} ETH`
      })
    }

    // Add user to group
    group.members.push(userId)
    group.memberCount = group.members.length

    return res.status(200).json({
      success: true,
      message: `Successfully joined ${group.name}`,
      group: group
    })

  } catch (error) {
    console.error('Join group error:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to join group',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 
 
 
 
 
 
 
