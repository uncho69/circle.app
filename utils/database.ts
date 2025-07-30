import Database from 'better-sqlite3'
import path from 'path'

// Database file path
const dbPath = path.join(process.cwd(), 'data', 'decentra.db')

// Initialize database
let db: Database.Database

export const initDatabase = () => {
  try {
    // Ensure data directory exists
    const fs = require('fs')
    const dataDir = path.dirname(dbPath)
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }

    // Open database
    db = new Database(dbPath)
    
    // Enable foreign keys
    db.pragma('foreign_keys = ON')
    
    // Create tables
    createTables()
    
    console.log('✅ Database initialized successfully')
    return db
  } catch (error) {
    console.error('❌ Database initialization failed:', error)
    throw error
  }
}

const createTables = () => {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wallet_address TEXT UNIQUE NOT NULL,
      pseudonym TEXT UNIQUE NOT NULL,
      display_name TEXT,
      bio TEXT,
      location TEXT,
      website TEXT,
      avatar TEXT,
      banner_color TEXT DEFAULT '#1a1a1a',
      social_links TEXT DEFAULT '{}',
      reputation INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Posts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      author_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      image TEXT,
      visibility TEXT DEFAULT 'public',
      likes INTEGER DEFAULT 0,
      reposts INTEGER DEFAULT 0,
      replies INTEGER DEFAULT 0,
      reply_to_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (author_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (reply_to_id) REFERENCES posts (id) ON DELETE CASCADE
    )
  `)

  // Interactions table (likes, reposts)
  db.exec(`
    CREATE TABLE IF NOT EXISTS interactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      post_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('like', 'repost')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE,
      UNIQUE(user_id, post_id, type)
    )
  `)

  // Follows table
  db.exec(`
    CREATE TABLE IF NOT EXISTS follows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      follower_id INTEGER NOT NULL,
      following_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (follower_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (following_id) REFERENCES users (id) ON DELETE CASCADE,
      UNIQUE(follower_id, following_id)
    )
  `)

  // Notifications table
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      from_user_id INTEGER,
      post_id INTEGER,
      type TEXT NOT NULL CHECK (type IN ('like', 'repost', 'reply', 'follow')),
      content TEXT,
      read BOOLEAN DEFAULT FALSE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (from_user_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE
    )
  `)

  // ZK Proofs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS zk_proofs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      proof_type TEXT NOT NULL,
      proof_data TEXT NOT NULL,
      verified BOOLEAN DEFAULT FALSE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `)

  console.log('✅ Database tables created successfully')
}

// Database operations
export const getDatabase = () => {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.')
  }
  return db
}

// User operations
export const createUser = (userData: {
  walletAddress: string
  pseudonym: string
  displayName?: string
  bio?: string
  location?: string
  website?: string
  avatar?: string
  bannerColor?: string
  socialLinks?: any
  reputation?: number
  createdAt?: string
  lastLogin?: string
}) => {
  const db = getDatabase()
  const stmt = db.prepare(`
    INSERT INTO users (
      wallet_address, pseudonym, display_name, bio, location, website, 
      avatar, banner_color, social_links, reputation, created_at, last_login
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  
  const result = stmt.run(
    userData.walletAddress.toLowerCase(),
    userData.pseudonym,
    userData.displayName || userData.pseudonym,
    userData.bio || '',
    userData.location || '',
    userData.website || '',
    userData.avatar || '',
    userData.bannerColor || '#1DA1F2',
    JSON.stringify(userData.socialLinks || {}),
    userData.reputation || 0,
    userData.createdAt || new Date().toISOString(),
    userData.lastLogin || new Date().toISOString()
  )
  
  return result.lastInsertRowid
}

export const getUserByWallet = (walletAddress: string) => {
  const db = getDatabase()
  const normalizedAddress = walletAddress.toLowerCase()
  
  console.log('🔍 Looking up user by wallet:', normalizedAddress)
  
  const stmt = db.prepare('SELECT * FROM users WHERE wallet_address = ?')
  const user = stmt.get(normalizedAddress)
  
  console.log('Found user:', user)
  
  return user
}

export const getUserByPseudonym = (pseudonym: string) => {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM users WHERE pseudonym = ?')
  return stmt.get(pseudonym)
}

export const updateUser = (walletAddress: string, updates: any) => {
  const db = getDatabase()
  const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ')
  const values = Object.values(updates)
  
  const stmt = db.prepare(`
    UPDATE users 
    SET ${fields}, updated_at = CURRENT_TIMESTAMP
    WHERE wallet_address = ?
  `)
  
  return stmt.run(...values, walletAddress.toLowerCase())
}

// Post operations
export const createPost = (postData: {
  authorId: number
  content: string
  image?: string
  visibility?: string
  replyToId?: number
}) => {
  const db = getDatabase()
  const now = new Date().toISOString()
  
  console.log('Creating post with timestamp:', now)
  
  const stmt = db.prepare(`
    INSERT INTO posts (author_id, content, image, visibility, reply_to_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `)
  
  const result = stmt.run(
    postData.authorId,
    postData.content,
    postData.image || null,
    postData.visibility || 'public',
    postData.replyToId || null,
    now
  )
  
  return result.lastInsertRowid
}



export const getPosts = (limit = 20, offset = 0, userId?: number) => {
  const db = getDatabase()
  
  let query = `
    SELECT 
      p.*,
      u.pseudonym as author,
      u.display_name as author_display_name,
      u.avatar as author_avatar
    FROM posts p
    JOIN users u ON p.author_id = u.id
    WHERE p.reply_to_id IS NULL
  `
  
  if (userId) {
    query += ` AND (p.visibility = 'public' OR p.author_id = ? OR p.author_id IN (
      SELECT following_id FROM follows WHERE follower_id = ?
    ))`
  } else {
    query += ` AND p.visibility = 'public'`
  }
  
  query += ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`
  
  const stmt = db.prepare(query)
  const params = userId ? [userId, userId, limit, offset] : [limit, offset]
  
  return stmt.all(...params)
}

export const getPostById = (postId: number) => {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT 
      p.*,
      u.pseudonym as author,
      u.display_name as author_display_name,
      u.avatar as author_avatar
    FROM posts p
    JOIN users u ON p.author_id = u.id
    WHERE p.id = ?
  `)
  
  return stmt.get(postId)
}

export const updatePostStats = (postId: number) => {
  const db = getDatabase()
  
  // Update likes count
  db.prepare(`
    UPDATE posts 
    SET likes = (SELECT COUNT(*) FROM interactions WHERE post_id = ? AND type = 'like')
    WHERE id = ?
  `).run(postId, postId)
  
  // Update reposts count
  db.prepare(`
    UPDATE posts 
    SET reposts = (SELECT COUNT(*) FROM interactions WHERE post_id = ? AND type = 'repost')
    WHERE id = ?
  `).run(postId, postId)
  
  // Update replies count
  db.prepare(`
    UPDATE posts 
    SET replies = (SELECT COUNT(*) FROM posts WHERE reply_to_id = ?)
    WHERE id = ?
  `).run(postId, postId)
}

// Interaction operations
export const addInteraction = (userId: number, postId: number, type: 'like' | 'repost') => {
  const db = getDatabase()
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO interactions (user_id, post_id, type)
    VALUES (?, ?, ?)
  `)
  
  const result = stmt.run(userId, postId, type)
  
  if (result.changes > 0) {
    updatePostStats(postId)
    return true
  }
  
  return false
}

export const removeInteraction = (userId: number, postId: number, type: 'like' | 'repost') => {
  const db = getDatabase()
  const stmt = db.prepare(`
    DELETE FROM interactions 
    WHERE user_id = ? AND post_id = ? AND type = ?
  `)
  
  const result = stmt.run(userId, postId, type)
  
  if (result.changes > 0) {
    updatePostStats(postId)
    return true
  }
  
  return false
}

export const hasInteraction = (userId: number, postId: number, type: 'like' | 'repost') => {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT COUNT(*) as count 
    FROM interactions 
    WHERE user_id = ? AND post_id = ? AND type = ?
  `)
  
  const result = stmt.get(userId, postId, type) as { count: number }
  return result.count > 0
}

// Follow operations
export const followUser = (followerId: number, followingId: number) => {
  const db = getDatabase()
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO follows (follower_id, following_id)
    VALUES (?, ?)
  `)
  
  return stmt.run(followerId, followingId).changes > 0
}

export const unfollowUser = (followerId: number, followingId: number) => {
  const db = getDatabase()
  const stmt = db.prepare(`
    DELETE FROM follows 
    WHERE follower_id = ? AND following_id = ?
  `)
  
  return stmt.run(followerId, followingId).changes > 0
}

export const isFollowing = (followerId: number, followingId: number) => {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT COUNT(*) as count 
    FROM follows 
    WHERE follower_id = ? AND following_id = ?
  `)
  
  const result = stmt.get(followerId, followingId) as { count: number }
  return result.count > 0
}

// Delete all posts by a user
export const deleteUserPosts = (pseudonym: string) => {
  const db = getDatabase()
  
  // First get the user ID
  const user = getUserByPseudonym(pseudonym) as any
  if (!user || !user.id) {
    return 0
  }
  
  // Delete all posts by this user
  const stmt = db.prepare(`
    DELETE FROM posts 
    WHERE author_id = ?
  `)
  
  const result = stmt.run(user.id) as any
  return result.changes
}

// Close database
export const closeDatabase = () => {
  if (db) {
    db.close()
    console.log('✅ Database closed successfully')
  }
} 
 
 

 