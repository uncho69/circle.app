import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Heart, 
  Repeat2, 
  MessageCircle, 
  Eye, 
  MoreHorizontal,
  Reply,
  Share,
  Bookmark
} from 'lucide-react'
import { Post as SupabasePost } from '../utils/supabase'
import { CreatePost } from './CreatePost'
import { useUniversalWallet } from '../hooks/useUniversalWallet'

// Unified post type that works with both API formats
interface UnifiedPost {
  id: string
  content: string
  created_at?: string
  timestamp?: string
  image_url?: string
  image?: string
  is_private?: boolean
  likes_count?: number
  reposts_count?: number
  replies_count?: number
  likes?: number
  reposts?: number
  replies?: number
  author?: {
    pseudonym: string
    display_name?: string
    avatar_url?: string
  }
  author_display_name?: string
  author_pseudonym?: string
  author_avatar?: string
}

export interface PostItemProps {
  post: UnifiedPost
  onLike?: (postId: string) => void
  onRepost?: (postId: string) => void
  onReply?: (postId: string) => void
  className?: string
}

export const PostItem: React.FC<PostItemProps> = ({ 
  post, 
  onLike, 
  onRepost,
  onReply,
  className = '' 
}) => {
  const [isLiked, setIsLiked] = useState(false)
  const [isReposted, setIsReposted] = useState(false)
  const [showReplies, setShowReplies] = useState(false)
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replies, setReplies] = useState<UnifiedPost[]>([])

  const { account, isConnected } = useUniversalWallet()

  // Helper functions to get post data regardless of format
  const getAuthorName = () => {
    if (post.author?.display_name) return post.author.display_name
    if (post.author_display_name) return post.author_display_name
    if (post.author?.pseudonym) return post.author.pseudonym
    if (post.author_pseudonym) return post.author_pseudonym
    return 'Unknown'
  }

  const getAuthorPseudonym = () => {
    if (post.author?.pseudonym) return post.author.pseudonym
    if (post.author_pseudonym) return post.author_pseudonym
    return 'unknown'
  }

  const getAuthorAvatar = () => {
    if (post.author?.avatar_url) return post.author.avatar_url
    if (post.author_avatar) return post.author_avatar
    return null
  }

  const getTimestamp = () => {
    return post.created_at || post.timestamp || new Date().toISOString()
  }

  const getImageUrl = () => {
    return post.image_url || post.image || null
  }

  const getLikesCount = () => {
    return post.likes_count || post.likes || 0
  }

  const getRepostsCount = () => {
    return post.reposts_count || post.reposts || 0
  }

  const getRepliesCount = () => {
    return post.replies_count || post.replies || 0
  }

  const handleLike = async () => {
    try {
      if (!isConnected || !account) {
        alert('Please connect your wallet first')
        return
      }

      const response = await fetch('/api/posts/interact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId: post.id,
          action: 'like',
          userId: account
        })
      })

      const result = await response.json()

      if (response.ok) {
        setIsLiked(!isLiked)
        onLike?.(post.id)
      } else {
        console.error('Like failed:', result)
        alert(`Like failed: ${result.error}`)
      }
    } catch (error) {
      console.error('Error liking post:', error)
      alert('Error liking post')
    }
  }

  const handleRepost = async () => {
    try {
      if (!isConnected || !account) {
        alert('Please connect your wallet first')
        return
      }

      const response = await fetch('/api/posts/interact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId: post.id,
          action: 'repost',
          userId: account
        })
      })

      const result = await response.json()

      if (response.ok) {
        setIsReposted(!isReposted)
        onRepost?.(post.id)
      } else {
        console.error('Repost failed:', result)
        alert(`Repost failed: ${result.error}`)
      }
    } catch (error) {
      console.error('Error reposting:', error)
      alert('Error reposting')
    }
  }

  const handleReply = () => {
    setShowReplyForm(!showReplyForm)
    if (!showReplies) {
      setShowReplies(true)
    }
  }

  const loadReplies = async () => {
    try {
      const response = await fetch(`/api/posts/replies?postId=${post.id}`)
      const result = await response.json()
      
      if (result.success) {
        setReplies(result.replies)
      }
    } catch (error) {
      console.error('Error loading replies:', error)
    }
  }

  const handleReplyCreated = (newReply: UnifiedPost) => {
    setReplies(prev => [newReply, ...prev])
    setShowReplyForm(false)
    onReply?.(post.id)
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const postTime = new Date(timestamp)
    const diffInSeconds = Math.floor((now.getTime() - postTime.getTime()) / 1000)
    
    if (diffInSeconds < 60) return `${diffInSeconds}s`
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`
    return `${Math.floor(diffInSeconds / 86400)}d`
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(word => word.charAt(0)).join('').toUpperCase()
  }

  return (
    <motion.div 
      className={`bg-dark-800 border border-dark-700 rounded-2xl p-6 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Post Header */}
      <div className="flex items-start space-x-3 mb-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {post.author?.avatar_url ? (
            <img 
              src={post.author.avatar_url} 
              alt={post.author.pseudonym}
              className="w-12 h-12 rounded-full"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-crypto-blue to-purple-600 flex items-center justify-center text-white font-bold text-lg">
              {getInitials(getAuthorName())}
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => window.location.href = `/profile/${getAuthorPseudonym()}`}
              className="font-semibold text-white hover:text-crypto-blue transition-colors cursor-pointer"
            >
              {getAuthorName()}
            </button>
            <button 
              onClick={() => window.location.href = `/profile/${getAuthorPseudonym()}`}
              className="text-dark-400 hover:text-crypto-blue transition-colors cursor-pointer"
            >
              @{getAuthorPseudonym()}
            </button>
            <span className="text-dark-400">·</span>
            <span className="text-dark-400">{formatTimeAgo(getTimestamp())}</span>
          </div>
        </div>

        {/* More Options */}
        <button className="text-dark-400 hover:text-white transition-colors">
          <MoreHorizontal size={20} />
        </button>
      </div>

      {/* Post Content */}
      <div className="mb-4">
        <p className="text-white text-lg leading-relaxed whitespace-pre-wrap">
          {post.content}
        </p>
      </div>

      {/* Post Image */}
      {getImageUrl() && (
        <div className="mb-4">
          <img 
            src={getImageUrl()!} 
            alt="Post content"
            className="w-full rounded-lg max-h-96 object-cover"
          />
        </div>
      )}

      {/* Post Stats */}
      <div className="flex items-center space-x-6 text-dark-400 text-sm mb-4">
        <span>{getRepliesCount()} replies</span>
        <span>{getRepostsCount()} reposts</span>
        <span>{getLikesCount()} likes</span>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-dark-700">
        {/* Reply */}
        <button
          onClick={handleReply}
          className="flex items-center space-x-2 text-dark-400 hover:text-crypto-blue transition-colors"
        >
          <MessageCircle size={20} />
          <span>Reply</span>
        </button>

        {/* Repost */}
        <button
          onClick={handleRepost}
          className={`flex items-center space-x-2 transition-colors ${
            isReposted ? 'text-green-400' : 'text-dark-400 hover:text-green-400'
          }`}
        >
          <Repeat2 size={20} />
          <span>Repost</span>
        </button>

        {/* Like */}
        <button
          onClick={handleLike}
          className={`flex items-center space-x-2 transition-colors ${
            isLiked ? 'text-red-400' : 'text-dark-400 hover:text-red-400'
          }`}
        >
          <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
          <span>Like</span>
        </button>

        {/* Share */}
        <button className="flex items-center space-x-2 text-dark-400 hover:text-crypto-blue transition-colors">
          <Share size={20} />
          <span>Share</span>
        </button>

        {/* Bookmark */}
        <button className="flex items-center space-x-2 text-dark-400 hover:text-crypto-blue transition-colors">
          <Bookmark size={20} />
          <span>Bookmark</span>
        </button>
      </div>

              {/* Reply Form */}
        {showReplyForm && (
          <div className="mt-4 pt-4 border-t border-dark-700">
            <CreatePost
              replyTo={post.id}
              parentPost={post as any}
              onPostCreated={handleReplyCreated}
              onCancel={() => setShowReplyForm(false)}
            />
          </div>
        )}

      {/* Replies */}
      {showReplies && (
        <div className="mt-4 space-y-4">
          {replies.map((reply) => (
            <PostItem
              key={reply.id}
              post={reply}
              className="ml-8 border-l-2 border-dark-700 pl-4"
            />
          ))}
        </div>
      )}
    </motion.div>
  )
} 