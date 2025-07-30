import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Wallet, 
  User, 
  Check, 
  ArrowRight,
  Shield,
  Eye,
  EyeOff,
  Copy,
  ExternalLink
} from 'lucide-react'
import { walletAuth } from '../utils/walletAuth'

interface WalletConnectProps {
  onProfileCreated?: (profile: any) => void
  className?: string
}

export const WalletConnect: React.FC<WalletConnectProps> = ({ 
  onProfileCreated, 
  className = '' 
}) => {
  const [step, setStep] = useState<'connect' | 'register' | 'success'>('connect')
  const [walletAddress, setWalletAddress] = useState('')
  const [pseudonym, setPseudonym] = useState('')
  const [showAddress, setShowAddress] = useState(false)
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<any>(null)

  // Generate random pseudonym suggestion
  const generatePseudonym = () => {
    const prefixes = ['Stealth', 'Crypto', 'Anonymous', 'Shadow', 'Ghost', 'Phantom', 'Digital', 'Cyber']
    const suffixes = ['User', 'Builder', 'Trader', 'Advocate', 'Pioneer', 'Rebel', 'Agent', 'Phantom']
    const numbers = Math.floor(Math.random() * 9999) + 1000
    
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)]
    
    return `${prefix}${suffix}${numbers}`
  }

  // Simulate wallet connection
  const connectWallet = async () => {
    setLoading(true)
    
    try {
      // Simulate wallet connection delay
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Generate demo wallet address
      const demoAddress = `0x${Math.random().toString(16).substr(2, 40)}`
      setWalletAddress(demoAddress)
      
      // Check if user already exists
      const existingProfile = walletAuth.getProfile(demoAddress)
      
      if (existingProfile) {
        // Existing user - auto login
        walletAuth.setCurrentUser(demoAddress)
        setProfile(existingProfile)
        setStep('success')
        onProfileCreated?.(existingProfile)
      } else {
        // New user - go to registration
        setPseudonym(generatePseudonym())
        setStep('register')
      }
    } catch (error) {
      console.error('Wallet connection failed:', error)
    }
    
    setLoading(false)
  }

  // Create profile automatically
  const createProfile = async () => {
    if (!pseudonym.trim() || !walletAddress) return
    
    setLoading(true)
    
    try {
      // Create profile like X/Twitter registration
      const newProfile = walletAuth.connectWallet(walletAddress, pseudonym.trim())
      setProfile(newProfile)
      setStep('success')
      onProfileCreated?.(newProfile)
    } catch (error) {
      console.error('Profile creation failed:', error)
    }
    
    setLoading(false)
  }

  const copyAddress = () => {
    navigator.clipboard.writeText(walletAddress)
  }

  const truncateAddress = (address: string) => {
    if (!address) return ''
    return `${address.substring(0, 8)}...${address.substring(address.length - 4)}`
  }

  return (
    <div className={`${className}`}>
      <motion.div
        className="bg-dark-800 border border-dark-700 rounded-2xl p-8 max-w-md mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Step 1: Connect Wallet */}
        {step === 'connect' && (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-gradient-to-r from-crypto-blue to-purple-600 rounded-2xl flex items-center justify-center mx-auto">
              <Wallet size={32} className="text-white" />
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Connect to Circle</h2>
              <p className="text-dark-400">
                Connect your wallet to join the Circle network
              </p>
            </div>

            <div className="space-y-3 text-left">
              <div className="flex items-center space-x-3 text-sm text-dark-300">
                <Shield size={16} className="text-green-400" />
                <span>End-to-end encrypted messaging</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-dark-300">
                <User size={16} className="text-blue-400" />
                <span>Anonymous pseudonym identity</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-dark-300">
                <Check size={16} className="text-purple-400" />
                <span>Zero tracking, maximum privacy</span>
              </div>
            </div>

            <button
              onClick={connectWallet}
              disabled={loading}
              className="w-full bg-crypto-blue hover:bg-crypto-blue/90 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Wallet size={20} />
                  <span>Connect Wallet</span>
                </>
              )}
            </button>

            <p className="text-xs text-dark-500 text-center">
              Demo mode - no real wallet required
            </p>
          </div>
        )}

        {/* Step 2: Register Profile */}
        {step === 'register' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <User size={32} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Create Your Profile</h2>
              <p className="text-dark-400">
                Choose your anonymous identity on Circle
              </p>
            </div>

            {/* Wallet Address Display */}
            <div className="bg-dark-700 rounded-xl p-4">
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Connected Wallet
              </label>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowAddress(!showAddress)}
                    className="p-1 text-dark-400 hover:text-white transition-colors"
                  >
                    {showAddress ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <span className="font-mono text-sm text-white">
                    {showAddress ? walletAddress : truncateAddress(walletAddress)}
                  </span>
                </div>
                <button
                  onClick={copyAddress}
                  className="p-1 text-dark-400 hover:text-white transition-colors"
                  title="Copy address"
                >
                  <Copy size={16} />
                </button>
              </div>
            </div>

            {/* Pseudonym Input */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Choose Your Pseudonym
              </label>
              <div className="space-y-2">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400">@</span>
                  <input
                    type="text"
                    value={pseudonym}
                    onChange={(e) => setPseudonym(e.target.value)}
                    placeholder="Enter pseudonym"
                    className="w-full bg-dark-700 border border-dark-600 text-white pl-8 pr-4 py-3 rounded-xl focus:outline-none focus:border-crypto-blue transition-colors"
                    maxLength={20}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => setPseudonym(generatePseudonym())}
                    className="text-crypto-blue text-sm hover:underline"
                  >
                    Generate Random
                  </button>
                  <span className="text-xs text-dark-500">
                    {pseudonym.length}/20
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={createProfile}
                disabled={!pseudonym.trim() || loading}
                className="w-full bg-crypto-blue hover:bg-crypto-blue/90 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Create Profile</span>
                    <ArrowRight size={20} />
                  </>
                )}
              </button>

              <button
                onClick={() => setStep('connect')}
                className="w-full text-dark-400 hover:text-white py-2 transition-colors"
              >
                Back to Wallet Selection
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 'success' && profile && (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
              <Check size={32} className="text-white" />
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Welcome to Circle!</h2>
              <p className="text-dark-400">
                Your profile has been created successfully
              </p>
            </div>

            {/* Profile Preview */}
            <div className="bg-dark-700 rounded-xl p-4 text-left">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-r from-crypto-blue to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {profile.pseudonym[0].toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-white">{profile.displayName}</p>
                  <p className="text-sm text-dark-400">@{profile.pseudonym}</p>
                  <p className="text-xs text-dark-500 font-mono">
                    {truncateAddress(profile.walletAddress)}
                  </p>
                </div>
              </div>
              <p className="text-sm text-dark-300 border-t border-dark-600 pt-3">
                🎉 Ready to post, message, and explore the Circle network!
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-crypto-blue hover:bg-crypto-blue/90 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
              >
                Enter Circle
              </button>
              
              <div className="flex items-center justify-center space-x-4 text-sm">
                <a
                  href="#"
                  className="text-crypto-blue hover:underline flex items-center space-x-1"
                >
                  <ExternalLink size={14} />
                  <span>Learn More</span>
                </a>
                <span className="text-dark-500">•</span>
                <a
                  href="#"
                  className="text-crypto-blue hover:underline"
                >
                  Privacy Policy
                </a>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
} 