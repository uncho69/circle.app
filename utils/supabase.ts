import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface User {
  id: string
  wallet_address: string
  pseudonym: string
  display_name?: string
  bio?: string
  avatar_url?: string
  banner_color?: string
  created_at: string
  updated_at: string
}

export interface Post {
  id: string
  author_id: string
  content: string
  image_url?: string
  is_private: boolean
  created_at: string
  updated_at: string
  author?: User
  likes_count?: number
  reposts_count?: number
  replies_count?: number
}

export interface Follow {
  id: string
  follower_id: string
  following_id: string
  created_at: string
}

export interface Like {
  id: string
  user_id: string
  post_id: string
  created_at: string
} 