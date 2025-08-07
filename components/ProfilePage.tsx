import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  Edit3, 
  MapPin, 
  Globe, 
  Target, 
  Coins, 
  Activity, 
  MessageCircle, 
  Image, 
  Heart,
  Eye,
  Repeat2
} from 'lucide-react'
import { useProfile } from '../hooks/useProfile'
import { SendCryptoModal } from './SendCryptoModal'

interface Post {
  id: string
  author: string
  content: string
  timestamp: string
  likes: number
  reposts: number
  replies: number
  views: number
  image?: string
}

interface PublicProfile {
  pseudonym: string
  displayName: string
  bio?: string
  location?: string
  website?: string
  walletAddressDisplay?: string
  createdAt: string
  stats: {
    postsCount: number
    followersCount: number
    followingCount: number
  }
  reputation: number
  zkProofs: number
  bannerColor?: string
}

interface CircleStats {
  posts: number
  reputation: number
  privacyScore: number
  anonymityLevel: number
  zkProofs: number
  torSessions: number
  killswitchActivations: number
  followers: number
  following: number
}

interface ProfilePageProps {
  pseudonym: string
  onBack?: () => void
  onEditProfile?: () => void
  className?: string
  currentUser?: string | null
}



// Circle Stats Component
const CircleStats: React.FC<{ stats: CircleStats }> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-dark-900/50 border border-dark-600 rounded-xl p-4">
        <div className="flex items-center space-x-2 mb-2">
          <Activity className="text-crypto-blue" size={16} />
          <span className="text-white font-medium">Posts</span>
        </div>
        <p className="text-2xl font-bold text-white">{stats.posts}</p>
      </div>
      
      <div className="bg-dark-900/50 border border-dark-600 rounded-xl p-4">
        <div className="flex items-center space-x-2 mb-2">
          <Target className="text-crypto-blue" size={16} />
          <span className="text-white font-medium">Reputation</span>
        </div>
        <p className="text-2xl font-bold text-white">{stats.reputation}</p>
      </div>
      
      <div className="bg-dark-900/50 border border-dark-600 rounded-xl p-4">
        <div className="flex items-center space-x-2 mb-2">
          <Coins className="text-crypto-blue" size={16} />
          <span className="text-white font-medium">Privacy</span>
        </div>
        <p className="text-2xl font-bold text-white">{stats.privacyScore}%</p>
      </div>
      
      <div className="bg-dark-900/50 border border-dark-600 rounded-xl p-4">
        <div className="flex items-center space-x-2 mb-2">
          <MessageCircle className="text-crypto-blue" size={16} />
          <span className="text-white font-medium">Followers</span>
        </div>
        <p className="text-2xl font-bold text-white">{stats.followers}</p>
      </div>
    </div>
  )
}

interface PostItemProps {
  post: Post
  onLike: (postId: string) => void
  onRepost: (postId: string) => void
}

const PostItem: React.FC<PostItemProps> = ({ post, onLike, onRepost }) => {
  const { generateAvatar } = useProfile()
  
  const timeAgo = (timestamp: string) => {
    const now = new Date()
    const postTime = new Date(timestamp)
    const diffInMs = now.getTime() - postTime.getTime()
    const diffInSeconds = Math.floor(diffInMs / 1000)
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
    
    if (diffInSeconds < 60) return `${diffInSeconds}s`
    if (diffInMinutes < 60) return `${diffInMinutes}m`
    if (diffInHours < 24) return `${diffInHours}h`
    if (diffInDays < 7) return `${diffInDays}d`
    return postTime.toLocaleDateString()
  }

  const formatViews = (views: number) => {
    if (views < 1000) return views.toString()
    if (views < 1000000) return `${(views / 1000).toFixed(1)}k`
    return `${(views / 1000000).toFixed(1)}M`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-dark-800 border border-dark-700 rounded-xl p-4 mb-4"
    >
      <div className="flex items-start space-x-3">
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0"
          style={{ background: generateAvatar(post.author) }}
        >
          {post.author.charAt(0).toUpperCase()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-white font-medium">{post.author}</span>
            <span className="text-dark-400 text-sm">{timeAgo(post.timestamp)}</span>
          </div>
          
          <p className="text-white mb-3 leading-relaxed">{post.content}</p>
          
          {post.image && (
            <img 
              src={post.image} 
              alt="Post content" 
              className="w-full rounded-lg mb-3 max-h-64 object-cover"
            />
          )}
          
          <div className="flex items-center justify-between text-dark-400 text-sm">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => onLike(post.id)}
                className="flex items-center space-x-1 hover:text-red-400 transition-colors"
              >
                <Heart size={16} />
                <span>{post.likes}</span>
              </button>
              
              <button 
                onClick={() => onRepost(post.id)}
                className="flex items-center space-x-1 hover:text-blue-400 transition-colors"
              >
                <Repeat2 size={16} />
                <span>{post.reposts}</span>
              </button>
              
              <div className="flex items-center space-x-1">
                <MessageCircle size={16} />
                <span>{post.replies}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-1">
              <Eye size={14} />
              <span>{formatViews(post.views)}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ 
  pseudonym, 
  onBack, 
  onEditProfile,
  className = '',
  currentUser
}) => {
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState(0)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followStats, setFollowStats] = useState({ followersCount: 0, followingCount: 0 })
  const [showSendCryptoModal, setShowSendCryptoModal] = useState(false)

  const { generateAvatar } = useProfile()

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true)
        
        const response = await fetch(`/api/profile/get?pseudonym=${pseudonym}`)
        const data = await response.json()
        
        if (data.success) {
          setProfile(data.profile)
          setPosts(data.posts || [])
          setFollowStats(data.profile.stats)
        } else {
          setError(data.error || 'Failed to load profile')
        }
      } catch (error) {
        setError('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [pseudonym])

  // Check if current user is following this profile
  useEffect(() => {
    if (currentUser && profile) {
      const checkFollowStatus = async () => {
        try {
          const response = await fetch('/api/follow/action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'check',
              follower: currentUser,
              following: pseudonym
            })
          })
          const data = await response.json()
          setIsFollowing(data.isFollowing)
        } catch (error) {
          console.error('Failed to check follow status:', error)
        }
      }
      
      checkFollowStatus()
    }
  }, [currentUser, profile, pseudonym])

  const handleFollowToggle = async () => {
    if (!currentUser) return

    try {
      const response = await fetch('/api/follow/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isFollowing ? 'unfollow' : 'follow',
          follower: currentUser,
          following: pseudonym
        })
      })
      
      const data = await response.json()
      if (data.success) {
        setIsFollowing(!isFollowing)
        setFollowStats(prev => ({
          ...prev,
          followersCount: isFollowing ? prev.followersCount - 1 : prev.followersCount + 1
        }))
      }
    } catch (error) {
      console.error('Failed to toggle follow:', error)
    }
  }

  const handleLike = async (postId: string) => {
    if (!currentUser) return

    try {
      const response = await fetch('/api/posts/interact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          action: 'like',
          userId: currentUser
        })
      })
      
      const data = await response.json()
      if (data.success) {
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, likes: data.action === 'like' ? post.likes + 1 : post.likes - 1 }
            : post
        ))
      }
    } catch (error) {
      console.error('Failed to like post:', error)
    }
  }

  const handleRepost = async (postId: string) => {
    if (!currentUser) return

    try {
      const response = await fetch('/api/posts/interact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          action: 'repost',
          userId: currentUser
        })
      })
      
      const data = await response.json()
      if (data.success) {
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, reposts: data.action === 'repost' ? post.reposts + 1 : post.reposts - 1 }
            : post
        ))
      }
    } catch (error) {
      console.error('Failed to repost:', error)
    }
  }

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8">
          <div className="animate-pulse space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-dark-700 rounded-full" />
              <div className="space-y-2 flex-1">
                <div className="h-6 bg-dark-700 rounded w-1/3" />
                <div className="h-4 bg-dark-700 rounded w-1/2" />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 bg-dark-700 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className={`${className}`}>
        <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8 text-center">
          <div className="text-red-400 mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-white mb-2">Profile Not Found</h3>
          <p className="text-dark-400">{error || 'This profile does not exist'}</p>
        </div>
      </div>
    )
  }

  // Calculate Circle-specific stats
  const circleStats: CircleStats = {
    posts: profile.stats.postsCount,
    reputation: profile.reputation,
    privacyScore: Math.round(Math.min(100, Math.max(0, 85 + Math.random() * 10))), // Simulated privacy score (max 95%)
    anonymityLevel: Math.floor(Math.random() * 3) + 1, // 1-3 levels
    zkProofs: Math.min(100, profile.zkProofs), // Cap at 100%
    torSessions: Math.floor(Math.random() * 50) + 10,
    killswitchActivations: Math.floor(Math.random() * 5),
    followers: profile.stats.followersCount,
    following: profile.stats.followingCount
  }

  // Special badge for founder (you!)
  const isFounder = pseudonym === 'anus' // Replace with your actual pseudonym
  const privacyLevel = isFounder ? 'founder' : 
                      circleStats.privacyScore > 90 ? 'legendary' : 
                      circleStats.privacyScore > 80 ? 'verified' : 
                      circleStats.privacyScore > 60 ? 'pseudonymous' : 'anonymous'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-dark-800 border border-dark-700 rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="relative">
        {/* Banner */}
        <div 
          className="h-40 bg-gradient-to-r from-blue-600 to-purple-600 relative overflow-hidden"
          style={{ background: profile.bannerColor || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
        >
          {/* Banner overlay pattern */}
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
        </div>
        
        {/* Back button */}
        {onBack && (
          <button
            onClick={onBack}
            className="absolute top-4 left-4 p-2 bg-dark-900/80 text-white rounded-full hover:bg-dark-900 transition-colors z-10"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        
        {/* Edit button */}
        {onEditProfile && currentUser === pseudonym && (
          <button
            onClick={onEditProfile}
            className="absolute top-4 right-4 p-2 bg-dark-900/80 text-white rounded-full hover:bg-dark-900 transition-colors z-10"
          >
            <Edit3 size={20} />
          </button>
        )}
        
        {/* Avatar */}
        <div className="absolute -bottom-16 left-6">
          <div 
            className="w-32 h-32 rounded-full border-4 border-dark-800 flex items-center justify-center text-white font-bold text-4xl shadow-lg bg-gradient-to-br from-blue-500 to-purple-600"
          >
            <div className="w-24 h-24 rounded-full bg-dark-900 flex items-center justify-center">
              <span className="text-white font-bold text-2xl">
                {profile.pseudonym.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Info */}
      <div className="pt-20 pb-6 px-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-3">
              <h1 className="text-3xl font-bold text-white">{profile.displayName}</h1>
            </div>
            
            <p className="text-dark-400 text-lg mb-4">@{profile.pseudonym}</p>
            
            {profile.bio && (
              <p className="text-white text-base leading-relaxed mb-4">{profile.bio}</p>
            )}
            
            <div className="flex items-center space-x-6 text-sm text-dark-400">
              {profile.location && (
                <div className="flex items-center space-x-2">
                  <MapPin size={16} />
                  <span>{profile.location}</span>
                </div>
              )}
              
              {profile.website && (
                <a 
                  href={profile.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 hover:text-blue-400 transition-colors"
                >
                  <Globe size={16} />
                  <span>{profile.website}</span>
                </a>
              )}
              
              <div className="flex items-center space-x-2">
                <Target size={16} />
                <span>Circling since {new Date(profile.createdAt).getFullYear()}</span>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          {currentUser && currentUser !== pseudonym && (
            <div className="flex items-center space-x-3">
              <button
                onClick={handleFollowToggle}
                className={`px-6 py-3 rounded-full font-medium transition-all text-base ${
                  isFollowing
                    ? 'bg-dark-700 text-white hover:bg-red-500/20 hover:text-red-400 border border-dark-600'
                    : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg'
                }`}
              >
                {isFollowing ? 'Unfollow' : 'Follow'}
              </button>
              
              <button
                onClick={() => setShowSendCryptoModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full font-medium transition-all text-base hover:from-green-600 hover:to-emerald-700 shadow-lg flex items-center space-x-2"
              >
                <Coins size={16} />
                <span>Send Crypto</span>
              </button>
            </div>
          )}
        </div>

        {/* Circle Stats */}
        <CircleStats stats={circleStats} />

        {/* Tabs */}
        <div className="border-b border-dark-700">
          <div className="flex">
            {['Broadcasts', 'Replies', 'Media', 'Likes'].map((tab, index) => (
              <button
                key={index}
                onClick={() => setActiveTab(index)}
                className={`flex-1 py-4 px-4 text-center font-medium transition-all relative ${
                  activeTab === index
                    ? 'text-white border-b-2 border-blue-500'
                    : 'text-dark-400 hover:text-white hover:bg-dark-800/50'
                }`}
              >
                <div className="text-sm md:text-base">
                  {tab}
                  {index === 0 && posts.length > 0 && (
                    <span className="ml-2 text-xs text-dark-500">({posts.length})</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-6">
        {activeTab === 0 && (
          <div>
            {posts.length > 0 ? (
              posts.map(post => (
                <PostItem
                  key={post.id}
                  post={post}
                  onLike={handleLike}
                  onRepost={handleRepost}
                />
              ))
            ) : (
              <div className="text-center py-12">
                <div className="text-dark-400 mb-4">
                  <Activity size={48} />
                </div>
                <h3 className="text-white font-medium mb-2">No Broadcasts Yet</h3>
                <p className="text-dark-400">This user hasn&apos;t made any broadcasts yet.</p>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 1 && (
          <div className="text-center py-12">
            <div className="text-dark-400 mb-4">
              <MessageCircle size={48} />
            </div>
            <h3 className="text-white font-medium mb-2">No Replies Yet</h3>
            <p className="text-dark-400">This user hasn&apos;t replied to any broadcasts yet.</p>
          </div>
        )}
        
        {activeTab === 2 && (
          <div className="text-center py-12">
            <div className="text-dark-400 mb-4">
              <Image size={48} />
            </div>
            <h3 className="text-white font-medium mb-2">No Media Yet</h3>
            <p className="text-dark-400">This user hasn&apos;t shared any media yet.</p>
          </div>
        )}
        
        {activeTab === 3 && (
          <div className="text-center py-12">
            <div className="text-dark-400 mb-4">
              <Heart size={48} />
            </div>
            <h3 className="text-white font-medium mb-2">No Likes Yet</h3>
            <p className="text-dark-400">This user hasn&apos;t liked any broadcasts yet.</p>
          </div>
        )}
      </div>

      {/* Send Crypto Modal */}
      {profile && (
        <SendCryptoModal
          isOpen={showSendCryptoModal}
          onClose={() => setShowSendCryptoModal(false)}
          recipient={{
            address: profile.walletAddressDisplay || '0x0000000000000000000000000000000000000000',
            pseudonym: profile.pseudonym
          }}
          context="profile"
        />
      )}
    </motion.div>
  )
} 