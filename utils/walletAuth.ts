import { 
  generateKeyPair, 
  sha256, 
  deriveKey, 
  encryptData, 
  decryptData, 
  randomBytes, 
  createWalletMessage as createMessage,
  verifyWalletSignature as verifySignature,
  generatePseudonym as genPseudonym,
  type EncryptedData
} from './cryptoUtils'

export interface UserProfile {
  walletAddress: string
  pseudonym: string
  encryptedData: string
  publicKey: string
  createdAt: string
  lastLogin: string
  reputation: number
  zkProofs: string[]
  // Profile customization fields
  displayName?: string
  bio?: string
  location?: string
  website?: string
  avatar?: string
  bannerColor?: string
  socialLinks?: {
    twitter?: string
    github?: string
    telegram?: string
    discord?: string
  }
  lastUpdated?: string
}

export interface WalletSignature {
  signature: string
  message: string
  address: string
}

// Global profiles storage that persists across instances
const globalProfiles: Map<string, UserProfile> = new Map()

export class SecureWalletAuth {
  private profiles: Map<string, UserProfile>
  private currentWalletAddress: string | null = null

  constructor() {
    // Always use fresh Map and load from localStorage
    this.profiles = new Map()
    console.log(`🚀 WalletAuth constructor called`)
    console.log(`📦 Profiles before load: ${this.profiles.size}`)
    this.loadProfiles()
    this.loadCurrentUser()
    console.log(`✅ WalletAuth initialized with ${this.profiles.size} profiles`)
  }

  // Derive encryption key from wallet signature
  private async deriveEncryptionKey(signature: string, salt: Uint8Array): Promise<CryptoKey> {
    return await deriveKey(signature, salt, 100000)
  }

  // Encrypt profile data
  private async encryptProfileData(data: any, key: CryptoKey): Promise<string> {
    const encrypted = await encryptData(JSON.stringify(data), key)
    return JSON.stringify(encrypted)
  }

  // Decrypt profile data
  private async decryptProfileData(encryptedDataStr: string, key: CryptoKey): Promise<any> {
    try {
      const encryptedData: EncryptedData = JSON.parse(encryptedDataStr)
      const decrypted = await decryptData(encryptedData, key)
      return JSON.parse(decrypted)
    } catch (error) {
      console.error('Decryption failed:', error)
      return null
    }
  }

  // Generate deterministic pseudonym from wallet
  private async generatePseudonym(walletAddress: string): Promise<string> {
    return await genPseudonym(walletAddress)
  }

  // Register new wallet (first-time setup)
  async registerWallet(walletSignature: WalletSignature, customPseudonym?: string): Promise<UserProfile> {
    const { address, signature, message } = walletSignature
    const normalizedAddress = address.toLowerCase()

    // Check if wallet already exists
    if (this.profiles.has(normalizedAddress)) {
      throw new Error('Wallet already registered. Use authenticateWallet instead.')
    }

    // Generate or use custom pseudonym
    const pseudonym = customPseudonym || await this.generatePseudonym(address)
    
    // Check pseudonym uniqueness
    const existingPseudonym = Array.from(this.profiles.values()).find(
      profile => profile.pseudonym === pseudonym
    )
    
    if (existingPseudonym) {
      throw new Error('Pseudonym already taken. Please choose another.')
    }

    // Generate salt and derive encryption key
    const salt = randomBytes(32)
    const encryptionKey = await this.deriveEncryptionKey(signature, salt)

    // Generate RSA keypair for this user
    const { publicKey, privateKey } = await generateKeyPair()

    // Sensitive data to encrypt
    const sensitiveData = {
      privateKey,
      salt: Array.from(salt), // Convert to array for JSON serialization
      walletSignature: signature,
      encryptionPreferences: {
        algorithm: 'AES-GCM',
        keyDerivation: 'PBKDF2',
        iterations: 100000
      }
    }

    // Create profile
    const profile: UserProfile = {
      walletAddress: normalizedAddress,
      pseudonym,
      encryptedData: await this.encryptProfileData(sensitiveData, encryptionKey),
      publicKey,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      reputation: 0,
      zkProofs: []
    }

    // Store profile
    this.profiles.set(normalizedAddress, profile)
    this.saveProfiles()

    // Set as current user
    this.setCurrentUser(normalizedAddress)

    console.log(`✅ Wallet registered: ${pseudonym} (${normalizedAddress.substring(0, 8)}...)`)
    
    return profile
  }

  // Authenticate existing wallet
  async authenticateWallet(walletSignature: WalletSignature): Promise<UserProfile | null> {
    const { address, signature, message } = walletSignature
    const normalizedAddress = address.toLowerCase()

    const profile = this.profiles.get(normalizedAddress)
    if (!profile) {
      return null // Wallet not registered
    }

    try {
      // Get the stored salt from encrypted data (we need to decrypt with a test)
      // For demo purposes, we'll try to decrypt with the signature directly
      const testSalt = randomBytes(32) // In production, salt would be stored separately or derived
      const encryptionKey = await this.deriveEncryptionKey(signature, testSalt)
      
      // For demo: just check if signature is valid format and update login
      if (!verifySignature(signature, message, address)) {
        throw new Error('Invalid signature')
      }

      // Update last login
      profile.lastLogin = new Date().toISOString()
      this.profiles.set(normalizedAddress, profile)
      this.saveProfiles()

      // Set as current user
      this.setCurrentUser(normalizedAddress)

      console.log(`✅ Wallet authenticated: ${profile.pseudonym} (${normalizedAddress.substring(0, 8)}...)`)
      
      return profile
    } catch (error) {
      console.error('Authentication failed:', error)
      return null
    }
  }

  // Get profile by wallet address
  getProfile(walletAddress: string): UserProfile | null {
    const normalizedAddress = walletAddress.toLowerCase()
    const profile = this.profiles.get(normalizedAddress) || null
    
    console.log(`🔍 getProfile(${normalizedAddress.substring(0, 8)}...) → ${profile ? profile.pseudonym : 'NOT FOUND'}`)
    console.log(`📊 Total profiles in memory: ${this.profiles.size}`)
    
    return profile
  }

  // Get all profiles (for admin)
  getAllProfiles(): UserProfile[] {
    return Array.from(this.profiles.values())
  }

  // Update profile
  async updateProfile(walletAddress: string, updates: Partial<UserProfile>): Promise<boolean> {
    const normalizedAddress = walletAddress.toLowerCase()
    const profile = this.profiles.get(normalizedAddress)
    
    if (!profile) {
      return false
    }

    // Update allowed fields
    const updatedProfile = {
      ...profile,
      ...updates,
      walletAddress: normalizedAddress, // Don't allow changing wallet address
      lastLogin: new Date().toISOString()
    }

    this.profiles.set(normalizedAddress, updatedProfile)
    this.saveProfiles()
    
    return true
  }

  // Add ZK proof to profile
  async addZKProof(walletAddress: string, proofData: any): Promise<boolean> {
    const profile = this.getProfile(walletAddress)
    if (!profile) {
      return false
    }

    const proofId = await sha256(JSON.stringify(proofData) + Date.now())
    profile.zkProofs.push(proofId)
    
    return await this.updateProfile(walletAddress, { zkProofs: profile.zkProofs })
  }

  // Delete profile (GDPR compliance)
  deleteProfile(walletAddress: string): boolean {
    const normalizedAddress = walletAddress.toLowerCase()
    const deleted = this.profiles.delete(normalizedAddress)
    
    if (deleted) {
      this.saveProfiles()
      console.log(`🗑️ Profile deleted: ${normalizedAddress.substring(0, 8)}...`)
    }
    
    return deleted
  }

  // Get reputation leaderboard
  getLeaderboard(limit: number = 10): UserProfile[] {
    return Array.from(this.profiles.values())
      .sort((a, b) => b.reputation - a.reputation)
      .slice(0, limit)
  }

  // Search profiles by pseudonym
  searchProfiles(query: string): UserProfile[] {
    const lowerQuery = query.toLowerCase()
    return Array.from(this.profiles.values()).filter(profile =>
      profile.pseudonym.toLowerCase().includes(lowerQuery)
    )
  }

  // Get profile statistics
  getStats(): {
    totalUsers: number
    activeToday: number
    averageReputation: number
    totalZKProofs: number
  } {
    const profiles = Array.from(this.profiles.values())
    const today = new Date().toDateString()
    
    return {
      totalUsers: profiles.length,
      activeToday: profiles.filter(p => new Date(p.lastLogin).toDateString() === today).length,
      averageReputation: profiles.reduce((sum, p) => sum + p.reputation, 0) / profiles.length || 0,
      totalZKProofs: profiles.reduce((sum, p) => sum + p.zkProofs.length, 0)
    }
  }

  // Current user management
  private loadCurrentUser(): void {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('circle_current_user')
        if (stored) {
          this.currentWalletAddress = stored
          console.log(`👤 Current user loaded: ${stored.substring(0, 8)}...`)
        }
      }
    } catch (error) {
      console.error('Failed to load current user:', error)
    }
  }

  private saveCurrentUser(): void {
    try {
      if (typeof window !== 'undefined') {
        if (this.currentWalletAddress) {
          localStorage.setItem('circle_current_user', this.currentWalletAddress)
        } else {
                      localStorage.removeItem('circle_current_user')
        }
      }
    } catch (error) {
      console.error('Failed to save current user:', error)
    }
  }

  setCurrentUser(walletAddress: string): void {
    this.currentWalletAddress = walletAddress.toLowerCase()
    this.saveCurrentUser()
  }

  getCurrentProfile(): UserProfile | null {
    if (!this.currentWalletAddress) {
      return null
    }
    return this.getProfile(this.currentWalletAddress)
  }

  logout(): void {
    this.currentWalletAddress = null
    this.saveCurrentUser()
    console.log('👋 User logged out')
  }

  // Create profile automatically like X/Twitter registration
  createProfile(walletAddress: string, pseudonym: string): UserProfile {
    const normalizedAddress = walletAddress.toLowerCase()
    
    // Check if profile already exists
    const existingProfile = this.getProfile(normalizedAddress)
    if (existingProfile) {
      return existingProfile
    }

    // Create new profile automatically (like X/Twitter registration)
    const newProfile: UserProfile = {
      walletAddress: normalizedAddress,
      pseudonym: pseudonym,
      encryptedData: 'auto_created_profile',
      publicKey: 'auto_generated_key',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      reputation: 0,
      zkProofs: [],
      displayName: pseudonym, // Default to pseudonym, user can change later
      bio: '', // Empty by default, user can customize
      location: '',
      website: '',
      avatar: `gradient-${Math.floor(Math.random() * 5) + 1}`,
      bannerColor: ['#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF6B6B'][Math.floor(Math.random() * 5)],
      socialLinks: {},
      lastUpdated: new Date().toISOString()
    }

    this.profiles.set(normalizedAddress, newProfile)
    this.saveProfiles()
    
    console.log(`✅ Profile created: ${pseudonym}`)
    return newProfile
  }

  // Connect wallet and create profile if needed (like X/Twitter login/signup)
  connectWallet(walletAddress: string, pseudonym: string): UserProfile {
    const normalizedAddress = walletAddress.toLowerCase()
    
    // Try to get existing profile
    let profile = this.getProfile(normalizedAddress)
    
    if (!profile) {
      // Auto-create profile if doesn't exist (new user registration)
      profile = this.createProfile(normalizedAddress, pseudonym)
      console.log(`🎉 Welcome to Circle! Profile created for ${pseudonym}`)
    } else {
      // Update last login for existing user
      profile.lastLogin = new Date().toISOString()
      this.profiles.set(normalizedAddress, profile)
      this.saveProfiles()
      console.log(`👋 Welcome back, ${profile.pseudonym}!`)
    }
    
    // Set as current user
    this.setCurrentUser(normalizedAddress)
    
    return profile
  }

  // Ensure demo profile exists for testing
  ensureDemoProfile(): UserProfile {
    const demoAddress = '0x1234567890123456789012345678901234567890'
    const profile = this.connectWallet(demoAddress, 'anus')
    return profile
  }

  // Load profiles from localStorage
  private loadProfiles(): void {
    try {
      if (typeof window !== 'undefined') {
        console.log(`🔍 Loading profiles from localStorage...`)
        const stored = localStorage.getItem('circle_profiles')
        console.log(`📄 localStorage content:`, stored ? 'Found data' : 'No data')
        
        if (stored) {
          const profilesArray = JSON.parse(stored)
          console.log(`📋 Parsed profiles array:`, profilesArray.length)
          // Don't replace the reference, populate the existing Map
          this.profiles.clear()
          profilesArray.forEach(([key, value]: [string, UserProfile]) => {
            this.profiles.set(key, value)
          })
          console.log(`📁 Loaded ${this.profiles.size} profiles from storage`)
        } else {
          console.log(`📭 No profiles found in localStorage`)
        }
        // If no stored profiles, profiles Map is already initialized as globalProfiles
      } else {
        console.log(`🚫 Window not available - server side`)
      }
    } catch (error) {
      console.error('❌ Failed to load profiles:', error)
      this.profiles.clear() // Clear on error but keep reference
    }
  }

  // Save profiles to localStorage
  private saveProfiles(): void {
    try {
      console.log(`💾 Attempting to save ${this.profiles.size} profiles...`)
      if (typeof window !== 'undefined') {
        const profilesArray = Array.from(this.profiles.entries())
        console.log(`🗂️ Profiles array to save:`, profilesArray.length)
        localStorage.setItem('circle_profiles', JSON.stringify(profilesArray))
        console.log(`✅ Successfully saved ${this.profiles.size} profiles to localStorage`)
        
        // Verify save
        const verification = localStorage.getItem('circle_profiles')
        console.log(`🔍 Verification - data in localStorage:`, verification ? 'Confirmed' : 'NOT FOUND!')
      } else {
        console.log(`🚫 Cannot save - window not available (server side)`)
      }
    } catch (error) {
      console.error('❌ Failed to save profiles:', error)
    }
  }

  // Generate deterministic avatar from wallet
  async generateAvatar(walletAddress: string): Promise<string> {
    const hash = await sha256(walletAddress.toLowerCase())
    
    // Use wallet hash to generate consistent avatar
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ]
    
    const colorIndex = parseInt(hash.substring(0, 8), 16) % colors.length
    const pattern = parseInt(hash.substring(8, 16), 16) % 10
    
    return `https://api.dicebear.com/7.x/shapes/svg?seed=${hash}&backgroundColor=${colors[colorIndex].substring(1)}&shape=${pattern}`
  }
}

// Export new instance (loads fresh from localStorage each time)
export const walletAuth = new SecureWalletAuth()

// Utility functions for wallet connection
export const createWalletMessage = (address: string, timestamp: number = Date.now()): string => {
  return createMessage(address, timestamp)
}

export const verifyWalletSignature = (signature: string, message: string, address: string): boolean => {
  return verifySignature(signature, message, address)
} 