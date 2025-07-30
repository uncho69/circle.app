import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShoppingBag, 
  Eye, 
  EyeOff, 
  Shield, 
  Lock, 
  Coins,
  Zap,
  Crown,
  Star,
  User,
  Clock,
  AlertTriangle,
  CheckCircle,
  X,
  Search,
  Filter,
  SortAsc,
  SortDesc
} from 'lucide-react'
import { useUniversalWallet } from '../hooks/useUniversalWallet'

interface NFT {
  id: string
  name: string
  description: string
  price: number
  currency: 'ETH' | 'DAI' | 'USDC'
  image: string
  category: 'circle' | 'profile' | 'collectible'
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  seller: string
  listedAt: string
  isVerified: boolean
  isEncrypted: boolean
}

const MOCK_NFTS: NFT[] = [
  {
    id: '1',
    name: 'Elite Circle Access',
    description: 'Exclusive access to private Circle with 100+ ETH members',
    price: 0.05,
    currency: 'ETH',
    image: '/api/placeholder/300/300',
    category: 'circle',
    rarity: 'legendary',
    seller: '0x1234...5678',
    listedAt: '2025-07-29T19:30:00Z',
    isVerified: true,
    isEncrypted: true
  },
  {
    id: '2',
    name: 'Founder Badge',
    description: 'Rare founder badge for early Circle adopters',
    price: 0.02,
    currency: 'ETH',
    image: '/api/placeholder/300/300',
    category: 'profile',
    rarity: 'epic',
    seller: '0x8765...4321',
    listedAt: '2025-07-29T18:45:00Z',
    isVerified: true,
    isEncrypted: false
  },
  {
    id: '3',
    name: 'Genesis Circle NFT',
    description: 'First 1000 Circle users - limited edition',
    price: 0.01,
    currency: 'ETH',
    image: '/api/placeholder/300/300',
    category: 'collectible',
    rarity: 'rare',
    seller: '0x9999...8888',
    listedAt: '2025-07-29T17:20:00Z',
    isVerified: false,
    isEncrypted: true
  },
  {
    id: '4',
    name: 'Privacy Shield',
    description: 'Advanced privacy features for Circle members',
    price: 0.03,
    currency: 'ETH',
    image: '/api/placeholder/300/300',
    category: 'profile',
    rarity: 'epic',
    seller: '0x5555...6666',
    listedAt: '2025-07-29T16:15:00Z',
    isVerified: true,
    isEncrypted: true
  }
]

export const Marketplace: React.FC = () => {
  const [nfts, setNfts] = useState<NFT[]>(MOCK_NFTS)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'price' | 'date' | 'rarity'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showEncryptedOnly, setShowEncryptedOnly] = useState(false)
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false)
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)

  const { isConnected, account, connectWallet } = useUniversalWallet()

  const categories = [
    { id: 'all', name: 'All Items', icon: ShoppingBag },
    { id: 'circle', name: 'Circle Access', icon: Crown },
    { id: 'profile', name: 'Profile Items', icon: User },
    { id: 'collectible', name: 'Collectibles', icon: Star }
  ]

  const rarityColors = {
    common: 'text-gray-400',
    rare: 'text-blue-400',
    epic: 'text-purple-400',
    legendary: 'text-orange-400'
  }

  const filteredNFTs = nfts.filter(nft => {
    const matchesCategory = selectedCategory === 'all' || nft.category === selectedCategory
    const matchesSearch = nft.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         nft.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesEncrypted = !showEncryptedOnly || nft.isEncrypted
    const matchesVerified = !showVerifiedOnly || nft.isVerified
    
    return matchesCategory && matchesSearch && matchesEncrypted && matchesVerified
  })

  const sortedNFTs = [...filteredNFTs].sort((a, b) => {
    if (sortBy === 'price') {
      return sortOrder === 'asc' ? a.price - b.price : b.price - a.price
    } else if (sortBy === 'date') {
      return sortOrder === 'asc' 
        ? new Date(a.listedAt).getTime() - new Date(b.listedAt).getTime()
        : new Date(b.listedAt).getTime() - new Date(a.listedAt).getTime()
    } else {
      const rarityOrder = { common: 0, rare: 1, epic: 2, legendary: 3 }
      return sortOrder === 'asc' 
        ? rarityOrder[a.rarity] - rarityOrder[b.rarity]
        : rarityOrder[b.rarity] - rarityOrder[a.rarity]
    }
  })

  const handlePurchase = async (nft: NFT) => {
    if (!isConnected) {
      try {
        await connectWallet()
      } catch (error) {
        console.error('Failed to connect wallet')
        return
      }
    }

    setSelectedNFT(nft)
    setShowPurchaseModal(true)
  }

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const listed = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - listed.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Header */}
      <div className="border-b border-dark-700 bg-dark-800">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ShoppingBag className="text-crypto-blue" size={24} />
              <h1 className="text-2xl font-light text-white">Marketplace</h1>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 text-dark-400 text-sm">
                <Shield size={16} />
                <span>Encrypted</span>
              </div>
              <div className="flex items-center space-x-1 text-dark-400 text-sm">
                <Lock size={16} />
                <span>Private</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="border-b border-dark-700 bg-dark-800/50">
        <div className="px-6 py-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400" size={16} />
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-dark-900 border border-dark-600 rounded-xl pl-10 pr-4 py-2 text-white placeholder-dark-400 focus:outline-none focus:border-crypto-blue"
              />
            </div>

            {/* Categories */}
            <div className="flex items-center space-x-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-crypto-blue text-white'
                      : 'bg-dark-700 text-dark-400 hover:text-white'
                  }`}
                >
                  <category.icon size={16} className="inline mr-2" />
                  {category.name}
                </button>
              ))}
            </div>

            {/* Sort */}
            <div className="flex items-center space-x-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-crypto-blue"
              >
                <option value="date">Date</option>
                <option value="price">Price</option>
                <option value="rarity">Rarity</option>
              </select>
              
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-2 bg-dark-700 border border-dark-600 rounded-lg text-dark-400 hover:text-white transition-colors"
              >
                {sortOrder === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />}
              </button>
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowEncryptedOnly(!showEncryptedOnly)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  showEncryptedOnly
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-dark-700 text-dark-400 hover:text-white'
                }`}
              >
                <Lock size={16} className="inline mr-2" />
                Encrypted
              </button>
              
              <button
                onClick={() => setShowVerifiedOnly(!showVerifiedOnly)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  showVerifiedOnly
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'bg-dark-700 text-dark-400 hover:text-white'
                }`}
              >
                <CheckCircle size={16} className="inline mr-2" />
                Verified
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* NFT Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedNFTs.map((nft) => (
            <motion.div
              key={nft.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden hover:border-dark-600 transition-colors"
            >
              {/* NFT Image */}
              <div className="relative h-48 bg-gradient-to-br from-dark-700 to-dark-800">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-6xl text-dark-600">🎨</div>
                </div>
                
                {/* Badges */}
                <div className="absolute top-3 left-3 flex items-center space-x-2">
                  {nft.isEncrypted && (
                    <div className="bg-green-500/20 border border-green-500/30 rounded-full px-2 py-1">
                      <Lock size={12} className="text-green-400" />
                    </div>
                  )}
                  {nft.isVerified && (
                    <div className="bg-blue-500/20 border border-blue-500/30 rounded-full px-2 py-1">
                      <CheckCircle size={12} className="text-blue-400" />
                    </div>
                  )}
                </div>
                
                {/* Rarity Badge */}
                <div className="absolute top-3 right-3">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full bg-dark-900/80 ${rarityColors[nft.rarity]}`}>
                    {nft.rarity.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* NFT Info */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-white font-medium truncate">{nft.name}</h3>
                  <div className="flex items-center space-x-1">
                    <Coins size={14} className="text-yellow-500" />
                    <span className="text-white font-medium">{nft.price} {nft.currency}</span>
                  </div>
                </div>
                
                <p className="text-dark-400 text-sm mb-3 line-clamp-2">{nft.description}</p>
                
                <div className="flex items-center justify-between text-xs text-dark-500">
                  <span>by {formatAddress(nft.seller)}</span>
                  <span>{formatTimeAgo(nft.listedAt)}</span>
                </div>
                
                <button
                  onClick={() => handlePurchase(nft)}
                  className="w-full mt-3 px-4 py-2 bg-gradient-to-r from-crypto-blue to-crypto-purple text-white rounded-lg hover:from-crypto-blue/90 hover:to-crypto-purple/90 transition-colors font-medium"
                >
                  Purchase
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {sortedNFTs.length === 0 && (
          <div className="text-center py-12">
            <ShoppingBag className="text-dark-400 mx-auto mb-4" size={48} />
            <h3 className="text-white font-medium mb-2">No items found</h3>
            <p className="text-dark-400">Try adjusting your filters or search terms</p>
          </div>
        )}
      </div>

      {/* Purchase Modal */}
      <AnimatePresence>
        {showPurchaseModal && selectedNFT && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowPurchaseModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-dark-800 border border-dark-700 rounded-2xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Purchase NFT</h2>
                <button
                  onClick={() => setShowPurchaseModal(false)}
                  className="p-2 text-dark-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-dark-900/50 rounded-xl p-4">
                  <h3 className="text-white font-medium mb-2">{selectedNFT.name}</h3>
                  <p className="text-dark-400 text-sm mb-3">{selectedNFT.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-dark-400 text-sm">Price</span>
                    <span className="text-white font-medium">{selectedNFT.price} {selectedNFT.currency}</span>
                  </div>
                </div>

                <div className="bg-dark-900/50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-dark-400 text-sm">Network Fee</span>
                    <span className="text-white text-sm">~0.001 ETH</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-dark-400 text-sm">Platform Fee</span>
                    <span className="text-white text-sm">0.002 ETH</span>
                  </div>
                  <div className="border-t border-dark-700 pt-2 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium">Total</span>
                      <span className="text-white font-medium">
                        {(selectedNFT.price + 0.003).toFixed(3)} ETH
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowPurchaseModal(false)}
                    className="flex-1 px-4 py-3 border border-dark-600 text-dark-400 rounded-xl hover:border-dark-500 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      // Mock purchase
                      console.log('Purchasing NFT:', selectedNFT.id)
                      setShowPurchaseModal(false)
                    }}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-crypto-blue to-crypto-purple text-white rounded-xl hover:from-crypto-blue/90 hover:to-crypto-purple/90 transition-colors"
                  >
                    Confirm Purchase
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 