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
import { Post } from '../pages/api/posts/create'
import { CreatePost } from './CreatePost'
import { walletAuth } from '../utils/walletAuth'

export interface PostItemProps {
  post: Post
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
  const [replies, setReplies] = useState<Post[]>([])

  const handleLike = async () => {
    try {
      const currentProfile = walletAuth.getCurrentProfile()
      console.log('Current profile:', currentProfile)
      
      if (!currentProfile) {
        console.error('No user logged in')
        alert('Please connect your wallet first')
        return
      }

      console.log('Sending like request:', {
        postId: post.id,
        action: 'like',
        userId: currentProfile.walletAddress
      })

      const response = await fetch('/api/posts/interact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId: post.id,
          action: 'like',
          userId: currentProfile.walletAddress
        })
      })

      const result = await response.json()
      console.log('Like response:', result)

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
      const currentProfile = walletAuth.getCurrentProfile()
      console.log('Current profile for repost:', currentProfile)
      
      if (!currentProfile) {
        console.error('No user logged in')
        alert('Please connect your wallet first')
        return
      }

      console.log('Sending repost request:', {
        postId: post.id,
        action: 'repost',
        userId: currentProfile.walletAddress
      })

      const response = await fetch('/api/posts/interact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId: post.id,
          action: 'repost',
          userId: currentProfile.walletAddress
        })
      })

      const result = await response.json()
      console.log('Repost response:', result)

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
      loadReplies()
    }
  }

  const loadReplies = async () => {
    try {
      const response = await fetch(`/api/posts/replies?postId=${post.id}`)
      const result = await response.json()
      
      if (result.success) {
        setReplies(result.replies)
        setShowReplies(true)
      }
    } catch (error) {
      console.error('Error loading replies:', error)
    }
  }

  const handleReplyCreated = (newReply: Post) => {
    setReplies(prev => [newReply, ...prev])
    setShowReplyForm(false)
    // Update the post's reply count locally
    post.replies = (post.replies || 0) + 1
    onReply?.(post.id)
  }

  const formatTimeAgo = (timestamp: string) => {
    console.log('Raw timestamp:', timestamp)
    
    const now = new Date()
    const postTime = new Date(timestamp)
    
    console.log('Now:', now.toISOString())
    console.log('Post time:', postTime.toISOString())
    console.log('Post time valid:', !isNaN(postTime.getTime()))
    
    if (isNaN(postTime.getTime())) {
      console.error('Invalid timestamp:', timestamp)
      return 'now'
    }
    
    const diffInMinutes = Math.floor((now.getTime() - postTime.getTime()) / (1000 * 60))
    console.log('Diff in minutes:', diffInMinutes)
    
    if (diffInMinutes < 1) return 'now'
    if (diffInMinutes < 60) return `${diffInMinutes}m`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`
    return `${Math.floor(diffInMinutes / 1440)}d`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-dark-800 border border-dark-700 rounded-2xl p-6 ${className}`}
    >
      {/* Post Header */}
      <div className="flex items-start space-x-4 mb-4">
        <div className="w-12 h-12 bg-gradient-to-r from-crypto-blue to-crypto-purple rounded-full flex items-center justify-center">
          <span className="text-white font-semibold text-lg">
            {post.author.charAt(0).toUpperCase()}
          </span>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-white font-semibold">{post.author}</span>
            <span className="text-dark-400 text-sm">•</span>
            <span className="text-dark-400 text-sm">{formatTimeAgo(post.timestamp)}</span>
          </div>
          
          {/* Post Content */}
          <div className="text-white mb-4 leading-relaxed">
            {post.content}
          </div>
          
          {/* Post Image */}
          {post.image && (
            <div className="mb-4">
              <img 
                src={post.image} 
                alt="Post content"
                className="w-full max-w-md rounded-xl object-cover"
              />
            </div>
          )}
          
          {/* Post Stats */}
          <div className="flex items-center justify-between text-dark-400 text-sm mb-4">
            <div className="flex items-center space-x-4">
              <span>{post.likes} likes</span>
              <span>{post.reposts} recircles</span>
              <span>{post.replies} replies</span>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              {/* Reply Button */}
              <button
                onClick={handleReply}
                className="flex items-center space-x-2 text-dark-400 hover:text-crypto-blue transition-colors"
              >
                <MessageCircle size={20} />
                <span className="text-sm">Reply</span>
              </button>
              
              {/* Like Button */}
              <button
                onClick={handleLike}
                className={`flex items-center space-x-2 transition-colors ${
                  isLiked ? 'text-red-400' : 'text-dark-400 hover:text-red-400'
                }`}
              >
                <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
                <span className="text-sm">Like</span>
              </button>
              
              {/* Recircle Button */}
              <button
                onClick={handleRepost}
                className={`flex items-center space-x-2 transition-colors ${
                  isReposted ? 'text-green-400' : 'text-dark-400 hover:text-green-400'
                }`}
              >
                <Repeat2 size={20} />
                <span className="text-sm">Recircle</span>
              </button>
              
              {/* Share Button */}
              <button className="flex items-center space-x-2 text-dark-400 hover:text-crypto-blue transition-colors">
                <Share size={20} />
                <span className="text-sm">Share</span>
              </button>
            </div>
            
            <button className="text-dark-400 hover:text-white transition-colors">
              <MoreHorizontal size={20} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Reply Form */}
      {showReplyForm && (
        <div className="border-t border-dark-700 pt-4 mb-4">
          <CreatePost
            replyTo={post.id}
            parentPost={post}
            onPostCreated={handleReplyCreated}
            onCancel={() => setShowReplyForm(false)}
          />
        </div>
      )}
      
      {/* Replies */}
      {showReplies && replies.length > 0 && (
        <div className="border-t border-dark-700 pt-4">
          <div className="space-y-4">
            {replies.map((reply) => (
              <div key={reply.id} className="ml-8 border-l-2 border-dark-600 pl-4">
                <PostItem
                  post={reply}
                  onLike={onLike}
                  onRepost={onRepost}
                  onReply={onReply}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
} 