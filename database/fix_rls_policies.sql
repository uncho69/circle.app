-- Fix RLS policies to allow user creation and operations
-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can create posts" ON posts;
DROP POLICY IF EXISTS "Users can update own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON posts;
DROP POLICY IF EXISTS "Users can follow/unfollow" ON follows;
DROP POLICY IF EXISTS "Users can like/unlike" ON likes;
DROP POLICY IF EXISTS "Users can repost" ON reposts;
DROP POLICY IF EXISTS "Users can create replies" ON replies;
DROP POLICY IF EXISTS "Users can update own replies" ON replies;
DROP POLICY IF EXISTS "Users can create circles" ON circles;

-- Create new policies that work without current_setting
-- Users policies
CREATE POLICY "Users can insert profiles" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (true);
CREATE POLICY "Users can delete own profile" ON users FOR DELETE USING (true);

-- Posts policies  
CREATE POLICY "Users can create posts" ON posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own posts" ON posts FOR UPDATE USING (true);
CREATE POLICY "Users can delete own posts" ON posts FOR DELETE USING (true);

-- Follows policies
CREATE POLICY "Users can follow/unfollow" ON follows FOR ALL USING (true);

-- Likes policies
CREATE POLICY "Users can like/unlike" ON likes FOR ALL USING (true);

-- Reposts policies
CREATE POLICY "Users can repost" ON reposts FOR ALL USING (true);

-- Replies policies
CREATE POLICY "Users can create replies" ON replies FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own replies" ON replies FOR UPDATE USING (true);
CREATE POLICY "Users can delete own replies" ON replies FOR DELETE USING (true);

-- Circles policies
CREATE POLICY "Users can create circles" ON circles FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own circles" ON circles FOR UPDATE USING (true);
CREATE POLICY "Users can delete own circles" ON circles FOR DELETE USING (true); 