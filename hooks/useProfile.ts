import { useState, useCallback, useEffect } from 'react'
import { PublicProfile, ProfileStats } from '../types/profile'
import { ProfileUpdateRequest } from '../pages/api/profile/update'
import { walletAuth } from '../utils/walletAuth'

export interface ProfileState {
  profile: PublicProfile | null
  loading: boolean
  error: string | null
  updating: boolean
}

export interface ProfileUpdateData {
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
}

export const useProfile = () => {
  const [state, setState] = useState<ProfileState>({
    profile: null,
    loading: false,
    error: null,
    updating: false
  })

  // Get profile by pseudonym or wallet address
  const getProfile = useCallback(async (identifier: string, byPseudonym = true): Promise<PublicProfile | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const queryParam = byPseudonym ? `pseudonym=${identifier}` : `walletAddress=${identifier}`
      const response = await fetch(`/api/profile/get?${queryParam}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch profile')
      }

      setState(prev => ({
        ...prev,
        profile: result.profile,
        loading: false
      }))

      return result.profile
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }))
      return null
    }
  }, [])

  // Update current user's profile
  const updateProfile = useCallback(async (updates: ProfileUpdateData): Promise<boolean> => {
    setState(prev => ({ ...prev, updating: true, error: null }))

    try {
      // Get current user
      const currentProfile = walletAuth.getCurrentProfile()
      if (!currentProfile) {
        throw new Error('No authenticated user found')
      }

      // For demo, generate a dummy signature
      const dummySignature = `update_${Date.now()}_${Math.random().toString(36)}`

      const updateRequest: Omit<ProfileUpdateRequest, 'walletAddress' | 'signature'> & {
        walletAddress: string
        signature: string
      } = {
        walletAddress: currentProfile.walletAddress,
        updates,
        signature: dummySignature
      }

      const response = await fetch('/api/profile/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateRequest)
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to update profile')
      }

      // Update local state if this is the current user's profile
      if (state.profile && state.profile.pseudonym === currentProfile.pseudonym) {
        setState(prev => ({
          ...prev,
          profile: {
            ...prev.profile!,
            ...updates,
            displayName: updates.displayName || prev.profile!.displayName
          },
          updating: false
        }))
      } else {
        setState(prev => ({ ...prev, updating: false }))
      }

      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setState(prev => ({
        ...prev,
        updating: false,
        error: errorMessage
      }))
      return false
    }
  }, [state.profile])

  // Get current user's profile
  const getCurrentUserProfile = useCallback(async (): Promise<PublicProfile | null> => {
    const currentProfile = walletAuth.getCurrentProfile()
    if (!currentProfile) {
      return null
    }

    return await getProfile(currentProfile.pseudonym, true)
  }, [getProfile])

  // Generate avatar from pseudonym
  const generateAvatar = useCallback((pseudonym: string): string => {
    const colors = [
      'from-red-400 to-pink-400',
      'from-blue-400 to-cyan-400', 
      'from-green-400 to-emerald-400',
      'from-purple-400 to-violet-400',
      'from-yellow-400 to-orange-400',
      'from-indigo-400 to-blue-400'
    ]
    
    const hash = pseudonym.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 0)
    
    const colorIndex = Math.abs(hash) % colors.length
    return colors[colorIndex]
  }, [])

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  // Reset state
  const reset = useCallback(() => {
    setState({
      profile: null,
      loading: false,
      error: null,
      updating: false
    })
  }, [])

  // Load current user profile on mount
  useEffect(() => {
    const loadCurrentUser = async () => {
      const currentProfile = walletAuth.getCurrentProfile()
      if (currentProfile && !state.profile) {
        await getProfile(currentProfile.pseudonym, true)
      }
    }
    loadCurrentUser()
  }, [getProfile, state.profile])

  return {
    // State
    profile: state.profile,
    loading: state.loading,
    error: state.error,
    updating: state.updating,
    
    // Actions
    getProfile,
    updateProfile,
    getCurrentUserProfile,
    generateAvatar,
    clearError,
    reset
  }
} 