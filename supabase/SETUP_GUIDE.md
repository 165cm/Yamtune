# Yamtune データベースセットアップガイド

商品が消える問題を解決するため、以下の手順でSupabaseにテーブルを作成してください。

## 🚀 クイックセットアップ（推奨）

### ステップ1: テーブルを作成

1. [Supabase Dashboard](https://app.supabase.com/) にアクセス
2. プロジェクトを選択
3. 左メニューから **SQL Editor** を開く
4. `supabase/migrations/SAFE_setup.sql` の内容を**全てコピー**
5. SQL Editorに貼り付けて **Run** をクリック

✅ 「セットアップ完了！」のメッセージが表示されればOK！

**このSQLの特徴：**
- 既存テーブルがあっても安全に実行できる
- 不足しているカラムを自動的に追加
- エラーを自動で無視

### ステップ2: ストレージバケットを作成

1. 左メニューから **Storage** を開く
2. **New Bucket** をクリック
3. 以下の設定で作成：
   - Name: `product-images`
   - Public bucket: **チェックを外す**（プライベート）
4. **Create bucket** をクリック

✅ これで完了です！アプリで商品登録を試してください。

---

## 🔒 セキュリティ設定（オプション）

セキュリティポリシー（RLS）を設定する場合は、以下も実行してください：

1. SQL Editorで `supabase/migrations/POLICIES_setup.sql` の内容を実行

※ ポリシーを設定しなくてもアプリは動作しますが、セキュリティのため設定を推奨します。

---

## ✅ 確認方法

SQL Editorで以下を実行：

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

以下のテーブルが表示されればOK：
- families
- member_foods
- members
- products
- recipe_ingredients
- recipe_steps
- recipes
- user_products
- user_recipes

---

## 🐛 トラブルシューティング

### エラー: "already exists"
→ 既にテーブルが存在しています。問題ありません。

### エラー: "column does not exist"
→ ポリシー設定でエラーが出た場合は、SIMPLE_setup.sql のみ実行し、POLICIES_setup.sql はスキップしてください。

### 商品がまだ消える
1. ブラウザのキャッシュをクリア
2. アプリを完全リロード（Ctrl/Cmd + Shift + R）
3. ログアウト→ログイン

### それでも解決しない場合
Supabase Dashboard → Table Editor で `products` と `user_products` テーブルが存在するか確認してください。
