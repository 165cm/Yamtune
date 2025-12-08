-- RLS (Row Level Security) を有効化
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_recipes ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除（エラーを無視）
DROP POLICY IF EXISTS "Users can view their own family" ON families;
DROP POLICY IF EXISTS "Users can create their own family" ON families;
DROP POLICY IF EXISTS "Users can update their own family" ON families;
DROP POLICY IF EXISTS "Users can delete their own family" ON families;

DROP POLICY IF EXISTS "Users can view members of their family" ON members;
DROP POLICY IF EXISTS "Users can create members in their family" ON members;
DROP POLICY IF EXISTS "Users can update members in their family" ON members;
DROP POLICY IF EXISTS "Users can delete members in their family" ON members;

DROP POLICY IF EXISTS "Users can view foods of their family members" ON member_foods;
DROP POLICY IF EXISTS "Users can create foods for their family members" ON member_foods;
DROP POLICY IF EXISTS "Users can update foods of their family members" ON member_foods;
DROP POLICY IF EXISTS "Users can delete foods of their family members" ON member_foods;

DROP POLICY IF EXISTS "Anyone can view products" ON products;
DROP POLICY IF EXISTS "Anyone can create products" ON products;

DROP POLICY IF EXISTS "Users can view their own user_products" ON user_products;
DROP POLICY IF EXISTS "Users can create their own user_products" ON user_products;
DROP POLICY IF EXISTS "Users can delete their own user_products" ON user_products;

DROP POLICY IF EXISTS "Users can view their own recipes" ON recipes;
DROP POLICY IF EXISTS "Users can create their own recipes" ON recipes;
DROP POLICY IF EXISTS "Users can update their own recipes" ON recipes;
DROP POLICY IF EXISTS "Users can delete their own recipes" ON recipes;

DROP POLICY IF EXISTS "Users can view ingredients of their recipes" ON recipe_ingredients;
DROP POLICY IF EXISTS "Users can create ingredients for their recipes" ON recipe_ingredients;
DROP POLICY IF EXISTS "Users can update ingredients of their recipes" ON recipe_ingredients;
DROP POLICY IF EXISTS "Users can delete ingredients of their recipes" ON recipe_ingredients;

DROP POLICY IF EXISTS "Users can view steps of their recipes" ON recipe_steps;
DROP POLICY IF EXISTS "Users can create steps for their recipes" ON recipe_steps;
DROP POLICY IF EXISTS "Users can update steps of their recipes" ON recipe_steps;
DROP POLICY IF EXISTS "Users can delete steps of their recipes" ON recipe_steps;

DROP POLICY IF EXISTS "Users can view their own user_recipes" ON user_recipes;
DROP POLICY IF EXISTS "Users can create their own user_recipes" ON user_recipes;
DROP POLICY IF EXISTS "Users can update their own user_recipes" ON user_recipes;
DROP POLICY IF EXISTS "Users can delete their own user_recipes" ON user_recipes;

-- familiesテーブルのポリシー
CREATE POLICY "Users can view their own family"
  ON families FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own family"
  ON families FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own family"
  ON families FOR UPDATE
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own family"
  ON families FOR DELETE
  USING (auth.uid()::text = user_id::text);

-- membersテーブルのポリシー
CREATE POLICY "Users can view members of their family"
  ON members FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM families WHERE families.id::text = members.family_id::text AND families.user_id::text = auth.uid()::text
  ));

CREATE POLICY "Users can create members in their family"
  ON members FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM families WHERE families.id::text = members.family_id::text AND families.user_id::text = auth.uid()::text
  ));

CREATE POLICY "Users can update members in their family"
  ON members FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM families WHERE families.id::text = members.family_id::text AND families.user_id::text = auth.uid()::text
  ));

CREATE POLICY "Users can delete members in their family"
  ON members FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM families WHERE families.id::text = members.family_id::text AND families.user_id::text = auth.uid()::text
  ));

-- member_foodsテーブルのポリシー
CREATE POLICY "Users can view foods of their family members"
  ON member_foods FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM members
    JOIN families ON families.id::text = members.family_id::text
    WHERE members.id::text = member_foods.member_id::text AND families.user_id::text = auth.uid()::text
  ));

CREATE POLICY "Users can create foods for their family members"
  ON member_foods FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM members
    JOIN families ON families.id::text = members.family_id::text
    WHERE members.id::text = member_foods.member_id::text AND families.user_id::text = auth.uid()::text
  ));

CREATE POLICY "Users can update foods of their family members"
  ON member_foods FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM members
    JOIN families ON families.id::text = members.family_id::text
    WHERE members.id::text = member_foods.member_id::text AND families.user_id::text = auth.uid()::text
  ));

CREATE POLICY "Users can delete foods of their family members"
  ON member_foods FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM members
    JOIN families ON families.id::text = members.family_id::text
    WHERE members.id::text = member_foods.member_id::text AND families.user_id::text = auth.uid()::text
  ));

-- productsテーブルのポリシー（全ユーザーが参照・作成可能）
CREATE POLICY "Anyone can view products"
  ON products FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create products"
  ON products FOR INSERT
  WITH CHECK (true);

-- user_productsテーブルのポリシー
CREATE POLICY "Users can view their own user_products"
  ON user_products FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own user_products"
  ON user_products FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own user_products"
  ON user_products FOR DELETE
  USING (auth.uid()::text = user_id::text);

-- recipesテーブルのポリシー
CREATE POLICY "Users can view their own recipes"
  ON recipes FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own recipes"
  ON recipes FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own recipes"
  ON recipes FOR UPDATE
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own recipes"
  ON recipes FOR DELETE
  USING (auth.uid()::text = user_id::text);

-- recipe_ingredientsテーブルのポリシー
CREATE POLICY "Users can view ingredients of their recipes"
  ON recipe_ingredients FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM recipes WHERE recipes.id::text = recipe_ingredients.recipe_id::text AND recipes.user_id::text = auth.uid()::text
  ));

CREATE POLICY "Users can create ingredients for their recipes"
  ON recipe_ingredients FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM recipes WHERE recipes.id::text = recipe_ingredients.recipe_id::text AND recipes.user_id::text = auth.uid()::text
  ));

CREATE POLICY "Users can update ingredients of their recipes"
  ON recipe_ingredients FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM recipes WHERE recipes.id::text = recipe_ingredients.recipe_id::text AND recipes.user_id::text = auth.uid()::text
  ));

CREATE POLICY "Users can delete ingredients of their recipes"
  ON recipe_ingredients FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM recipes WHERE recipes.id::text = recipe_ingredients.recipe_id::text AND recipes.user_id::text = auth.uid()::text
  ));

-- recipe_stepsテーブルのポリシー
CREATE POLICY "Users can view steps of their recipes"
  ON recipe_steps FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM recipes WHERE recipes.id::text = recipe_steps.recipe_id::text AND recipes.user_id::text = auth.uid()::text
  ));

CREATE POLICY "Users can create steps for their recipes"
  ON recipe_steps FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM recipes WHERE recipes.id::text = recipe_steps.recipe_id::text AND recipes.user_id::text = auth.uid()::text
  ));

CREATE POLICY "Users can update steps of their recipes"
  ON recipe_steps FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM recipes WHERE recipes.id::text = recipe_steps.recipe_id::text AND recipes.user_id::text = auth.uid()::text
  ));

CREATE POLICY "Users can delete steps of their recipes"
  ON recipe_steps FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM recipes WHERE recipes.id::text = recipe_steps.recipe_id::text AND recipes.user_id::text = auth.uid()::text
  ));

-- user_recipesテーブルのポリシー
CREATE POLICY "Users can view their own user_recipes"
  ON user_recipes FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own user_recipes"
  ON user_recipes FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own user_recipes"
  ON user_recipes FOR UPDATE
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own user_recipes"
  ON user_recipes FOR DELETE
  USING (auth.uid()::text = user_id::text);
