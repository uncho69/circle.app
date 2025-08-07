import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { X, User, Check, AlertCircle } from 'lucide-react'

interface OnboardingModalProps {
  isOpen: boolean
  onClose: () => void
  walletAddress: string
  onComplete: (pseudonym: string, displayName: string) => void
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  walletAddress,
  onComplete
}) => {
  const [pseudonym, setPseudonym] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [isCheckingPseudonym, setIsCheckingPseudonym] = useState(false)
  const [pseudonymAvailable, setPseudonymAvailable] = useState<boolean | null>(null)

  const checkPseudonymAvailability = async (value: string) => {
    if (value.length < 3) {
      setPseudonymAvailable(null)
      return
    }

    setIsCheckingPseudonym(true)
    try {
      const response = await fetch(`/api/users/get?pseudonym=${value}`)
      const result = await response.json()
      setPseudonymAvailable(!result.success) // Available if user not found
    } catch (error) {
      setPseudonymAvailable(null)
    } finally {
      setIsCheckingPseudonym(false)
    }
  }

  const handlePseudonymChange = (value: string) => {
    const cleanValue = value.toLowerCase().replace(/[^a-z0-9_]/g, '')
    setPseudonym(cleanValue)
    setError('')
    
    if (cleanValue.length >= 3) {
      checkPseudonymAvailability(cleanValue)
    } else {
      setPseudonymAvailable(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!pseudonym || !displayName) {
      setError('Please fill in all fields')
      return
    }

    if (pseudonym.length < 3) {
      setError('Pseudonym must be at least 3 characters')
      return
    }

    if (pseudonymAvailable === false) {
      setError('Pseudonym is already taken')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: walletAddress,
          pseudonym,
          display_name: displayName
        })
      })

      const result = await response.json()
      
      if (result.success) {
        onComplete(pseudonym, displayName)
        onClose()
      } else {
        setError(result.error || 'Failed to create profile')
      }
    } catch (error) {
      setError('Failed to create profile')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-dark-800 border border-dark-700 rounded-2xl p-6 w-full max-w-md"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-crypto-blue to-purple-600 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Welcome to Circle</h2>
              <p className="text-dark-400 text-sm">Complete your profile</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-dark-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Pseudonym */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Username *
            </label>
            <div className="relative">
              <input
                type="text"
                value={pseudonym}
                onChange={(e) => handlePseudonymChange(e.target.value)}
                placeholder="Choose your username"
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-3 text-white placeholder-dark-400 focus:outline-none focus:border-crypto-blue"
                maxLength={20}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {isCheckingPseudonym && (
                  <div className="w-4 h-4 border-2 border-crypto-blue border-t-transparent rounded-full animate-spin" />
                )}
                {pseudonymAvailable === true && (
                  <Check className="w-4 h-4 text-green-400" />
                )}
                {pseudonymAvailable === false && (
                  <AlertCircle className="w-4 h-4 text-red-400" />
                )}
              </div>
            </div>
            <p className="text-xs text-dark-400 mt-1">
              Letters, numbers, and underscores only. 3-20 characters.
            </p>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Display Name *
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="How should we call you?"
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-3 text-white placeholder-dark-400 focus:outline-none focus:border-crypto-blue"
              maxLength={50}
            />
            <p className="text-xs text-dark-400 mt-1">
              This is how others will see you. 1-50 characters.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-900 bg-opacity-20 border border-red-700 rounded-lg p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !pseudonym || !displayName || pseudonymAvailable === false}
            className="w-full bg-crypto-blue text-white py-3 px-4 rounded-lg font-medium hover:bg-crypto-blue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating Profile...' : 'Create Profile'}
          </button>
        </form>

        {/* Wallet Info */}
        <div className="mt-4 p-3 bg-dark-700 rounded-lg">
          <p className="text-xs text-dark-400">
            Connected wallet: {walletAddress.substring(0, 6)}...{walletAddress.substring(-4)}
          </p>
        </div>
      </motion.div>
    </div>
  )
} 