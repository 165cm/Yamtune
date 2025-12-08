-- ========================================
-- Yamtune データベース完全リセット (完全版)
-- ========================================
-- このSQLは既存のテーブルを全て削除して、
-- クリーンな状態から作り直します。
-- Supabase SQL Editorで実行してください。
-- ========================================

-- ステップ1: 既存のテーブルを全て削除
DROP TABLE IF EXISTS cooking_logs CASCADE;
DROP TABLE IF EXISTS user_recipes CASCADE;
DROP TABLE IF EXISTS recipe_steps CASCADE;
DROP TABLE IF EXISTS recipe_ingredients CASCADE;
DROP TABLE IF EXISTS recipes CASCADE;
DROP TABLE IF EXISTS user_products CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS member_foods CASCADE;
DROP TABLE IF EXISTS members CASCADE;
DROP TABLE IF EXISTS families CASCADE;

-- ステップ2: UUID拡張を有効化
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- テーブル作成
-- ========================================

-- familiesテーブル
CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- membersテーブル
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  birth_date DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  relation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- member_foodsテーブル
CREATE TABLE member_foods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  food_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('like', 'dislike', 'neutral')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(member_id, food_name)
);

-- productsテーブル
CREATE TABLE products (
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

-- user_productsテーブル
CREATE TABLE user_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- recipesテーブル
CREATE TABLE recipes (
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

-- recipe_ingredientsテーブル
CREATE TABLE recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  amount TEXT NOT NULL,
  notes TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- recipe_stepsテーブル
CREATE TABLE recipe_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- user_recipesテーブル
CREATE TABLE user_recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  is_favorite BOOLEAN DEFAULT FALSE,
  cooked_count INTEGER DEFAULT 0,
  last_cooked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, recipe_id)
);

-- cooking_logsテーブル
CREATE TABLE cooking_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  cooked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  image_url TEXT,
  notes TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- インデックス作成
-- ========================================
CREATE INDEX idx_families_user_id ON families(user_id);
CREATE INDEX idx_members_family_id ON members(family_id);
CREATE INDEX idx_member_foods_member_id ON member_foods(member_id);
CREATE INDEX idx_products_created_at ON products(created_at DESC);
CREATE INDEX idx_user_products_user_id ON user_products(user_id);
CREATE INDEX idx_user_products_product_id ON user_products(product_id);
CREATE INDEX idx_recipes_user_id ON recipes(user_id);
CREATE INDEX idx_recipes_created_at ON recipes(created_at DESC);
CREATE INDEX idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
CREATE INDEX idx_recipe_ingredients_product_id ON recipe_ingredients(product_id);
CREATE INDEX idx_recipe_steps_recipe_id ON recipe_steps(recipe_id);
CREATE INDEX idx_user_recipes_user_id ON user_recipes(user_id);
CREATE INDEX idx_user_recipes_recipe_id ON user_recipes(recipe_id);
CREATE INDEX idx_cooking_logs_user_id ON cooking_logs(user_id);
CREATE INDEX idx_cooking_logs_recipe_id ON cooking_logs(recipe_id);
CREATE INDEX idx_cooking_logs_cooked_at ON cooking_logs(cooked_at DESC);

-- ========================================
-- RLS (Row Level Security) を有効化
-- ========================================
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cooking_logs ENABLE ROW LEVEL SECURITY;

-- ========================================
-- RLSポリシー作成
-- ========================================

-- products: 誰でも閲覧・作成可能
CREATE POLICY "Enable read for all" ON products FOR SELECT USING (true);
CREATE POLICY "Enable insert for all" ON products FOR INSERT WITH CHECK (true);

-- user_products: 自分のデータのみ
CREATE POLICY "Enable all for own user_products" ON user_products FOR ALL
USING (auth.uid()::text = user_id::text);

-- families: 自分のデータのみ
CREATE POLICY "Enable all for own family" ON families FOR ALL
USING (auth.uid()::text = user_id::text);

-- members: 自分の家族のメンバーのみ
CREATE POLICY "Enable all for own family members" ON members FOR ALL
USING (EXISTS (
  SELECT 1 FROM families
  WHERE families.id = members.family_id
  AND families.user_id::text = auth.uid()::text
));

-- member_foods: 自分の家族のメンバーの好き嫌いのみ
CREATE POLICY "Enable all for own family member foods" ON member_foods FOR ALL
USING (EXISTS (
  SELECT 1 FROM members
  JOIN families ON families.id = members.family_id
  WHERE members.id = member_foods.member_id
  AND families.user_id::text = auth.uid()::text
));

-- recipes: 自分のレシピのみ
CREATE POLICY "Enable all for own recipes" ON recipes FOR ALL
USING (auth.uid()::text = user_id::text);

-- recipe_ingredients: 自分のレシピの材料のみ
CREATE POLICY "Enable all for own recipe ingredients" ON recipe_ingredients FOR ALL
USING (EXISTS (
  SELECT 1 FROM recipes
  WHERE recipes.id = recipe_ingredients.recipe_id
  AND recipes.user_id::text = auth.uid()::text
));

-- recipe_steps: 自分のレシピの手順のみ
CREATE POLICY "Enable all for own recipe steps" ON recipe_steps FOR ALL
USING (EXISTS (
  SELECT 1 FROM recipes
  WHERE recipes.id = recipe_steps.recipe_id
  AND recipes.user_id::text = auth.uid()::text
));

-- user_recipes: 自分のデータのみ
CREATE POLICY "Enable all for own user recipes" ON user_recipes FOR ALL
USING (auth.uid()::text = user_id::text);

-- cooking_logs: 自分のデータのみ
CREATE POLICY "Enable all for own cooking logs" ON cooking_logs FOR ALL
USING (auth.uid()::text = user_id::text);

-- ========================================
-- 完了メッセージ
-- ========================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ データベースリセット完了！';
    RAISE NOTICE '========================================';
    RAISE NOTICE '作成されたテーブル:';
    RAISE NOTICE '  - families (家族)';
    RAISE NOTICE '  - members (家族メンバー)';
    RAISE NOTICE '  - member_foods (好き嫌い)';
    RAISE NOTICE '  - products (商品)';
    RAISE NOTICE '  - user_products (ユーザー商品)';
    RAISE NOTICE '  - recipes (レシピ)';
    RAISE NOTICE '  - recipe_ingredients (材料)';
    RAISE NOTICE '  - recipe_steps (手順)';
    RAISE NOTICE '  - user_recipes (ユーザーレシピ)';
    RAISE NOTICE '  - cooking_logs (調理記録)';
    RAISE NOTICE '========================================';
END $$;
