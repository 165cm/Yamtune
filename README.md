# Yamtune

好き嫌い克服サポートアプリ - 子どもの好き嫌いを克服する栄養サポートレシピアプリ

## 概要

Yamtuneは、2〜10歳の好き嫌いの多い子どもを持つ母親向けの栄養サポートレシピアプリです。食品パッケージをスキャンして栄養データを取得し、AIが栄養バランスの取れたレシピを生成します。

## 主な機能

- 📸 商品スキャン機能（OCR）
- 🤖 AI レシピ生成
- 👨‍👩‍👧‍👦 家族・子ども管理
- 📊 成長記録と好き嫌い克服の進捗管理
- 🍳 調理記録機能
- 🌐 PWA対応

## 技術スタック

### フロントエンド
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Zustand (状態管理)
- React Query (データフェッチング)
- next-pwa (PWA対応)

### バックエンド
- Supabase (認証、データベース、ストレージ)
- PostgreSQL

### 外部API
- OpenAI GPT-4o-mini Vision (商品スキャン・栄養成分抽出)
- OpenAI GPT-4o-mini (レシピ生成)
- Kling AI (料理写真生成)

## セットアップ

### 前提条件

- Node.js 20以上
- npm または yarn

### インストール

1. リポジトリをクローン
```bash
git clone <repository-url>
cd Yamtune
```

2. 依存パッケージをインストール
```bash
npm install
```

3. 環境変数を設定

`.env.example`を`.env.local`にコピーして、必要な値を設定してください。

```bash
cp .env.example .env.local
```

以下の値を設定します:

- `NEXT_PUBLIC_SUPABASE_URL`: Supabaseプロジェクト URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase Anon Key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase Service Role Key
- `OPENAI_API_KEY`: OpenAI API Key（Vision + Chat機能）
- `KLING_ACCESS_KEY`: Kling AI Access Key（画像生成）
- `KLING_SECRET_KEY`: Kling AI Secret Key（画像生成）

### Supabaseのセットアップ

1. [Supabase](https://supabase.com)でプロジェクトを作成
2. データベーススキーマを作成（仕様書の「DATABASE SCHEMA」セクションを参照）
3. APIキーを取得して`.env.local`に設定

### 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

## ビルド

```bash
npm run build
```

## プロジェクト構造

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 認証関連ページ
│   ├── (main)/            # メインアプリページ
│   ├── (onboarding)/      # オンボーディング
│   └── api/               # API Routes
├── components/
│   ├── ui/                # shadcn/ui コンポーネント
│   └── features/          # 機能別コンポーネント
├── hooks/                 # カスタムフック
├── stores/                # Zustand ストア
├── lib/
│   ├── supabase/          # Supabase クライアント
│   └── services/          # 外部サービス連携
└── types/                 # TypeScript型定義
```

## 開発ステータス

### Phase 1: プロジェクト基盤構築 ✅
- [x] Next.js + TypeScript + Tailwind セットアップ
- [x] Supabase接続
- [x] 認証機能（Login/Signup）
- [x] 基本的な状態管理（Zustand）

### Phase 2: Onboarding & 家族管理 ✅
- [x] Onboarding実装（5ステップのフロー）
  - [x] ウェルカム画面
  - [x] 商品スキャン体験（モックデモ）
  - [x] AIレシピ生成体験（モックデモ）
  - [x] 家族情報入力
  - [x] 子供情報入力（好き嫌い登録）
- [x] 家族・メンバー管理機能
  - [x] 家族管理API（作成・取得）
  - [x] メンバー管理API（作成・更新・削除）
  - [x] 好き嫌い管理API
  - [x] 家族管理画面

### Phase 3: 商品スキャン ✅
- [x] OpenAI GPT-4o-mini Vision API実装（OCR代替）
- [x] 商品撮影・栄養成分認識機能
- [x] 35+栄養素の抽出（基本栄養素、ビタミン、ミネラル）
- [x] ユーザー確認フロー（スキャン→確認→保存）
- [x] 商品カード表示（画像、栄養情報オーバーレイ）
- [x] カテゴリ自動分類

### Phase 4: レシピ生成 ✅
- [x] OpenAI GPT-4o-mini連携（レシピ生成）
- [x] 登録商品と家族の好き嫌いを考慮したレシピ生成
- [x] レシピ詳細ページ（材料、手順、栄養情報、アドバイス）
- [x] レシピ一覧ページ（フィルタ、検索）
- [x] お気に入り機能
- [x] ホームページに最近のレシピ表示

### Phase 5: 画像生成 & 記録 📋
- [ ] Kling AI画像生成
- [ ] 調理記録機能

### Phase 6: コミュニティ & PWA 📋
- [ ] レシピ共有機能
- [ ] PWA対応

## ライセンス

MIT
