import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Activity, RefreshCw, AlertTriangle } from 'lucide-react'
import { PostItem } from './PostItem'
import { Post } from '../utils/supabase'

export interface HomeFeedProps {
  className?: string
}

export const HomeFeed: React.FC<HomeFeedProps> = ({ className = '' }) => {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)


  const loadPosts = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/posts/feed')
      const result = await response.json()
      
      if (result.success) {
        setPosts(result.posts)
      } else {
        setError(result.error || 'Failed to load posts')
      }
    } catch (error) {
      console.error('Error loading posts:', error)
      setError('Failed to load posts')
    } finally {
      setLoading(false)
    }
  }



  const handlePostCreated = (newPost: Post) => {
    setPosts(prev => [newPost, ...prev])
  }

  const handleLike = (postId: string) => {
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { ...post, likes_count: (post.likes_count || 0) + 1 }
        : post
    ))
  }

  const handleRepost = (postId: string) => {
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { ...post, reposts_count: (post.reposts_count || 0) + 1 }
        : post
    ))
  }

  const handleReply = (postId: string) => {
    // Refresh the feed to show new replies
    loadPosts()
  }

  useEffect(() => {
    loadPosts()
  }, []) // This will reload when the key changes (refreshTrigger)

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-crypto-blue animate-spin mx-auto mb-4" />
          <p className="text-dark-400">Loading broadcasts...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={loadPosts}
            className="px-4 py-2 bg-crypto-blue text-white rounded-lg hover:bg-crypto-blue/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="text-center">
          <Activity className="w-12 h-12 text-dark-400 mx-auto mb-4" />
          <h3 className="text-white font-medium mb-2">No broadcasts yet</h3>
          <p className="text-dark-400">Be the first to share something with the Circle network!</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {posts.map(post => (
        <PostItem
          key={post.id}
          post={post}
          onLike={handleLike}
          onRepost={handleRepost}
          onReply={handleReply}
        />
      ))}
    </div>
  )
}
