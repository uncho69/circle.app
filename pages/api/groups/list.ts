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
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Return only real groups created by users
    // No fake/sample groups - start with empty state
    return res.status(200).json({
      success: true,
      groups: groups,
      total: groups.length,
      message: groups.length === 0 ? 'No groups created yet' : 'Groups retrieved successfully'
    })

  } catch (error) {
    console.error('Groups list error:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to load groups',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 
 
 
 
 
 
 
