import { NextApiRequest, NextApiResponse } from 'next'

// Mock database for now - in production this would be a real database
const groups = [
  {
    id: '573ecc7aac136c0dd66746f92a89c700',
    name: 'test',
    description: '1',
    minEthRequired: 1,
    memberCount: 1,
    isPrivate: true,
    owner: 'anus',
    members: ['anus'],
    createdAt: '2025-07-29T19:28:13.404Z'
  },
  {
    id: '955654db73248663b256bc1183b5ca65',
    name: 'test',
    description: '1',
    minEthRequired: 100,
    memberCount: 1,
    isPrivate: true,
    owner: 'anus',
    members: ['anus'],
    createdAt: '2025-07-29T19:28:31.635Z'
  }
]

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { groupId, minEthRequired, isPrivate, members } = req.body

    // Validation
    if (!groupId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Group ID is required' 
      })
    }

    // Find the group
    const groupIndex = groups.findIndex(g => g.id === groupId)
    
    if (groupIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'Circle not found' 
      })
    }

    // Update the group
    groups[groupIndex] = {
      ...groups[groupIndex],
      minEthRequired: minEthRequired || groups[groupIndex].minEthRequired,
      isPrivate: isPrivate !== undefined ? isPrivate : groups[groupIndex].isPrivate,
      members: members || groups[groupIndex].members,
      memberCount: members ? members.length : groups[groupIndex].memberCount
    }

    console.log('✅ Circle updated:', groups[groupIndex])

    return res.status(200).json({
      success: true,
      group: groups[groupIndex],
      message: 'Circle updated successfully'
    })

  } catch (error) {
    console.error('Update circle error:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to update circle',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 