import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Zap, Users, CreditCard, User, Check, AlertTriangle, Clock, Cpu } from 'lucide-react'
import { useZKProof, ZKProofType } from '../hooks/useZKProof'

interface ZKProofGeneratorProps {
  onProofGenerated?: (proof: any) => void
}

const proofTypes = [
  {
    type: 'identity' as ZKProofType,
    icon: User,
    title: 'Anonymous Identity',
    description: 'Prove you are a unique human without revealing who you are',
    color: 'from-cyan-400 to-blue-600',
    inputPlaceholder: 'Enter your secret phrase...'
  },
  {
    type: 'reputation' as ZKProofType,
    icon: Zap,
    title: 'Reputation Score',
    description: 'Prove your reputation without revealing activity history',
    color: 'from-violet-400 to-purple-600',
    inputPlaceholder: 'Enter your reputation score...'
  },
  {
    type: 'membership' as ZKProofType,
    icon: Users,
    title: 'Group Membership',
    description: 'Prove membership in exclusive groups anonymously',
    color: 'from-pink-400 to-red-600',
    inputPlaceholder: 'Enter membership secret...'
  },
  {
    type: 'balance' as ZKProofType,
    icon: CreditCard,
    title: 'Balance Proof',
    description: 'Prove sufficient balance without revealing amount',
    color: 'from-orange-400 to-yellow-600',
    inputPlaceholder: 'Enter your balance...'
  }
]

export const ZKProofGenerator: React.FC<ZKProofGeneratorProps> = ({ onProofGenerated }) => {
  const {
    generateProof,
    isGenerating,
    hasProof,
    currentProof,
    error,
    getProofComplexity,
    clearProof
  } = useZKProof()

  const [selectedType, setSelectedType] = useState<ZKProofType>('identity')
  const [secretInput, setSecretInput] = useState('')
  const [threshold, setThreshold] = useState('')

  const selectedProofType = proofTypes.find(p => p.type === selectedType)!
  const complexity = getProofComplexity(selectedType)

  const handleGenerateProof = async () => {
    if (!secretInput.trim()) return

    let proof
    
    switch (selectedType) {
      case 'identity':
        proof = await generateProof({ type: 'identity', secret: secretInput })
        break
      case 'reputation':
        proof = await generateProof({ type: 'reputation', secret: secretInput })
        break
      case 'membership':
        proof = await generateProof({ type: 'membership', secret: secretInput })
        break
      case 'balance':
        proof = await generateProof({ 
          type: 'balance', 
          secret: secretInput,
          publicSignals: threshold ? [threshold] : undefined
        })
        break
    }

    if (proof && onProofGenerated) {
      onProofGenerated(proof)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-white">ZK-SNARK Proof Generator</h2>
        <p className="text-gray-400">Generate zero-knowledge proofs for anonymous verification</p>
      </div>

      {/* Proof Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {proofTypes.map((proofType) => {
          const Icon = proofType.icon
          const isSelected = selectedType === proofType.type
          
          return (
            <motion.button
              key={proofType.type}
              onClick={() => setSelectedType(proofType.type)}
              className={`relative p-4 rounded-2xl border transition-all duration-300 text-left ${
                isSelected 
                  ? 'border-cyan-400/50 bg-cyan-400/10' 
                  : 'border-dark-600 bg-dark-800/50 hover:border-dark-500'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className={`absolute -inset-0.5 rounded-2xl blur opacity-20 transition ${
                isSelected ? `bg-gradient-to-r ${proofType.color}` : 'bg-transparent'
              }`} />
              
              <div className="relative">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                  isSelected 
                    ? `bg-gradient-to-br ${proofType.color}` 
                    : 'bg-dark-700'
                }`}>
                  <Icon className={isSelected ? 'text-dark-900' : 'text-gray-400'} size={20} />
                </div>
                
                <h3 className="text-white font-semibold text-sm mb-1">{proofType.title}</h3>
                <p className="text-gray-400 text-xs leading-relaxed">{proofType.description}</p>
              </div>
            </motion.button>
          )
        })}
      </div>

      {/* Selected Proof Details */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedType}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-dark-800/80 backdrop-blur-xl rounded-2xl p-6 border border-dark-700"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${selectedProofType.color}`}>
              <selectedProofType.icon className="text-dark-900" size={24} />
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">{selectedProofType.title}</h3>
              <p className="text-gray-400 text-sm">{selectedProofType.description}</p>
            </div>
          </div>

          {/* Complexity Info */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 bg-dark-700/50 rounded-xl">
              <Clock className="mx-auto text-cyan-400 mb-1" size={16} />
              <p className="text-xs text-gray-400">Generation Time</p>
              <p className="text-white font-semibold text-sm">{complexity.time}</p>
            </div>
            <div className="text-center p-3 bg-dark-700/50 rounded-xl">
              <Cpu className="mx-auto text-violet-400 mb-1" size={16} />
              <p className="text-xs text-gray-400">Constraints</p>
              <p className="text-white font-semibold text-sm">{complexity.constraints}</p>
            </div>
            <div className="text-center p-3 bg-dark-700/50 rounded-xl">
              <Shield className="mx-auto text-emerald-400 mb-1" size={16} />
              <p className="text-xs text-gray-400">Trust Level</p>
              <p className="text-white font-semibold text-sm">{complexity.trust}</p>
            </div>
          </div>

          {/* Input Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Secret Input
              </label>
              <input
                type="password"
                value={secretInput}
                onChange={(e) => setSecretInput(e.target.value)}
                placeholder={selectedProofType.inputPlaceholder}
                className="w-full bg-dark-700 border border-dark-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
              />
            </div>

            {selectedType === 'balance' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Minimum Threshold
                </label>
                <input
                  type="number"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  placeholder="Enter minimum balance threshold..."
                  className="w-full bg-dark-700 border border-dark-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
                />
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center space-x-2"
            >
              <AlertTriangle className="text-red-400" size={16} />
              <p className="text-red-400 text-sm">{error}</p>
            </motion.div>
          )}

          {/* Generate Button */}
          <div className="mt-6">
            <motion.button
              onClick={handleGenerateProof}
              disabled={!secretInput.trim() || isGenerating}
              className={`w-full py-4 rounded-xl font-semibold transition-all duration-300 ${
                !secretInput.trim() || isGenerating
                  ? 'bg-dark-700 text-gray-500 cursor-not-allowed'
                  : `bg-gradient-to-r ${selectedProofType.color} text-white hover:shadow-lg`
              }`}
              whileHover={!isGenerating ? { scale: 1.02 } : {}}
              whileTap={!isGenerating ? { scale: 0.98 } : {}}
            >
              {isGenerating ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Generating Proof...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <Zap size={20} />
                  <span>Generate ZK Proof</span>
                </div>
              )}
            </motion.button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Proof Result */}
      <AnimatePresence>
        {hasProof && currentProof && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-emerald-500/20 backdrop-blur-xl rounded-2xl p-6 border border-emerald-500/30"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                  <Check className="text-dark-900" size={20} />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Proof Generated Successfully!</h3>
                  <p className="text-emerald-400 text-sm">ZK-SNARK proof ready for verification</p>
                </div>
              </div>
              <button
                onClick={clearProof}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="bg-dark-800/50 rounded-xl p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Circuit ID</p>
                  <p className="text-white font-mono">{currentProof.circuitId}</p>
                </div>
                <div>
                  <p className="text-gray-400">Timestamp</p>
                  <p className="text-white font-mono">{new Date(currentProof.timestamp).toLocaleTimeString()}</p>
                </div>
                <div>
                  <p className="text-gray-400">Public Signals</p>
                  <p className="text-emerald-400 font-mono">{currentProof.publicSignals.length} signals</p>
                </div>
                <div>
                  <p className="text-gray-400">Proof Size</p>
                  <p className="text-emerald-400 font-mono">~2.5KB</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 