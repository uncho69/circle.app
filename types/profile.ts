export interface ProfileStats {
  postsCount: number
  followersCount: number
  followingCount: number
}

export interface PublicProfile {
  pseudonym: string
  displayName: string
  bio?: string | null
  location?: string | null
  website?: string | null
  walletAddressDisplay?: string
  createdAt?: string
  stats?: ProfileStats
  reputation?: number
  zkProofs?: number
  bannerColor?: string
  socialLinks?: {
    twitter?: string
    github?: string
    telegram?: string
    discord?: string
  }
}

