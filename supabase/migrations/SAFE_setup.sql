-- ステップ1: 既存のテーブル構造を確認・修正
-- このSQLは既存テーブルがある場合でも安全に実行できます

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- productsテーブルが存在する場合、必要なカラムを追加
DO $$
BEGIN
    -- categoryカラムを追加（存在しない場合）
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'products' AND column_name = 'category') THEN
        ALTER TABLE products ADD COLUMN category TEXT;
    END IF;

    -- nutrition_per_100gカラムを追加（存在しない場合）
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'products' AND column_name = 'nutrition_per_100g') THEN
        ALTER TABLE products ADD COLUMN nutrition_per_100g JSONB;
    END IF;

    -- ocr_textカラムを追加（存在しない場合）
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'products' AND column_name = 'ocr_text') THEN
        ALTER TABLE products ADD COLUMN ocr_text TEXT;
    END IF;
END $$;

-- 新しいテーブルを作成（存在しない場合のみ）
CREATE TABLE IF NOT EXISTS families (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL,
  name TEXT NOT NULL,
  birth_date DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  relation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS member_foods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL,
  food_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('like', 'dislike', 'neutral')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT,
  image_url TEXT,
  nutrition JSONB NOT NULL DEFAULT '{}',
  nutrition_per_100g JSONB,
  ocr_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  servings INTEGER DEFAULT 2,
  cooking_time INTEGER,
  difficulty TEXT CHECK (difficulty IN ('簡単', '普通', '難しい')),
  nutrition JSONB,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID NOT NULL,
  product_id UUID,
  name TEXT NOT NULL,
  amount TEXT NOT NULL,
  notes TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recipe_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID NOT NULL,
  step_number INTEGER NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  recipe_id UUID NOT NULL,
  is_favorite BOOLEAN DEFAULT FALSE,
  cooked_count INTEGER DEFAULT 0,
  last_cooked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ユニーク制約を追加（存在しない場合のみ）
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'families_user_id_key') THEN
        ALTER TABLE families ADD CONSTRAINT families_user_id_key UNIQUE (user_id);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'member_foods_member_id_food_name_key') THEN
        ALTER TABLE member_foods ADD CONSTRAINT member_foods_member_id_food_name_key UNIQUE (member_id, food_name);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_products_user_id_product_id_key') THEN
        ALTER TABLE user_products ADD CONSTRAINT user_products_user_id_product_id_key UNIQUE (user_id, product_id);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_recipes_user_id_recipe_id_key') THEN
        ALTER TABLE user_recipes ADD CONSTRAINT user_recipes_user_id_recipe_id_key UNIQUE (user_id, recipe_id);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
END $$;

-- インデックスを作成（存在しない場合のみ）
CREATE INDEX IF NOT EXISTS idx_families_user_id ON families(user_id);
CREATE INDEX IF NOT EXISTS idx_members_family_id ON members(family_id);
CREATE INDEX IF NOT EXISTS idx_member_foods_member_id ON member_foods(member_id);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_products_user_id ON user_products(user_id);
CREATE INDEX IF NOT EXISTS idx_user_products_product_id ON user_products(product_id);
CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON recipes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_product_id ON recipe_ingredients(product_id);
CREATE INDEX IF NOT EXISTS idx_recipe_steps_recipe_id ON recipe_steps(recipe_id);
CREATE INDEX IF NOT EXISTS idx_user_recipes_user_id ON user_recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_recipes_recipe_id ON user_recipes(recipe_id);

-- RLS を有効化
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_recipes ENABLE ROW LEVEL SECURITY;

-- 基本的なポリシー（エラーを無視）
DO $$
BEGIN
    -- products: 誰でも閲覧・作成可能
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Enable read for all') THEN
        CREATE POLICY "Enable read for all" ON products FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Enable insert for all') THEN
        CREATE POLICY "Enable insert for all" ON products FOR INSERT WITH CHECK (true);
    END IF;

    -- user_products: ユーザーは自分のデータのみ
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_products' AND policyname = 'Enable read for own') THEN
        CREATE POLICY "Enable read for own" ON user_products FOR SELECT USING (auth.uid()::text = user_id::text);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_products' AND policyname = 'Enable insert for own') THEN
        CREATE POLICY "Enable insert for own" ON user_products FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_products' AND policyname = 'Enable delete for own') THEN
        CREATE POLICY "Enable delete for own" ON user_products FOR DELETE USING (auth.uid()::text = user_id::text);
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 完了メッセージ
DO $$
BEGIN
    RAISE NOTICE 'セットアップ完了！テーブルが正常に作成されました。';
END $$;
