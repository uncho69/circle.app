import { useState, useCallback } from 'react'

export type ZKProofType = 'identity' | 'reputation' | 'membership' | 'balance'

interface ZKProof {
  proof: any
  publicSignals: string[]
  circuitId: string
  timestamp: string
}

interface ZKProofRequest {
  type: ZKProofType
  secret: string
  publicSignals?: string[]
}

interface ZKProofStatus {
  generating: boolean
  proof: ZKProof | null
  error: string | null
  verified: boolean
}

export const useZKProof = () => {
  const [status, setStatus] = useState<ZKProofStatus>({
    generating: false,
    proof: null,
    error: null,
    verified: false
  })

  const [proofHistory, setProofHistory] = useState<ZKProof[]>([])

  // Generate ZK proof
  const generateProof = useCallback(async (request: ZKProofRequest): Promise<ZKProof | null> => {
    setStatus(prev => ({ ...prev, generating: true, error: null }))

    try {
      const response = await fetch('/api/zkproof/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate proof')
      }

      const proof = result.proof
      
      setStatus(prev => ({
        ...prev,
        generating: false,
        proof,
        verified: true
      }))

      setProofHistory(prev => [proof, ...prev.slice(0, 9)]) // Keep last 10 proofs

      return proof
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      setStatus(prev => ({
        ...prev,
        generating: false,
        error: errorMessage,
        verified: false
      }))

      return null
    }
  }, [])

  // Verify existing proof
  const verifyProof = useCallback(async (proof: ZKProof): Promise<boolean> => {
    try {
      const response = await fetch('/api/zkproof/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(proof)
      })

      const result = await response.json()
      return result.success && result.valid
    } catch (error) {
      console.error('Proof verification error:', error)
      return false
    }
  }, [])

  // Generate identity proof
  const generateIdentityProof = useCallback(async (secret: string) => {
    return generateProof({ type: 'identity', secret })
  }, [generateProof])

  // Generate reputation proof
  const generateReputationProof = useCallback(async (reputation: number) => {
    return generateProof({ type: 'reputation', secret: reputation.toString() })
  }, [generateProof])

  // Generate membership proof
  const generateMembershipProof = useCallback(async (secret: string, merkleRoot: string) => {
    return generateProof({ 
      type: 'membership', 
      secret, 
      publicSignals: [merkleRoot] 
    })
  }, [generateProof])

  // Generate balance proof
  const generateBalanceProof = useCallback(async (balance: number, threshold: number) => {
    return generateProof({ 
      type: 'balance', 
      secret: balance.toString(),
      publicSignals: [threshold.toString()]
    })
  }, [generateProof])

  // Clear proof data
  const clearProof = useCallback(() => {
    setStatus({
      generating: false,
      proof: null,
      error: null,
      verified: false
    })
  }, [])

  // Get proof description
  const getProofDescription = useCallback((type: ZKProofType): string => {
    const descriptions = {
      identity: 'Prove your unique identity without revealing personal information',
      reputation: 'Prove your reputation score without revealing your history',
      membership: 'Prove group membership without revealing your identity',
      balance: 'Prove you have sufficient balance without revealing the amount'
    }
    
    return descriptions[type]
  }, [])

  // Get proof complexity info
  const getProofComplexity = useCallback((type: ZKProofType) => {
    const complexity = {
      identity: { time: '~15s', constraints: '~50K', trust: 'High' },
      reputation: { time: '~12s', constraints: '~35K', trust: 'Medium' },
      membership: { time: '~20s', constraints: '~75K', trust: 'High' },
      balance: { time: '~10s', constraints: '~25K', trust: 'High' }
    }
    
    return complexity[type]
  }, [])

  return {
    // State
    status,
    proofHistory,
    
    // Actions
    generateProof,
    verifyProof,
    clearProof,
    
    // Specific proof generators
    generateIdentityProof,
    generateReputationProof,
    generateMembershipProof,
    generateBalanceProof,
    
    // Utilities
    getProofDescription,
    getProofComplexity,
    
    // Computed values
    isGenerating: status.generating,
    hasProof: !!status.proof,
    hasError: !!status.error,
    isVerified: status.verified,
    currentProof: status.proof,
    error: status.error
  }
} 