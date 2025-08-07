import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../../utils/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { wallet_address } = req.query

    if (!wallet_address) {
      return res.status(400).json({ success: false, error: 'Wallet address is required' })
    }

    // Delete user and all related data
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('wallet_address', wallet_address.toString().toLowerCase())

    if (error) {
      console.error('Supabase error:', error)
      return res.status(500).json({ success: false, error: 'Failed to delete user' })
    }

    console.log('✅ User deleted:', wallet_address)
    return res.status(200).json({ success: true, message: 'User deleted successfully' })

  } catch (error) {
    console.error('API error:', error)
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }
} 