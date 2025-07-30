import { useState, useCallback, useEffect } from 'react'
import { Post } from '../pages/api/posts/create'
import { walletAuth } from '../utils/walletAuth'


export interface PostsState {
  posts: Post[]
  loading: boolean
  error: string | null
  hasMore: boolean
  total: number
}

export interface CreatePostRequest {
  content: string
  author: string
  visibility?: 'public' | 'followers' | 'private'
}

export const usePosts = () => {
  const [state, setState] = useState<PostsState>({
    posts: [],
    loading: false,
    error: null,
    hasMore: true,
    total: 0
  })

  // Fetch posts feed
  const fetchPosts = useCallback(async (offset = 0, limit = 20) => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const response = await fetch(`/api/posts/feed?offset=${offset}&limit=${limit}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch posts')
      }

      setState(prev => ({
        ...prev,
        posts: offset === 0 ? result.posts : [...prev.posts, ...result.posts],
        hasMore: result.hasMore,
        total: result.total,
        loading: false
      }))

      return result.posts
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }))
      return []
    }
  }, [])

  // Create new post
  const createPost = useCallback(async (postData: CreatePostRequest): Promise<Post | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const response = await fetch('/api/posts/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData)
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to create post')
      }

      // Refresh the entire feed to ensure consistency
      await fetchPosts(0, 20) // Refresh first 20 posts

      setState(prev => ({
        ...prev,
        loading: false
      }))

      return result.post
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }))
      return null
    }
  }, [fetchPosts])

  // Like a post (real API call)
  const likePost = useCallback(async (postId: string) => {
    try {
      // Get current user for the API call
      const currentProfile = walletAuth.getCurrentProfile()
      if (!currentProfile) {
        console.warn('No authenticated user for like action')
        return
      }

      const response = await fetch('/api/posts/interact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId,
          action: 'like',
          userId: currentProfile.pseudonym
        })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to like post')
      }

      // Update with real data from server
      setState(prev => ({
        ...prev,
        posts: prev.posts.map(post =>
          post.id === postId ? result.post : post
        )
      }))

      // Generate notification for post author (if not liking own post)
      const post = result.post
      if (post && post.author !== currentProfile.pseudonym && result.action === 'like') {
        // Notification would be handled by the API
        console.log(`🔔 Like notification for ${post.author}`)
      }

      console.log(`👍 ${result.action} post ${postId}`)
    } catch (error) {
      console.error('Like post error:', error)
    }
  }, [])

  // Repost a post (real API call)
  const repost = useCallback(async (postId: string) => {
    try {
      // Get current user for the API call
      const currentProfile = walletAuth.getCurrentProfile()
      if (!currentProfile) {
        console.warn('No authenticated user for repost action')
        return
      }

      const response = await fetch('/api/posts/interact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId,
          action: 'repost',
          userId: currentProfile.pseudonym
        })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to repost')
      }

      // Update with real data from server
      setState(prev => ({
        ...prev,
        posts: prev.posts.map(post =>
          post.id === postId ? result.post : post
        )
      }))

      // Generate notification for post author (if not reposting own post)
      const post = result.post
      if (post && post.author !== currentProfile.pseudonym && result.action === 'repost') {
        // Notification would be handled by the API
        console.log(`🔔 Repost notification for ${post.author}`)
      }

      console.log(`🔄 ${result.action} post ${postId}`)
    } catch (error) {
      console.error('Repost error:', error)
    }
  }, [])

  // Load more posts (pagination)
  const loadMore = useCallback(async () => {
    if (state.loading || !state.hasMore) return
    
    await fetchPosts(state.posts.length)
  }, [fetchPosts, state.loading, state.hasMore, state.posts.length])

  // Refresh feed
  const refresh = useCallback(async () => {
    await fetchPosts(0)
  }, [fetchPosts])

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  // Auto-fetch on mount
  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  return {
    // State
    posts: state.posts,
    loading: state.loading,
    error: state.error,
    hasMore: state.hasMore,
    total: state.total,
    
    // Actions
    createPost,
    likePost,
    repost,
    loadMore,
    refresh,
    clearError
  }
} 