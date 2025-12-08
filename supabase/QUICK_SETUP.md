# 🚀 Yamtune データベース クイックセットアップ

## ⚠️ 重要：このSQLは既存データを削除します

`RESET_AND_SETUP.sql` を実行すると、**既存のデータが全て削除されます**。
テスト中や初期セットアップの場合は問題ありませんが、本番データがある場合は注意してください。

---

## 📋 セットアップ手順（3ステップで完了）

### ステップ1: データベースをリセット＆セットアップ

1. [Supabase Dashboard](https://app.supabase.com/) にログイン
2. プロジェクトを選択
3. 左メニューから **SQL Editor** を開く
4. **`supabase/migrations/RESET_AND_SETUP.sql`** の内容を全てコピー
5. SQL Editorに貼り付けて **Run** をクリック

**✅ 成功の確認**
```
NOTICE: ✅ データベースリセット完了！全てのテーブルが作成されました。
```

---

### ステップ2: ストレージバケットを作成

1. 左メニューから **Storage** を開く
2. **New Bucket** をクリック
3. 以下の設定：
   - **Name**: `product-images`
   - **Public bucket**: チェックを**外す**（プライベート）
4. **Create bucket** をクリック

---

### ステップ3: アプリで確認

1. ブラウザでアプリをリロード（Ctrl/Cmd + Shift + R）
2. 必要に応じてログアウト→ログイン
3. 商品を登録してみる
4. ブラウザをリロードしても商品が残っていればOK！

---

## 📊 作成されるテーブル（全9テーブル）

### 家族・メンバー管理
- `families` - 家族情報
- `members` - 家族メンバー
- `member_foods` - 好き嫌い情報

### 商品管理
- `products` - 商品情報
- `user_products` - ユーザーと商品の関連

### レシピ管理
- `recipes` - レシピ情報
- `recipe_ingredients` - レシピの材料
- `recipe_steps` - レシピの手順
- `user_recipes` - ユーザーとレシピの関連

---

## ✅ セットアップ確認

SQL Editorで以下を実行：

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

9個のテーブルが表示されればOK！

---

## 🔒 セキュリティ

- Row Level Security (RLS) が全テーブルで有効
- 基本的なポリシーが設定済み
- ユーザーは自分のデータのみアクセス可能
- productsテーブルは全員が参照・作成可能

---

## 🐛 トラブルシューティング

### 商品が消える
→ ステップ1のSQL実行後、必ずステップ2でストレージバケットを作成してください

### ログインできない
→ 認証テーブル（auth.users）は削除されません。既存のアカウントでログインできます

### エラーが出る
→ SQLを再度実行してください。DROP TABLEから始まるので何度実行してもOKです

---

## 💾 データのバックアップ（オプション）

既存データを保持したい場合は、RESET_AND_SETUP.sqlを実行する前に：

1. Supabase Dashboard → Table Editor
2. 各テーブルのデータをエクスポート
3. CSV形式で保存

リセット後にインポートすることも可能です。
