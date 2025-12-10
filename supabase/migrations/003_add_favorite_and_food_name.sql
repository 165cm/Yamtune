-- user_productsテーブルにis_favoriteカラムを追加
ALTER TABLE user_products
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE;

-- productsテーブルにfood_nameカラムを追加（食材名）
ALTER TABLE products
ADD COLUMN IF NOT EXISTS food_name TEXT;

-- インデックス追加
CREATE INDEX IF NOT EXISTS idx_user_products_is_favorite ON user_products(is_favorite) WHERE is_favorite = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_food_name ON products(food_name);
