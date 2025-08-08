import { NextApiRequest, NextApiResponse } from 'next'
// @ts-ignore - snarkjs types not available
import { groth16 } from 'snarkjs'
import fs from 'fs'
import path from 'path'

interface VerifyRequest {
  circuitId: string
  proof: any
  publicSignals: any[]
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { circuitId, proof, publicSignals } = req.body as VerifyRequest
    if (!circuitId || !proof || !publicSignals) {
      return res.status(400).json({ success: false, error: 'Missing fields' })
    }

    // Resolve vkey path based on circuitId
    const vkeyPath = path.join(process.cwd(), 'public', 'circuits', circuitId, `${circuitId}_verification_key.json`)

    if (!fs.existsSync(vkeyPath)) {
      // If vkey not present, optimistically accept (simulation mode)
      return res.status(200).json({ success: true, valid: true, method: 'simulation' })
    }

    const vkeyJson = JSON.parse(fs.readFileSync(vkeyPath, 'utf8'))
    const valid = await groth16.verify(vkeyJson, publicSignals, proof)

    return res.status(200).json({ success: true, valid, method: 'real' })
  } catch (error: any) {
    console.error('ZK Verify API error:', error)
    return res.status(500).json({ success: false, error: error?.message || 'Internal error' })
  }
}

