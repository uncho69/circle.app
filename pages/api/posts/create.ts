import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../../utils/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { content, image_url, is_private, wallet_address } = req.body

    if (!content || !wallet_address) {
      return res.status(400).json({ success: false, error: 'Content and wallet_address are required' })
    }

    // Get user by wallet address
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', wallet_address.toLowerCase())
      .single()

    if (userError || !user) {
      return res.status(404).json({ success: false, error: 'User not found' })
    }

    // Create post
    const { data: newPost, error } = await supabase
      .from('posts')
      .insert({
        author_id: user.id,
        content,
        image_url: image_url || null,
        is_private: is_private || false
      })
      .select(`
        *,
        author:users!author_id(
          id,
          pseudonym,
          display_name,
          avatar_url
        )
      `)
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return res.status(500).json({ success: false, error: 'Failed to create post' })
    }

    console.log('✅ New post created by:', newPost.author.pseudonym)
    return res.status(201).json({ success: true, post: newPost })

  } catch (error) {
    console.error('API error:', error)
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }
} 