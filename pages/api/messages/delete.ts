import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../../utils/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { ids } = req.body as { ids: string[] }
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: 'IDs array is required' })
    }

    const { error } = await supabase.from('messages').delete().in('id', ids)
    if (error) {
      console.error('Error deleting messages:', error)
      return res.status(500).json({ success: false, error: 'Failed to delete messages' })
    }

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }
}

