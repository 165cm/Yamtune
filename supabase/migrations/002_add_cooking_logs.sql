-- ========================================
-- Phase 5: 調理記録機能のためのテーブル追加
-- ========================================

-- cooking_logsテーブルの作成
CREATE TABLE IF NOT EXISTS cooking_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  recipe_id UUID NOT NULL,
  cooked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  image_url TEXT,
  notes TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_cooking_logs_user_id ON cooking_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_cooking_logs_recipe_id ON cooking_logs(recipe_id);
CREATE INDEX IF NOT EXISTS idx_cooking_logs_cooked_at ON cooking_logs(cooked_at DESC);

-- RLSを有効化
ALTER TABLE cooking_logs ENABLE ROW LEVEL SECURITY;

-- ポリシーの作成: 自分の調理記録のみアクセス可能
CREATE POLICY "Enable all for own cooking logs" ON cooking_logs FOR ALL
USING (auth.uid()::text = user_id::text);

-- 完了メッセージ
DO $$
BEGIN
    RAISE NOTICE '✅ 調理記録テーブル（cooking_logs）が作成されました！';
END $$;
