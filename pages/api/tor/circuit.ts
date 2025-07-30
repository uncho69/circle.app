import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Simulate new circuit creation
    const nodes = ['nodeA', 'nodeB', 'nodeC', 'nodeD']
    const shuffledNodes = nodes.sort(() => Math.random() - 0.5).slice(0, 3)
    
    const circuit = {
      currentCircuit: shuffledNodes,
      nodeCount: shuffledNodes.length,
      socksPort: 9050
    }

    const latency = Math.floor(Math.random() * 200) + 100 // 100-300ms

    // Simulate circuit creation delay
    await new Promise(resolve => setTimeout(resolve, 800))

    console.log('🔄 New Tor circuit created:', shuffledNodes)

    return res.status(200).json({
      success: true,
      circuit,
      latency,
      message: 'New circuit created'
    })

  } catch (error) {
    console.error('Circuit creation error:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to create new circuit',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 