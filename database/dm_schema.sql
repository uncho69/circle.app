-- Direct Messages Schema for Circle Platform

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id UUID REFERENCES users(id) ON DELETE CASCADE,
  user2_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user1_id, user2_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_encrypted BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_users ON conversations(user1_id, user2_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- RLS Policies for conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own conversations" ON conversations
  FOR SELECT USING (
    user1_id IN (SELECT id FROM users WHERE wallet_address = current_setting('app.wallet_address', true))
    OR 
    user2_id IN (SELECT id FROM users WHERE wallet_address = current_setting('app.wallet_address', true))
  );

CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT WITH CHECK (
    user1_id IN (SELECT id FROM users WHERE wallet_address = current_setting('app.wallet_address', true))
    OR 
    user2_id IN (SELECT id FROM users WHERE wallet_address = current_setting('app.wallet_address', true))
  );

-- RLS Policies for messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their conversations" ON messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE user1_id IN (SELECT id FROM users WHERE wallet_address = current_setting('app.wallet_address', true))
      OR user2_id IN (SELECT id FROM users WHERE wallet_address = current_setting('app.wallet_address', true))
    )
  );

CREATE POLICY "Users can send messages in their conversations" ON messages
  FOR INSERT WITH CHECK (
    sender_id IN (SELECT id FROM users WHERE wallet_address = current_setting('app.wallet_address', true))
    AND
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE user1_id IN (SELECT id FROM users WHERE wallet_address = current_setting('app.wallet_address', true))
      OR user2_id IN (SELECT id FROM users WHERE wallet_address = current_setting('app.wallet_address', true))
    )
  );

-- Function to get or create conversation
CREATE OR REPLACE FUNCTION get_or_create_conversation(user1_pseudonym TEXT, user2_pseudonym TEXT)
RETURNS UUID AS $$
DECLARE
  user1_id UUID;
  user2_id UUID;
  conversation_id UUID;
BEGIN
  -- Get user IDs
  SELECT id INTO user1_id FROM users WHERE pseudonym = user1_pseudonym;
  SELECT id INTO user2_id FROM users WHERE pseudonym = user2_pseudonym;
  
  IF user1_id IS NULL OR user2_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Try to find existing conversation
  SELECT id INTO conversation_id 
  FROM conversations 
  WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1);
  
  -- Create new conversation if not exists
  IF conversation_id IS NULL THEN
    INSERT INTO conversations (user1_id, user2_id)
    VALUES (user1_id, user2_id)
    RETURNING id INTO conversation_id;
  END IF;
  
  RETURN conversation_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get conversation list for a user
CREATE OR REPLACE FUNCTION get_user_conversations(user_pseudonym TEXT)
RETURNS TABLE (
  conversation_id UUID,
  other_user_pseudonym TEXT,
  other_user_display_name TEXT,
  last_message TEXT,
  last_message_time TIMESTAMP WITH TIME ZONE,
  unread_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    CASE 
      WHEN u1.pseudonym = user_pseudonym THEN u2.pseudonym
      ELSE u1.pseudonym
    END as other_user_pseudonym,
    CASE 
      WHEN u1.pseudonym = user_pseudonym THEN COALESCE(u2.display_name, u2.pseudonym)
      ELSE COALESCE(u1.display_name, u1.pseudonym)
    END as other_user_display_name,
    m.content as last_message,
    m.created_at as last_message_time,
    COUNT(CASE WHEN m2.id IS NOT NULL AND m2.sender_id != (SELECT id FROM users WHERE pseudonym = user_pseudonym) THEN 1 END) as unread_count
  FROM conversations c
  JOIN users u1 ON c.user1_id = u1.id
  JOIN users u2 ON c.user2_id = u2.id
  LEFT JOIN LATERAL (
    SELECT content, created_at 
    FROM messages 
    WHERE conversation_id = c.id 
    ORDER BY created_at DESC 
    LIMIT 1
  ) m ON true
  LEFT JOIN messages m2 ON m2.conversation_id = c.id AND m2.created_at > (
    SELECT COALESCE(MAX(last_read), '1970-01-01'::timestamp) 
    FROM user_conversation_reads 
    WHERE user_id = (SELECT id FROM users WHERE pseudonym = user_pseudonym) 
    AND conversation_id = c.id
  )
  WHERE u1.pseudonym = user_pseudonym OR u2.pseudonym = user_pseudonym
  GROUP BY c.id, u1.pseudonym, u2.pseudonym, u1.display_name, u2.display_name, m.content, m.created_at
  ORDER BY m.created_at DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- Table to track read messages
CREATE TABLE IF NOT EXISTS user_conversation_reads (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  last_read TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, conversation_id)
);

-- RLS for read tracking
ALTER TABLE user_conversation_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own read status" ON user_conversation_reads
  FOR ALL USING (
    user_id IN (SELECT id FROM users WHERE wallet_address = current_setting('app.wallet_address', true))
  ); 