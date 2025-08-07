import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../../utils/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { wallet_address, pseudonym, display_name, bio } = req.body

    if (!wallet_address || !pseudonym) {
      return res.status(400).json({ success: false, error: 'Wallet address and pseudonym are required' })
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', wallet_address.toLowerCase())
      .single()

    if (existingUser) {
      return res.status(409).json({ success: false, error: 'User already exists' })
    }

    // Check if pseudonym is already taken
    const { data: existingPseudonym } = await supabase
      .from('users')
      .select('id')
      .eq('pseudonym', pseudonym)
      .single()

    if (existingPseudonym) {
      return res.status(409).json({ success: false, error: 'Pseudonym already taken' })
    }

    // Create new user
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        wallet_address: wallet_address.toLowerCase(),
        pseudonym,
        display_name: display_name || pseudonym,
        bio: bio || null
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      return res.status(500).json({ success: false, error: 'Failed to create user', details: error })
    }

    console.log('✅ New user created:', newUser.pseudonym)
    return res.status(201).json({ success: true, user: newUser })

  } catch (error) {
    console.error('API error:', error)
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }
} 