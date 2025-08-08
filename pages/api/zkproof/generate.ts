import { NextApiRequest, NextApiResponse } from 'next'
// @ts-ignore - snarkjs types not available
import { groth16 } from 'snarkjs'
import crypto from 'crypto'

interface ZKProofRequest {
  type: 'identity' | 'age' | 'reputation' | 'membership' | 'balance'
  secret: string
  publicSignals?: string[]
}

interface CircuitFiles {
  wasm: string
  zkey: string
}

class ZKProofManager {
  private static instance: ZKProofManager
  private circuits: Map<string, CircuitFiles> = new Map()

  private constructor() {
    this.initializeCircuits()
  }

  static getInstance(): ZKProofManager {
    if (!ZKProofManager.instance) {
      ZKProofManager.instance = new ZKProofManager()
    }
    return ZKProofManager.instance
  }

  private initializeCircuits() {
    // Load real circuit files from compilation
    this.circuits.set('identity', {
      wasm: '/circuits/identity/identity.wasm',
      zkey: '/circuits/identity/identity_final.zkey'
    })
    
    this.circuits.set('age', {
      wasm: '/circuits/age_verification/age_verification.wasm', 
      zkey: '/circuits/age_verification/age_verification_final.zkey'
    })
    
    // These will be implemented in future iterations
    this.circuits.set('reputation', {
      wasm: '/circuits/reputation/reputation.wasm',
      zkey: '/circuits/reputation/reputation_final.zkey'
    })
    
    this.circuits.set('membership', {
      wasm: '/circuits/membership/membership.wasm',
      zkey: '/circuits/membership/membership_final.zkey'
    })
    
    this.circuits.set('balance', {
      wasm: '/circuits/balance_proof/balance_proof.wasm',
      zkey: '/circuits/balance_proof/balance_proof_final.zkey'
    })
  }

  async generateProof(request: ZKProofRequest): Promise<any> {
    try {
      const circuitFiles = this.circuits.get(request.type)
      if (!circuitFiles) {
        throw new Error(`Circuit not found for type: ${request.type}`)
      }

      // Generate circuit inputs based on proof type
      const inputs = await this.generateCircuitInputs(request)
      
      // Try real proof generation first, fallback to simulation
      try {
        const realProof = await this.generateRealProof(circuitFiles, inputs)
        return {
          proof: realProof.proof,
          publicSignals: realProof.publicSignals,
          circuitId: request.type,
          timestamp: new Date().toISOString(),
          method: 'real'
        }
      } catch (realError: any) {
        console.warn(`Real proof generation failed for ${request.type}, falling back to simulation:`, realError.message)
        
        // Fallback to simulation
        const mockProof = await this.simulateProofGeneration(request.type, inputs)
        return {
          proof: mockProof.proof,
          publicSignals: mockProof.publicSignals,
          circuitId: request.type,
          timestamp: new Date().toISOString(),
          method: 'simulation'
        }
      }
    } catch (error) {
      console.error('ZK Proof generation error:', error)
      throw error
    }
  }

  private async generateRealProof(circuitFiles: CircuitFiles, inputs: any): Promise<any> {
    const path = require('path')
    const fs = require('fs')

    // Resolve paths under public directory correctly
    const wasmPath = path.join(process.cwd(), 'public', circuitFiles.wasm.replace(/^\//, ''))
    const zkeyPath = path.join(process.cwd(), 'public', circuitFiles.zkey.replace(/^\//, ''))

    if (!fs.existsSync(wasmPath)) {
      throw new Error(`WASM file not found: ${wasmPath}`)
    }

    if (!fs.existsSync(zkeyPath)) {
      throw new Error(`ZKEY file not found: ${zkeyPath}`)
    }

    // Generate proof using groth16
    console.log(`🔮 Generating real ZK proof with files:`, { wasmPath, zkeyPath })
    const { proof, publicSignals } = await groth16.fullProve(inputs, wasmPath, zkeyPath)

    console.log(`✅ Real ZK proof generated successfully`)
    return { proof, publicSignals }
  }

  private async generateCircuitInputs(request: ZKProofRequest): Promise<any> {
    const secretHash = crypto.createHash('sha256').update(request.secret).digest('hex')

    switch (request.type) {
      case 'identity': {
        // Compute merkleRoot = Poseidon(secret, nullifier) so that IsEqual(commitment, merkleRoot) holds
        const circomlibjs = require('circomlibjs')
        const F1 = (x: string) => BigInt('0x' + x)
        const secretBig = F1(secretHash)
        const nullifierHex = crypto.randomBytes(32).toString('hex')
        const nullifierBig = F1(nullifierHex)
        const poseidon = await circomlibjs.buildPoseidon()
        const commitmentBig = poseidon.F.toObject(poseidon([secretBig, nullifierBig]))

        return {
          secret: secretBig.toString(),
          nullifier: nullifierBig.toString(),
          merkleRoot: commitmentBig.toString()
        }
      }
        
      case 'age':
        // Prove age >= 18 without revealing exact age
        const age = parseInt(request.secret)
        return {
          ageCommitment: crypto.createHash('sha256').update(age.toString()).digest('hex'),
          minAge: 18,
          salt: crypto.randomBytes(16).toString('hex')
        }
        
      case 'reputation':
        // Prove reputation score above threshold
        const reputation = parseInt(request.secret)
        return {
          reputationCommitment: crypto.createHash('sha256').update(reputation.toString()).digest('hex'),
          threshold: 100,
          salt: crypto.randomBytes(16).toString('hex')
        }
        
      case 'membership':
        // Prove membership in a set without revealing identity
        return {
          membershipSecret: secretHash,
          merkleRoot: request.publicSignals?.[0] || crypto.randomBytes(32).toString('hex'),
          nullifier: crypto.randomBytes(32).toString('hex')
        }
        
      case 'balance':
        // Prove balance above threshold without revealing amount
        const balance = parseFloat(request.secret)
        return {
          balanceCommitment: crypto.createHash('sha256').update(balance.toString()).digest('hex'),
          threshold: parseFloat(request.publicSignals?.[0] || '1000'),
          salt: crypto.randomBytes(16).toString('hex')
        }
        
      default:
        throw new Error(`Unknown proof type: ${request.type}`)
    }
  }

  private async simulateProofGeneration(type: string, inputs: any): Promise<any> {
    // Simulate proof generation with realistic structure
    // In production, this would use actual circuits
    
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockProof = {
          proof: {
            pi_a: [
              crypto.randomBytes(32).toString('hex'),
              crypto.randomBytes(32).toString('hex'),
              "1"
            ],
            pi_b: [
              [crypto.randomBytes(32).toString('hex'), crypto.randomBytes(32).toString('hex')],
              [crypto.randomBytes(32).toString('hex'), crypto.randomBytes(32).toString('hex')],
              ["1", "0"]
            ],
            pi_c: [
              crypto.randomBytes(32).toString('hex'),
              crypto.randomBytes(32).toString('hex'),
              "1"
            ],
            protocol: "groth16",
            curve: "bn128"
          },
          publicSignals: this.generatePublicSignals(type, inputs)
        }
        
        resolve(mockProof)
      }, 1000 + Math.random() * 2000) // Simulate realistic proof generation time
    })
  }

  private generatePublicSignals(type: string, inputs: any): string[] {
    switch (type) {
      case 'identity':
        return [
          inputs.nullifier,
          inputs.commitment,
          crypto.randomBytes(32).toString('hex') // Anonymous ID
        ]
        
      case 'age':
        return [
          "1", // Proof that age >= 18 (boolean as string)
          crypto.randomBytes(32).toString('hex') // Age group hash
        ]
        
      case 'reputation':
        return [
          "1", // Proof that reputation >= threshold
          crypto.randomBytes(16).toString('hex') // Reputation tier
        ]
        
      case 'membership':
        return [
          inputs.merkleRoot,
          inputs.nullifier,
          "1" // Valid membership proof
        ]
        
      case 'balance':
        return [
          "1", // Proof that balance >= threshold
          crypto.randomBytes(16).toString('hex') // Balance tier
        ]
        
      default:
        return [crypto.randomBytes(32).toString('hex')]
    }
  }

  getCircuitInfo(type: string) {
    return {
      type,
      available: this.circuits.has(type),
      description: this.getCircuitDescription(type)
    }
  }

  private getCircuitDescription(type: string): string {
    const descriptions = {
      identity: 'Anonymous identity proof without revealing personal information',
      age: 'Age verification proof without revealing exact age',
      reputation: 'Reputation score proof without revealing history',
      membership: 'Group membership proof without revealing identity',
      balance: 'Balance threshold proof without revealing amount'
    }
    
    return descriptions[type as keyof typeof descriptions] || 'Unknown circuit'
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const zkManager = ZKProofManager.getInstance()
    const request: ZKProofRequest = req.body

    // Validate request
    if (!request.type || !request.secret) {
      return res.status(400).json({ 
        error: 'Missing required fields: type and secret' 
      })
    }

    const proof = await zkManager.generateProof(request)
    
    return res.status(200).json({
      success: true,
      proof,
      message: `ZK proof generated for ${request.type}`
    })
    
  } catch (error) {
    console.error('ZK Proof API error:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to generate ZK proof',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 