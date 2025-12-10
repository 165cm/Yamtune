-- productsテーブルにUPDATEポリシーを追加
-- ユーザーが所有している商品（user_productsに登録されている）のみ更新可能

CREATE POLICY "Users can update products they own"
  ON products FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM user_products
    WHERE user_products.product_id = products.id
    AND user_products.user_id = auth.uid()
  ));
