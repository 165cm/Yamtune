-- ========================================
-- Yamtune データベース完全リセット
-- ========================================
-- このSQLは既存のテーブルを全て削除して、
-- クリーンな状態から作り直します。
-- ========================================

-- ステップ1: 既存のテーブルを全て削除
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

-- ステップ3: テーブルを作成
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
  family_id UUID NOT NULL,
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
  member_id UUID NOT NULL,
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
  product_id UUID NOT NULL,
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
  recipe_id UUID NOT NULL,
  product_id UUID,
  name TEXT NOT NULL,
  amount TEXT NOT NULL,
  notes TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- recipe_stepsテーブル
CREATE TABLE recipe_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID NOT NULL,
  step_number INTEGER NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- user_recipesテーブル
CREATE TABLE user_recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  recipe_id UUID NOT NULL,
  is_favorite BOOLEAN DEFAULT FALSE,
  cooked_count INTEGER DEFAULT 0,
  last_cooked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, recipe_id)
);

-- ステップ4: インデックスを作成
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

-- ステップ5: RLSを有効化
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_recipes ENABLE ROW LEVEL SECURITY;

-- ステップ6: 基本的なポリシーを作成
-- products: 誰でも閲覧・作成可能
CREATE POLICY "Enable read for all" ON products FOR SELECT USING (true);
CREATE POLICY "Enable insert for all" ON products FOR INSERT WITH CHECK (true);

-- user_products: 自分のデータのみ
CREATE POLICY "Enable read for own" ON user_products FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Enable insert for own" ON user_products FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Enable delete for own" ON user_products FOR DELETE USING (auth.uid()::text = user_id::text);

-- families: 自分のデータのみ
CREATE POLICY "Enable all for own family" ON families FOR ALL USING (auth.uid()::text = user_id::text);

-- members: 自分の家族のメンバーのみ
CREATE POLICY "Enable all for own family members" ON members FOR ALL
USING (EXISTS (SELECT 1 FROM families WHERE families.id::text = members.family_id::text AND families.user_id::text = auth.uid()::text));

-- member_foods: 自分の家族のメンバーの好き嫌いのみ
CREATE POLICY "Enable all for own family member foods" ON member_foods FOR ALL
USING (EXISTS (
  SELECT 1 FROM members
  JOIN families ON families.id::text = members.family_id::text
  WHERE members.id::text = member_foods.member_id::text AND families.user_id::text = auth.uid()::text
));

-- recipes: 自分のレシピのみ
CREATE POLICY "Enable all for own recipes" ON recipes FOR ALL USING (auth.uid()::text = user_id::text);

-- recipe_ingredients: 自分のレシピの材料のみ
CREATE POLICY "Enable all for own recipe ingredients" ON recipe_ingredients FOR ALL
USING (EXISTS (SELECT 1 FROM recipes WHERE recipes.id::text = recipe_ingredients.recipe_id::text AND recipes.user_id::text = auth.uid()::text));

-- recipe_steps: 自分のレシピの手順のみ
CREATE POLICY "Enable all for own recipe steps" ON recipe_steps FOR ALL
USING (EXISTS (SELECT 1 FROM recipes WHERE recipes.id::text = recipe_steps.recipe_id::text AND recipes.user_id::text = auth.uid()::text));

-- user_recipes: 自分のデータのみ
CREATE POLICY "Enable all for own user recipes" ON user_recipes FOR ALL USING (auth.uid()::text = user_id::text);

-- 完了メッセージ
DO $$
BEGIN
    RAISE NOTICE '✅ データベースリセット完了！全てのテーブルが作成されました。';
END $$;
