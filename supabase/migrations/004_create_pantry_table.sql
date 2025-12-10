-- 調味料ストックテーブル
CREATE TABLE IF NOT EXISTS user_pantry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, item_name)
);

-- RLSポリシー
ALTER TABLE user_pantry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pantry" ON user_pantry
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pantry" ON user_pantry
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own pantry" ON user_pantry
  FOR DELETE USING (auth.uid() = user_id);
