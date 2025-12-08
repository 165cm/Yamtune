-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- familiesテーブル
CREATE TABLE IF NOT EXISTS families (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- membersテーブル（家族メンバー）
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  birth_date DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  relation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- member_foodsテーブル（好き嫌い情報）
CREATE TABLE IF NOT EXISTS member_foods (
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

-- user_productsテーブル（ユーザーと商品の関連）
CREATE TABLE IF NOT EXISTS user_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_families_user_id ON families(user_id);
CREATE INDEX IF NOT EXISTS idx_members_family_id ON members(family_id);
CREATE INDEX IF NOT EXISTS idx_member_foods_member_id ON member_foods(member_id);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_products_user_id ON user_products(user_id);
CREATE INDEX IF NOT EXISTS idx_user_products_product_id ON user_products(product_id);

-- RLS (Row Level Security) ポリシー
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_products ENABLE ROW LEVEL SECURITY;

-- familiesテーブルのポリシー
CREATE POLICY "Users can view their own family"
  ON families FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own family"
  ON families FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own family"
  ON families FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own family"
  ON families FOR DELETE
  USING (auth.uid() = user_id);

-- membersテーブルのポリシー
CREATE POLICY "Users can view members of their family"
  ON members FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM families WHERE families.id = members.family_id AND families.user_id = auth.uid()
  ));

CREATE POLICY "Users can create members in their family"
  ON members FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM families WHERE families.id = members.family_id AND families.user_id = auth.uid()
  ));

CREATE POLICY "Users can update members in their family"
  ON members FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM families WHERE families.id = members.family_id AND families.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete members in their family"
  ON members FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM families WHERE families.id = members.family_id AND families.user_id = auth.uid()
  ));

-- member_foodsテーブルのポリシー
CREATE POLICY "Users can view foods of their family members"
  ON member_foods FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM members
    JOIN families ON families.id = members.family_id
    WHERE members.id = member_foods.member_id AND families.user_id = auth.uid()
  ));

CREATE POLICY "Users can create foods for their family members"
  ON member_foods FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM members
    JOIN families ON families.id = members.family_id
    WHERE members.id = member_foods.member_id AND families.user_id = auth.uid()
  ));

CREATE POLICY "Users can update foods of their family members"
  ON member_foods FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM members
    JOIN families ON families.id = members.family_id
    WHERE members.id = member_foods.member_id AND families.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete foods of their family members"
  ON member_foods FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM members
    JOIN families ON families.id = members.family_id
    WHERE members.id = member_foods.member_id AND families.user_id = auth.uid()
  ));

-- productsテーブルのポリシー（全ユーザーが参照可能）
CREATE POLICY "Anyone can view products"
  ON products FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create products"
  ON products FOR INSERT
  WITH CHECK (true);

-- user_productsテーブルのポリシー
CREATE POLICY "Users can view their own user_products"
  ON user_products FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own user_products"
  ON user_products FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own user_products"
  ON user_products FOR DELETE
  USING (auth.uid() = user_id);
