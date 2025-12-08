# データベースマイグレーション

このフォルダには、Supabaseデータベースのマイグレーションファイルが含まれています。

## セットアップ手順

### 1. Supabaseダッシュボードにアクセス

1. [Supabase Dashboard](https://app.supabase.com/) にログイン
2. あなたのプロジェクトを選択
3. 左サイドバーから「SQL Editor」を開く

### 2. マイグレーションの実行

以下の順番でSQLファイルを実行してください：

#### ステップ1: 基本テーブルの作成

`001_create_initial_tables.sql` の内容をコピーして、SQL Editorに貼り付けて実行（Runボタンをクリック）

このファイルは以下のテーブルを作成します：
- `families` - 家族情報
- `members` - 家族メンバー
- `member_foods` - 好き嫌い情報
- `products` - 商品情報
- `user_products` - ユーザーと商品の関連

#### ステップ2: レシピテーブルの作成

`002_create_recipes_tables.sql` の内容をコピーして、SQL Editorに貼り付けて実行

このファイルは以下のテーブルを作成します：
- `recipes` - レシピ情報
- `recipe_ingredients` - レシピの材料
- `recipe_steps` - レシピの手順
- `user_recipes` - ユーザーとレシピの関連

### 3. 確認

SQL Editorで以下のクエリを実行して、テーブルが正しく作成されたか確認：

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

以下のテーブルが表示されればOKです：
- families
- members
- member_foods
- products
- user_products
- recipes
- recipe_ingredients
- recipe_steps
- user_recipes

### トラブルシューティング

#### エラー: "already exists"

テーブルがすでに存在する場合、このエラーが表示されることがありますが、問題ありません。
すべてのSQLに `IF NOT EXISTS` が含まれているため、既存のテーブルは上書きされません。

#### エラー: "permission denied"

RLS (Row Level Security) ポリシーのエラーが出る場合：
1. Supabaseダッシュボードで「Authentication」→「Policies」を確認
2. 必要に応じてポリシーを手動で削除してから再実行

#### データが表示されない場合

1. ブラウザのキャッシュをクリア
2. アプリを再読み込み
3. ログアウト→ログインしてみる

## ストレージバケットのセットアップ

商品画像を保存するためのストレージバケットも設定してください：

1. Supabaseダッシュボードで「Storage」を開く
2. 「New Bucket」をクリック
3. バケット名: `product-images`
4. 「Public bucket」のチェックを外す（プライベート）
5. 「Create bucket」をクリック

## 環境変数の確認

`.env.local` ファイルに以下の環境変数が設定されているか確認してください：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_api_key
```
