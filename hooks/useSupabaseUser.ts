import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import { User } from '../utils/supabase'

export const useSupabaseUser = (walletAddress: string | null) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!walletAddress) {
      setUser(null)
      setLoading(false)
      return
    }

    const fetchUser = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('wallet_address', walletAddress.toLowerCase())
          .single()

        if (error) {
          if (error.code === 'PGRST116') {
            // User not found - this is normal for new wallets
            setUser(null)
          } else {
            console.error('Error fetching user:', error)
            setError(error.message)
          }
        } else {
          setUser(data)
        }
      } catch (err) {
        console.error('Error in fetchUser:', err)
        setError('Failed to fetch user')
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [walletAddress])

  const createUser = async (pseudonym: string, displayName?: string, bio?: string) => {
    if (!walletAddress) {
      throw new Error('Wallet address is required')
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('users')
        .insert({
          wallet_address: walletAddress.toLowerCase(),
          pseudonym,
          display_name: displayName || pseudonym,
          bio: bio || null
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating user:', error)
        setError(error.message)
        throw new Error(error.message)
      }

      setUser(data)
      return data
    } catch (err) {
      console.error('Error in createUser:', err)
      setError('Failed to create user')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const updateUser = async (updates: Partial<User>) => {
    if (!user?.id) {
      throw new Error('No user to update')
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating user:', error)
        setError(error.message)
        throw new Error(error.message)
      }

      setUser(data)
      return data
    } catch (err) {
      console.error('Error in updateUser:', err)
      setError('Failed to update user')
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    user,
    loading,
    error,
    createUser,
    updateUser
  }
} 