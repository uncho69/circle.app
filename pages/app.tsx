import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { Home, MessageCircle, CreditCard, Users, Settings, Search, Plus, Lock, ShoppingBag } from 'lucide-react'
import { TorStatus } from '../components/TorStatus'
import { ZKProofGenerator } from '../components/ZKProofGenerator'
import { KillswitchControls } from '../components/KillswitchControls'
import { CreatePost } from '../components/CreatePost'
import { CreatePostModal } from '../components/CreatePostModal'
import { HomeFeed } from '../components/HomeFeed'
import { ProfilePage } from '../components/ProfilePage'
import { EditProfile } from '../components/EditProfile'
import { WalletStats } from '../components/WalletStats'
import { XMTPChat } from '../components/XMTPChat'
import { LitEncryption } from '../components/LitEncryption'
import { NotificationSystem } from '../components/NotificationSystem'
import { PrivateGroups } from '../components/PrivateGroups'
import { TorIndicator } from '../components/TorIndicator'
import { WalletIndicator } from '../components/WalletIndicator'
import { Marketplace } from '../components/Marketplace'
import { walletAuth } from '../utils/walletAuth'
import { useTor } from '../hooks/useTor'

export default function AppPage() {
  const [activeTab, setActiveTab] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [profileView, setProfileView] = useState<'profile' | 'edit'>('profile')
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const [viewingProfile, setViewingProfile] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)

  // Initialize Tor connection
  const { connect: connectTor, status: torStatus } = useTor()

  // Search functionality
  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    
    if (query.trim().length < 2) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
      const result = await response.json()
      
      if (result.success) {
        setSearchResults(result.results)
        setShowSearchResults(true)
      }
    } catch (error) {
      console.error('Search error:', error)
    }
  }

  const handleSearchResultClick = (result: any) => {
    if (result.type === 'user') {
      setViewingProfile(result.pseudonym)
      setActiveTab(3) // Profile tab
    } else if (result.type === 'post') {
      // Scroll to post or open in modal
      console.log('Post clicked:', result.id)
    }
    setShowSearchResults(false)
    setSearchQuery('')
  }

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.search-container')) {
        setShowSearchResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    setMounted(true)
    
    // Create demo profile in localStorage on client-side for persistence
    try {
      walletAuth.ensureDemoProfile()
      console.log('✅ Demo profile ensured in localStorage')
    } catch (error) {
      console.error('❌ Failed to create demo profile:', error)
    }
    
    // Initialize Tor connection immediately when user enters the network
    const initializeTor = async () => {
      console.log('🔗 FORCING Tor connection on app startup...')
      try {
        // Force immediate connection using the unified Tor system
        await connectTor()
        console.log('✅ Tor connection FORCED successfully on app startup')
      } catch (error) {
        console.error('❌ Failed to initialize Tor:', error)
      }
    }

    // Initialize Tor immediately, don't wait
    console.log('🚀 Starting Tor initialization...')
    initializeTor()
    
    // Initialize killswitch (just logs that it's ready)
    if (typeof window !== 'undefined') {
      console.log('🎯 Circle Killswitch initialized and ready')
      console.log('🔑 Emergency shortcuts: Ctrl+Shift+X (Nuclear) • Ctrl+Shift+L (Hard) • Esc×3 (Panic)')
    }

    // Keyboard shortcut to open create post modal
    const handleKeyboard = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        setIsCreatePostModalOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyboard)
    return () => window.removeEventListener('keydown', handleKeyboard)
  }, [connectTor])

  if (!mounted) return null

  const handleUserClick = (pseudonym: string) => {
    setViewingProfile(pseudonym)
    setActiveTab(3) // Switch to Profile tab
    setProfileView('profile')
  }

  const tabs = [
    { icon: Home, label: 'Home' },
    { icon: MessageCircle, label: 'Messages' },
    { icon: CreditCard, label: 'Wallet' },
    { icon: Users, label: 'Profile' },
    { icon: Users, label: 'Circles' },
    { icon: Lock, label: 'Encryption' },
    { icon: ShoppingBag, label: 'Marketplace' },
    { icon: Settings, label: 'Settings' }
  ]



  return (
    <div className="min-h-screen bg-dark-900">
      {/* Header */}
      <header className="bg-dark-800 border-b border-dark-700 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center" style={{ minWidth: '16rem', paddingLeft: '2.5rem' }}>
            <Image
              src="/logocircle.png"
              alt="Circle Logo"
              width={500}
              height={150}
              className="h-24 w-auto"
              priority
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <WalletIndicator />
            <TorIndicator isConnected={torStatus.connected} isLoading={false} />
            <NotificationSystem />
            <div className="relative search-container">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400" size={20} />
              <input
                type="text"
                placeholder="Search crypto posts..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => searchQuery.trim().length >= 2 && setShowSearchResults(true)}
                className="bg-dark-700 border border-dark-600 rounded-full pl-10 pr-4 py-2 text-white placeholder-dark-400 focus:outline-none focus:border-crypto-blue"
              />
              
              {/* Search Results Dropdown */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-dark-800 border border-dark-700 rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto">
                  {searchResults.map((result, index) => (
                    <button
                      key={index}
                      onClick={() => handleSearchResultClick(result)}
                      className="w-full p-4 text-left hover:bg-dark-700 transition-colors border-b border-dark-700 last:border-b-0"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-crypto-blue to-crypto-purple rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-semibold">
                            {result.type === 'user' ? result.pseudonym.charAt(0).toUpperCase() : '#'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-white font-medium">
                            {result.type === 'user' ? result.pseudonym : 'Post'}
                          </div>
                          <div className="text-dark-400 text-sm truncate">
                            {result.type === 'user' ? result.displayName : result.content}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto flex">
        {/* Sidebar */}
        <aside className="w-64 p-6">
          <div className="space-y-2">
            {tabs.map((tab, index) => {
              const Icon = tab.icon
              return (
                <button
                  key={index}
                  onClick={() => setActiveTab(index)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                    activeTab === index
                      ? 'bg-crypto-blue text-white'
                      : 'text-dark-400 hover:text-white hover:bg-dark-800'
                  }`}
                >
                  <Icon size={24} />
                  <span className="font-medium">{tab.label}</span>
                </button>
              )
            })}
          </div>

          {/* Tor Status moved to Settings */}

          {/* Create Post Button */}
          <button 
            onClick={() => setIsCreatePostModalOpen(true)}
            className="w-full mt-6 bg-crypto-blue hover:bg-crypto-blue/90 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center space-x-2"
          >
            <Plus size={20} />
            <span>Create Post</span>
          </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {activeTab === 0 && (
            <div className="space-y-8">
              {/* Create Post Section */}
              <CreatePost 
                onPostCreated={(post) => {
                  console.log('🎉 New post created:', post)
                  // Trigger home feed refresh
                  setRefreshTrigger(prev => prev + 1)
                }}
                className="mb-8"
              />
              
              {/* Home Feed */}
              <HomeFeed key={refreshTrigger} />
            </div>
          )}

          {activeTab === 1 && (
            <XMTPChat currentUserAddress={currentUser || '0x1234567890123456789012345678901234567890'} />
          )}

          {activeTab === 2 && (
            <WalletStats className="space-y-6" />
          )}

          {activeTab === 3 && (
            <div>
              {profileView === 'profile' && (
                <ProfilePage
                  pseudonym={viewingProfile || currentUser || 'anus'}
                  currentUser={currentUser || 'anus'}
                  onBack={viewingProfile ? () => setViewingProfile(null) : undefined}
                  onEditProfile={viewingProfile === null || viewingProfile === currentUser ? () => setProfileView('edit') : undefined}
                />
              )}
              
              {profileView === 'edit' && !viewingProfile && currentUser && (
                <EditProfile
                  onSave={() => {
                    setProfileView('profile')
                    console.log('✅ Profile updated successfully!')
                  }}
                  onCancel={() => setProfileView('profile')}
                />
              )}
            </div>
          )}

          {activeTab === 4 && (
            <PrivateGroups />
          )}

          {activeTab === 5 && (
            <LitEncryption currentUserAddress={currentUser || '0x1234567890123456789012345678901234567890'} />
          )}

          {activeTab === 6 && (
            <Marketplace />
          )}

          {activeTab === 7 && (
            <div className="space-y-16">
              {/* Privacy & Security Header */}
              <div className="text-center">
                <h3 className="text-3xl font-extralight text-white mb-4">Privacy & Security</h3>
                <p className="text-gray-400 font-light max-w-3xl mx-auto">
                  Advanced cryptographic tools and emergency protection systems.
                  <br/>
                  <span className="text-gray-500">Zero-knowledge proofs • Emergency data clearing • Enterprise-grade encryption</span>
                </p>
              </div>

              {/* Tor Network Section */}
              <div>
                <TorStatus />
              </div>

              {/* Killswitch Section */}
              <div>
                <KillswitchControls />
              </div>

              {/* Divider */}
              <div className="flex items-center">
                <div className="flex-1 h-px bg-gray-800"></div>
                <div className="px-6 text-gray-600 text-sm font-light tracking-wider">CRYPTOGRAPHIC TOOLS</div>
                <div className="flex-1 h-px bg-gray-800"></div>
              </div>

              {/* ZK Proofs Section */}
              <div>
                <ZKProofGenerator 
                  onProofGenerated={(proof) => {
                    console.log('ZK Proof generated:', proof)
                    // Handle proof generation success
                  }}
                />
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={isCreatePostModalOpen}
        onClose={() => setIsCreatePostModalOpen(false)}
        onPostCreated={(post) => {
          console.log('🎉 New post created:', post)
          // Trigger home feed refresh
          setRefreshTrigger(prev => prev + 1)
        }}
      />
    </div>
  )
} 