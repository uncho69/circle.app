-- Circle Social Network Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT UNIQUE NOT NULL,
  pseudonym TEXT UNIQUE NOT NULL,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  banner_color TEXT DEFAULT 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  reputation INTEGER DEFAULT 0,
  zk_proofs INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Posts table
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  is_private BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Follows table
CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- Likes table
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- Reposts table
CREATE TABLE reposts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- Replies table
CREATE TABLE replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  parent_post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Private Circles table
CREATE TABLE circles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  min_eth_required DECIMAL(18,8) DEFAULT 0.1,
  is_private BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Circle Members table
CREATE TABLE circle_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  circle_id UUID REFERENCES circles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(circle_id, user_id)
);

-- Circle Posts table
CREATE TABLE circle_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  circle_id UUID REFERENCES circles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(circle_id, post_id)
);

-- Create indexes for better performance
CREATE INDEX idx_users_wallet_address ON users(wallet_address);
CREATE INDEX idx_users_pseudonym ON users(pseudonym);
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_follows_follower_id ON follows(follower_id);
CREATE INDEX idx_follows_following_id ON follows(following_id);
CREATE INDEX idx_likes_post_id ON likes(post_id);
CREATE INDEX idx_likes_user_id ON likes(user_id);
CREATE INDEX idx_reposts_post_id ON reposts(post_id);
CREATE INDEX idx_replies_parent_post_id ON replies(parent_post_id);

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reposts ENABLE ROW LEVEL SECURITY;
ALTER TABLE replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_posts ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (wallet_address = current_setting('app.wallet_address', true));
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (wallet_address = current_setting('app.wallet_address', true));

-- Posts policies
CREATE POLICY "Posts are viewable by all" ON posts FOR SELECT USING (true);
CREATE POLICY "Users can create posts" ON posts FOR INSERT WITH CHECK (author_id IN (SELECT id FROM users WHERE wallet_address = current_setting('app.wallet_address', true)));
CREATE POLICY "Users can update own posts" ON posts FOR UPDATE USING (author_id IN (SELECT id FROM users WHERE wallet_address = current_setting('app.wallet_address', true)));
CREATE POLICY "Users can delete own posts" ON posts FOR DELETE USING (author_id IN (SELECT id FROM users WHERE wallet_address = current_setting('app.wallet_address', true)));

-- Follows policies
CREATE POLICY "Follows are viewable by all" ON follows FOR SELECT USING (true);
CREATE POLICY "Users can follow/unfollow" ON follows FOR ALL USING (follower_id IN (SELECT id FROM users WHERE wallet_address = current_setting('app.wallet_address', true)));

-- Likes policies
CREATE POLICY "Likes are viewable by all" ON likes FOR SELECT USING (true);
CREATE POLICY "Users can like/unlike" ON likes FOR ALL USING (user_id IN (SELECT id FROM users WHERE wallet_address = current_setting('app.wallet_address', true)));

-- Reposts policies
CREATE POLICY "Reposts are viewable by all" ON reposts FOR SELECT USING (true);
CREATE POLICY "Users can repost" ON reposts FOR ALL USING (user_id IN (SELECT id FROM users WHERE wallet_address = current_setting('app.wallet_address', true)));

-- Replies policies
CREATE POLICY "Replies are viewable by all" ON replies FOR SELECT USING (true);
CREATE POLICY "Users can create replies" ON replies FOR INSERT WITH CHECK (author_id IN (SELECT id FROM users WHERE wallet_address = current_setting('app.wallet_address', true)));
CREATE POLICY "Users can update own replies" ON replies FOR UPDATE USING (author_id IN (SELECT id FROM users WHERE wallet_address = current_setting('app.wallet_address', true)));

-- Circles policies
CREATE POLICY "Circles are viewable by members" ON circles FOR SELECT USING (true);
CREATE POLICY "Users can create circles" ON circles FOR INSERT WITH CHECK (owner_id IN (SELECT id FROM users WHERE wallet_address = current_setting('app.wallet_address', true)));

-- Functions for common operations
CREATE OR REPLACE FUNCTION get_user_stats(user_uuid UUID)
RETURNS TABLE (
  posts_count BIGINT,
  followers_count BIGINT,
  following_count BIGINT,
  likes_received BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM posts WHERE author_id = user_uuid) as posts_count,
    (SELECT COUNT(*) FROM follows WHERE following_id = user_uuid) as followers_count,
    (SELECT COUNT(*) FROM follows WHERE follower_id = user_uuid) as following_count,
    (SELECT COUNT(*) FROM likes l JOIN posts p ON l.post_id = p.id WHERE p.author_id = user_uuid) as likes_received;
END;
$$ LANGUAGE plpgsql;

-- Update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_replies_updated_at BEFORE UPDATE ON replies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_circles_updated_at BEFORE UPDATE ON circles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 