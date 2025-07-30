import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { ArrowRight, Check, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { walletAuth, createWalletMessage, UserProfile, WalletSignature } from '../utils/walletAuth'

// Extend Window interface for MetaMask
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>
      isMetaMask?: boolean
    }
  }
}

export default function AuthPage() {
  const [mounted, setMounted] = useState(false)
  const [step, setStep] = useState(0) // 0: welcome, 1: connecting, 2: entering the circle, 3: success
  const [walletAddress, setWalletAddress] = useState('')
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [customPseudonym, setCustomPseudonym] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')
  const [isExistingUser, setIsExistingUser] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  // Real wallet connection with MetaMask
  const handleConnectWallet = async () => {
    setIsProcessing(true)
    setError('')
    setStep(1)

    try {
      // Check if MetaMask is installed
      if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask not detected. Please install MetaMask to continue.')
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      })

      if (!accounts || accounts.length === 0) {
        throw new Error('No wallet accounts found. Please unlock your wallet.')
      }

      const address = accounts[0]
      setWalletAddress(address)

      // Check if this wallet is already registered
      const existingProfile = walletAuth.getProfile(address)
      console.log(`🔍 Checking wallet ${address.substring(0, 8)}... - Existing profile:`, existingProfile)
      
      if (existingProfile) {
        // Existing user - authenticate with signature and redirect IMMEDIATELY
        console.log(`👤 Existing user found: ${existingProfile.pseudonym}`)
        const message = createWalletMessage(address)
        const signature = await window.ethereum.request({
          method: 'personal_sign',
          params: [message, address]
        })

        const walletSignature: WalletSignature = {
          signature,
          message,
          address
        }

        const authenticatedProfile = await walletAuth.authenticateWallet(walletSignature)
        console.log(`🔐 Authentication result:`, authenticatedProfile)
        
        if (authenticatedProfile) {
              // Set current user and show entering the circle screen
    walletAuth.setCurrentUser(address)
    console.log(`✅ Existing user authenticated: ${authenticatedProfile.pseudonym} - Entering the Circle...`)
          
          // Ensure profile exists in database (sync from localStorage)
          try {
            const response = await fetch('/api/users/sync', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                walletAddress: address,
                pseudonym: authenticatedProfile.pseudonym,
                displayName: authenticatedProfile.displayName || authenticatedProfile.pseudonym,
                bio: authenticatedProfile.bio || '',
                location: authenticatedProfile.location || '',
                website: authenticatedProfile.website || '',
                avatar: authenticatedProfile.avatar || '',
                bannerColor: authenticatedProfile.bannerColor || '#1DA1F2',
                socialLinks: authenticatedProfile.socialLinks || {}
              })
            })

            if (response.ok) {
              console.log('✅ Profile synced to database')
            } else {
              console.warn('Profile sync failed, but continuing...')
            }
          } catch (syncError) {
            console.warn('Profile sync failed:', syncError)
            // Continue anyway
          }
          
          // Show entering network screen
          setStep(2)
          
          // Redirect after network entry animation
          setTimeout(() => {
            window.location.href = '/app'
          }, 3000)
          return
        } else {
          throw new Error('Failed to authenticate wallet.')
        }
      } else {
        // New user - proceed with registration
        console.log(`🆕 New user - starting registration flow`)
        setIsExistingUser(false)
        const suggestedPseudonym = generateSuggestedPseudonym(address)
        setCustomPseudonym(suggestedPseudonym)
        setStep(3)
      }

    } catch (error: any) {
      console.error('Wallet connection failed:', error)
      setError(error.message || 'Failed to connect wallet')
      setStep(0)
    } finally {
      setIsProcessing(false)
    }
  }

  // Complete registration for new users
  const handleCreateProfile = async () => {
    if (!walletAddress || customPseudonym.trim().length === 0) return

    setIsProcessing(true)
    setError('')

    try {
      // Check if MetaMask is still available
      if (typeof window.ethereum === 'undefined') {
        throw new Error('No Ethereum wallet detected')
      }

      // Sign message for registration
      const message = createWalletMessage(walletAddress)
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, walletAddress]
      })

      const walletSignature: WalletSignature = {
        signature,
        message,
        address: walletAddress
      }

      // Register new wallet in localStorage (for client-side persistence)
      console.log(`📝 Registering new wallet with pseudonym: ${customPseudonym.trim()}`)
      const newProfile = await walletAuth.registerWallet(walletSignature, customPseudonym.trim())
      
      // Also create profile in database
      try {
        const response = await fetch('/api/profile/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            walletAddress: walletAddress,
            pseudonym: customPseudonym.trim(),
            displayName: customPseudonym.trim(),
            bio: '',
            location: '',
            website: '',
            avatar: '',
            bannerColor: '#1DA1F2',
            socialLinks: {}
          })
        })

        if (!response.ok) {
          const errorData = await response.json()
          console.warn('Database profile creation failed:', errorData)
          // Continue anyway since localStorage profile was created
        } else {
          console.log('✅ Profile created in database successfully')
        }
      } catch (dbError) {
        console.warn('Database profile creation failed:', dbError)
        // Continue anyway since localStorage profile was created
      }
      
      console.log(`✅ Registration successful:`, newProfile)
      setUserProfile(newProfile)
      setIsExistingUser(true)
      
      // Show entering network screen
      console.log(`🚀 New user registered: ${newProfile.pseudonym} - entering network`)
      setStep(2)
      
      // Redirect after network entry animation
      setTimeout(() => {
        window.location.href = '/app'
      }, 3000)

    } catch (error: any) {
      console.error('Registration failed:', error)
      setError(error.message || 'Failed to create profile')
    } finally {
      setIsProcessing(false)
    }
  }

  // Generate suggested pseudonym from wallet
  const generateSuggestedPseudonym = (address: string): string => {
    const hash = address.toLowerCase()
    const adjectives = ['Anon', 'Crypto', 'Digital', 'Stealth', 'Zero']
    const nouns = ['Trader', 'Builder', 'Pioneer', 'Agent', 'User']
    
    const adjIndex = parseInt(hash.substring(2, 4), 16) % adjectives.length
    const nounIndex = parseInt(hash.substring(4, 6), 16) % nouns.length
    const number = parseInt(hash.substring(38, 42), 16) % 9999
    
    return `${adjectives[adjIndex]}${nouns[nounIndex]}${number.toString().padStart(4, '0')}`
  }

  return (
    <div className="min-h-screen bg-black relative">
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)
          `,
          backgroundSize: '100px 100px'
        }} />
      </div>
      
      {/* Digital rain effect for step 2 */}
      {step === 2 && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Scanning line */}
          <motion.div
            className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
            initial={{ y: 0 }}
            animate={{ y: window.innerHeight }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
          
          {/* Digital rain */}
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-cyan-400/20 font-mono text-xs"
              initial={{ 
                y: -100, 
                x: Math.random() * window.innerWidth,
                opacity: 0 
              }}
              animate={{ 
                y: window.innerHeight + 100,
                opacity: [0, 1, 0]
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                delay: Math.random() * 2,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              {Math.random().toString(36).substring(2, 8)}
            </motion.div>
          ))}
        </div>
      )}



      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-8 py-20">
        
        {/* CIRCLE Title - Simple font come landing */}
        <motion.div
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extralight text-cyan-400 tracking-wider">
            CIRCLE
          </h1>
        </motion.div>

        {/* Step 0: Welcome */}
        {step === 0 && (
          <motion.div
            className="text-center max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl md:text-5xl font-extralight text-white mb-8 tracking-tight">
              Secure Access
            </h1>
            
            <p className="text-xl text-gray-400 font-light mb-12 leading-relaxed">
              Connect your crypto wallet for anonymous authentication.
              <br/>No personal data required.
            </p>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-light"
              >
                <AlertTriangle className="inline mr-2" size={16} />
                {error}
              </motion.div>
            )}

            <button
              onClick={handleConnectWallet}
              disabled={isProcessing}
              className="group relative bg-white text-black px-12 py-4 font-light text-lg tracking-wide hover:bg-gray-100 transition-all duration-500 ease-out overflow-hidden disabled:opacity-50"
            >
              <span className="relative z-10 flex items-center justify-center space-x-3">
                <span>{isProcessing ? 'Connecting...' : 'Connect Wallet'}</span>
                {!isProcessing && (
                  <ArrowRight 
                    className="transition-transform duration-500 group-hover:translate-x-2" 
                    size={20} 
                  />
                )}
              </span>
              <div className="absolute inset-0 bg-gray-200 transform translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
            </button>

            <p className="text-gray-600 text-sm font-light mt-8">
              Any Ethereum wallet • Zero personal data collected
            </p>
          </motion.div>
        )}

        {/* Step 1: Connecting */}
        {step === 1 && (
          <motion.div
            className="text-center max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="animate-pulse">
              <div className="w-16 h-16 border-2 border-gray-700 border-t-white rounded-full animate-spin mx-auto mb-8"></div>
            </div>
            
            <h2 className="text-3xl font-light text-white mb-4">Entering the Circle</h2>
            <p className="text-gray-400 font-light">Please confirm the transaction in your wallet...</p>
          </motion.div>
        )}

        {/* Step 2: Entering the Circle */}
        {step === 2 && (
          <motion.div
            className="text-center max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="space-y-8">
              {/* Animated Circle entry */}
              <div className="relative">
                <div className="w-24 h-24 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-8"></div>
                <div className="absolute inset-0 w-24 h-24 border-2 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin mx-auto" style={{ animationDelay: '0.5s', animationDirection: 'reverse' }}></div>
              </div>
              
              <div className="space-y-4">
                <motion.h2 
                  className="text-3xl font-light text-white relative"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <span className="relative z-10">Entering the Circle</span>
                  <motion.div
                    className="absolute inset-0 bg-cyan-400/20"
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                  />
                </motion.h2>
                
                <motion.div 
                  className="space-y-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <p className="text-cyan-400 font-light">Connecting to Tor...</p>
                  <div className="w-32 h-1 bg-gray-800 mx-auto rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-cyan-400 to-blue-500"
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 2, delay: 0.8 }}
                    />
                  </div>
                </motion.div>
                
                <motion.div 
                  className="space-y-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}
                >
                  <p className="text-cyan-400 font-light">Establishing secure connection...</p>
                  <div className="w-32 h-1 bg-gray-800 mx-auto rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-cyan-400 to-blue-500"
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 1.5, delay: 1.4 }}
                    />
                  </div>
                </motion.div>
                
                <motion.div 
                  className="space-y-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.8 }}
                >
                  <p className="text-cyan-400 font-light">Initializing Circle...</p>
                  <div className="w-32 h-1 bg-gray-800 mx-auto rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-cyan-400 to-blue-500"
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 1, delay: 2.0 }}
                    />
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 3: New User Profile Setup */}
        {step === 3 && (
          <motion.div
            className="text-center max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Only show this for NEW users */}
            <div>
              <h2 className="text-3xl font-light text-white mb-4">Choose Your Identity</h2>
              <p className="text-gray-400 font-light mb-8">
                  Select an anonymous pseudonym for the Circle
                </p>

                {walletAddress && (
                  <div className="mb-8 p-4 bg-gray-900/50 font-mono text-sm text-gray-400">
                    {`${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`}
                  </div>
                )}

                <div className="mb-8">
                  <input
                    type="text"
                    value={customPseudonym}
                    onChange={(e) => setCustomPseudonym(e.target.value)}
                    placeholder="Enter pseudonym..."
                    className="w-full bg-transparent border-b border-gray-700 text-white text-xl font-light py-4 px-0 focus:outline-none focus:border-white transition-colors text-center"
                    maxLength={20}
                    disabled={isProcessing || isExistingUser}
                  />
                  <p className="text-gray-600 text-sm mt-2">{customPseudonym.length}/20 characters</p>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-light"
                  >
                    <AlertTriangle className="inline mr-2" size={16} />
                    {error}
                  </motion.div>
                )}

                <button
                  onClick={handleCreateProfile}
                  disabled={customPseudonym.trim().length === 0 || isProcessing}
                  className="group relative bg-white text-black px-12 py-4 font-light text-lg tracking-wide hover:bg-gray-100 transition-all duration-500 ease-out overflow-hidden disabled:opacity-50"
                >
                  <span className="relative z-10 flex items-center justify-center space-x-3">
                    <span>{isProcessing ? 'Creating Profile...' : 'Enter the Circle'}</span>
                    {!isProcessing && (
                      <ArrowRight 
                        className="transition-transform duration-500 group-hover:translate-x-2" 
                        size={20} 
                      />
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gray-200 transform translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                </button>
              </div>
            </motion.div>
        )}

        {/* Back to landing link */}
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
        >
          <Link href="/" className="text-gray-600 hover:text-gray-400 transition-colors font-light text-sm">
            ← Back to Home
          </Link>
        </motion.div>
      </div>
    </div>
  )
} 