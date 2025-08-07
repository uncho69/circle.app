import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../../utils/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { wallet_address } = req.query
    const { pseudonym, display_name, bio, avatar_url, banner_color } = req.body

    if (!wallet_address) {
      return res.status(400).json({ success: false, error: 'Wallet address is required' })
    }

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', wallet_address.toString().toLowerCase())
      .single()

    if (!existingUser) {
      return res.status(404).json({ success: false, error: 'User not found' })
    }

    // Check if new pseudonym is already taken (if changing)
    if (pseudonym) {
      const { data: existingPseudonym } = await supabase
        .from('users')
        .select('id')
        .eq('pseudonym', pseudonym)
        .neq('id', existingUser.id)
        .single()

      if (existingPseudonym) {
        return res.status(409).json({ success: false, error: 'Pseudonym already taken' })
      }
    }

    // Update user
    const updateData: any = {}
    if (pseudonym) updateData.pseudonym = pseudonym
    if (display_name) updateData.display_name = display_name
    if (bio !== undefined) updateData.bio = bio
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url
    if (banner_color !== undefined) updateData.banner_color = banner_color

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', existingUser.id)
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return res.status(500).json({ success: false, error: 'Failed to update user' })
    }

    console.log('✅ User updated:', updatedUser.pseudonym)
    return res.status(200).json({ success: true, user: updatedUser })

  } catch (error) {
    console.error('API error:', error)
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }
} 