# Yamtune 改善指示書

**現状スコア**: 60点
**目標スコア**: 100点
**期間**: 1ヶ月
**目標**: 月額$5 × 1,000ユーザー = $5,000/月（運用コスト10%以下）

---

## 📊 現状分析

### 現在できること（60点の内訳）
| 機能 | 状態 | 評価 |
|------|------|------|
| 商品スキャン（AI栄養抽出） | ✅ 完成 | 15点 |
| AIレシピ生成 | ✅ 完成 | 15点 |
| 家族・好き嫌い管理 | ✅ 完成 | 10点 |
| 調理記録 | ⚠️ 基本のみ | 5点 |
| 認証・基盤 | ✅ 完成 | 10点 |
| UI/UXデザイン | ⚠️ 基本レベル | 5点 |

### 致命的な不足（-40点の原因）
1. **毎日使う理由がない** → 継続率が上がらない
2. **課金機能がない** → 収益化できない
3. **通知機能がない** → リテンションできない
4. **進捗の可視化がない** → 達成感がない

---

## 🎯 改善の全体像

```
Week 1: 継続率向上の基盤（献立・通知）
Week 2: 課金機能の実装（Stripe）
Week 3: UX改善とコスト最適化
Week 4: PWA完成とリリース準備
```

---

## 📅 Week 1: 毎日使う理由を作る（+20点）

### 1.1 献立カレンダー機能
**目的**: 「今日何作ろう？」を解決し、毎日アプリを開く理由を作る

**実装内容**:
```
/src/app/(main)/calendar/page.tsx  # 新規
/src/components/features/calendar/
  ├── weekly-calendar.tsx          # 週間カレンダー表示
  ├── meal-slot.tsx                # 朝昼晩のスロット
  └── meal-planner-dialog.tsx      # レシピ割り当てダイアログ
```

**DBスキーマ追加**:
```sql
CREATE TABLE meal_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  recipe_id UUID REFERENCES recipes(id),
  planned_date DATE NOT NULL,
  meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**ユーザーフロー**:
1. カレンダーを開く → 今週の献立を確認
2. 空きスロットをタップ → レシピを選択 or AI生成
3. 当日朝に通知 → 「今日の献立: ○○」
4. 作ったら完了マーク → 調理記録と連動

### 1.2 今日のダッシュボード
**目的**: ホーム画面を「今日やること」中心に再設計

**変更内容** (`/home/page.tsx` リデザイン):
```
┌─────────────────────────────────┐
│ 🌅 おはようございます、○○さん    │
│ 今日の献立                       │
├─────────────────────────────────┤
│ 🍳 朝食: [未設定]               │
│ 🍱 昼食: 野菜たっぷりカレー ✓    │
│ 🍽️ 夕食: ハンバーグ             │
├─────────────────────────────────┤
│ 📊 今週の達成状況: ████░░ 4/7日  │
├─────────────────────────────────┤
│ 🎯 〇〇ちゃんの克服チャレンジ    │
│ にんじん: 3回チャレンジ中 🥕      │
├─────────────────────────────────┤
│ [+ 商品スキャン] [📋 レシピ生成] │
└─────────────────────────────────┘
```

### 1.3 好き嫌い克服トラッカー
**目的**: 子どもの成長を可視化し、親のモチベーション維持

**実装内容**:
```
/src/components/features/tracker/
  ├── food-challenge-card.tsx      # 克服チャレンジカード
  ├── progress-ring.tsx            # 進捗リング
  └── achievement-badge.tsx        # 達成バッジ
```

**DBスキーマ追加**:
```sql
CREATE TABLE food_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES members(id),
  food_name TEXT NOT NULL,
  target_count INTEGER DEFAULT 10,      -- 10回食べたら克服
  current_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',         -- active/completed/paused
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE TABLE food_challenge_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID REFERENCES food_challenges(id),
  cooking_log_id UUID REFERENCES cooking_logs(id),
  reaction TEXT CHECK (reaction IN ('ate_all', 'ate_some', 'refused')),
  logged_at TIMESTAMP DEFAULT NOW()
);
```

**ゲーミフィケーション要素**:
- 🥉 3回チャレンジ: 「挑戦者」バッジ
- 🥈 5回チャレンジ: 「頑張り屋」バッジ
- 🥇 10回完食: 「克服マスター」バッジ
- 連続記録でボーナスポイント

### 1.4 プッシュ通知（PWA）
**目的**: アプリを開かなくても思い出してもらう

**通知タイミング**:
| 時間 | 内容 | 条件 |
|------|------|------|
| 7:00 | 「今日の献立を確認しましょう」 | 献立未設定時 |
| 11:30 | 「お昼の○○、材料は揃っていますか？」 | 昼食設定時 |
| 17:00 | 「夕食の準備時間です！」 | 夕食設定時 |
| 20:00 | 「今日の食事を記録しましょう」 | 未記録時 |

**実装**:
```javascript
// next.config.js 修正
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
})

module.exports = withPWA(nextConfig)
```

---

## 💰 Week 2: 課金機能の実装（+15点）

### 2.1 プラン設計

| 機能 | 無料プラン | Proプラン ($5/月) |
|------|-----------|------------------|
| 商品スキャン | 3回/月 | 無制限 |
| AIレシピ生成 | 3回/月 | 無制限 |
| 献立カレンダー | 1週間分 | 無制限 |
| 克服トラッカー | 1人 | 家族全員 |
| プッシュ通知 | ❌ | ✅ |
| 栄養レポート | 基本 | 詳細分析 |
| 広告 | あり | なし |

### 2.2 Stripe統合

**必要なファイル**:
```
/src/app/api/stripe/
  ├── create-checkout/route.ts     # チェックアウトセッション作成
  ├── webhook/route.ts             # Webhook処理
  └── portal/route.ts              # カスタマーポータル
/src/app/(main)/pricing/page.tsx   # 料金ページ
/src/app/(main)/settings/billing/page.tsx  # 請求管理
```

**DBスキーマ追加**:
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan TEXT DEFAULT 'free',         -- free/pro
  status TEXT DEFAULT 'active',     -- active/canceled/past_due
  current_period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,             -- scan/generate/etc
  created_at TIMESTAMP DEFAULT NOW()
);
```

**使用量チェックミドルウェア**:
```typescript
// /src/lib/subscription.ts
export async function checkUsageLimit(userId: string, action: 'scan' | 'generate') {
  const subscription = await getSubscription(userId)

  if (subscription?.plan === 'pro') return { allowed: true }

  const monthlyUsage = await getMonthlyUsage(userId, action)
  const limit = action === 'scan' ? 3 : 3

  return {
    allowed: monthlyUsage < limit,
    remaining: Math.max(0, limit - monthlyUsage),
    limit
  }
}
```

### 2.3 アップグレード導線

**表示タイミング**:
1. 無料枠を使い切った時 → モーダル表示
2. Pro機能を使おうとした時 → 機能説明 + アップグレードボタン
3. 設定画面 → 常時プラン情報表示

**コンバージョン最適化**:
- 7日間無料トライアル
- 年額プラン割引（$50/年 = 2ヶ月分お得）
- 「〇〇さんも使っています」（ソーシャルプルーフ）

---

## 🎨 Week 3: UX改善 & コスト最適化（+10点）

### 3.1 オンボーディング改善

**現状の問題**:
- スキャンデモ → すぐ忘れる
- 価値が伝わりにくい

**改善案**:
```
Step 1: 「お子さんの苦手な食べ物は？」（感情的フック）
Step 2: 「実際にスキャンしてみましょう」（体験）
Step 3: 「AIがレシピを提案します」（価値の実感）
Step 4: 「献立を立てましょう」（習慣化の第一歩）
Step 5: 「通知をオンにしましょう」（リテンション）
```

### 3.2 APIコスト最適化

**目標**: 1,000ユーザーで $500/月以下

**現状の問題**:
- 毎回フルプロンプト送信（37栄養素の説明）
- キャッシュなし
- 同じレシピを何度も生成

**最適化施策**:

#### A) プロンプト圧縮（-30%トークン）
```typescript
// Before: 37項目全て説明
"エネルギー（kcal）、たんぱく質（g）、脂質（g）..."

// After: 必須項目のみ + 短縮形
const ESSENTIAL_NUTRIENTS = ['energy', 'protein', 'fat', 'carbs', 'salt']
```

#### B) レシピキャッシュ（-50% API呼び出し）
```sql
CREATE TABLE recipe_cache (
  id UUID PRIMARY KEY,
  product_ids UUID[] NOT NULL,      -- 使用商品（ソート済み）
  member_ids UUID[] NOT NULL,       -- 対象メンバー
  recipe_id UUID REFERENCES recipes(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(product_ids, member_ids)
);
```

#### C) 人気レシピのプリセット化
```typescript
// 人気レシピTOP100はDBに保存し、AI生成をスキップ
const popularRecipes = await getPopularRecipes(ingredients)
if (popularRecipes.length > 0) {
  return popularRecipes[0]  // API呼び出しなし
}
// 見つからない場合のみAI生成
```

#### D) 画像最適化（-40%トークン）
```typescript
// クライアント側で圧縮
const compressImage = async (file: File) => {
  // 最大800x800、品質0.7に圧縮
  return await imageCompression(file, {
    maxWidthOrHeight: 800,
    maxSizeMB: 0.5,
  })
}
```

### 3.3 コスト試算

**最適化後の予測**:
```
1,000ユーザー × 月間アクション
├── スキャン: 5回/人 × 1,000 = 5,000回
│   └── 最適化後: $0.005/回 × 5,000 = $25
├── レシピ生成: 10回/人 × 1,000 = 10,000回
│   └── キャッシュヒット50%: 5,000回 × $0.003/回 = $15
└── 合計API: $40/月

インフラ:
├── Supabase Pro: $25/月
├── Vercel Pro: $20/月
└── その他: $15/月

総運用コスト: $100/月（目標$500以下 ✓）
利益率: 98%
```

---

## 🚀 Week 4: PWA完成 & リリース準備（+5点）

### 4.1 PWA完全対応

**チェックリスト**:
- [ ] Service Worker有効化（next-pwa設定）
- [ ] オフラインページ作成
- [ ] アプリアイコン全サイズ（192x192, 512x512）
- [ ] スプラッシュスクリーン
- [ ] iOS Safari対応（apple-touch-icon）

### 4.2 App Store/Play Store対応（PWA Builder）

**手順**:
1. PWABuilder.com でパッケージ作成
2. Apple Developer Program 登録（$99/年）
3. Google Play Console 登録（$25 一回）
4. ストア申請

### 4.3 リリース前チェックリスト

**機能テスト**:
- [ ] 新規登録フロー
- [ ] 商品スキャン → レシピ生成 → 調理記録
- [ ] 献立カレンダー操作
- [ ] 課金フロー（Stripe テストモード）
- [ ] プッシュ通知受信

**パフォーマンス**:
- [ ] Lighthouse スコア 90+
- [ ] 初期読み込み 3秒以内
- [ ] API レスポンス 2秒以内

**法務**:
- [ ] 利用規約
- [ ] プライバシーポリシー
- [ ] 特定商取引法に基づく表記

---

## 📈 KPI設計

### 主要指標

| 指標 | 目標値 | 計測方法 |
|------|--------|----------|
| DAU/MAU比率 | 30%以上 | 毎日使うユーザー割合 |
| 継続率（7日） | 40%以上 | 登録7日後のアクティブ率 |
| 継続率（30日） | 25%以上 | 登録30日後のアクティブ率 |
| 無料→有料転換率 | 5%以上 | Pro登録率 |
| 解約率 | 5%以下 | 月間解約率 |

### 追跡イベント
```typescript
// /src/lib/analytics.ts
export const trackEvent = (event: string, properties?: object) => {
  // Mixpanel, Amplitude, または自前実装
}

// 追跡するイベント
trackEvent('scan_completed')
trackEvent('recipe_generated')
trackEvent('meal_planned')
trackEvent('cooking_logged')
trackEvent('challenge_started')
trackEvent('upgrade_clicked')
trackEvent('subscription_started')
```

---

## 🗂️ 実装優先順位

### Must Have（なければリリース不可）
1. ✅ 献立カレンダー機能
2. ✅ Stripe課金機能
3. ✅ 使用量制限
4. ✅ PWA通知

### Should Have（あれば継続率向上）
5. 克服トラッカー
6. 今日のダッシュボード改善
7. APIコスト最適化

### Nice to Have（後回し可）
8. 詳細栄養レポート
9. レシピ共有機能
10. コミュニティ機能

---

## 📁 新規ファイル一覧

```
/src/app/(main)/calendar/page.tsx
/src/app/(main)/pricing/page.tsx
/src/app/(main)/settings/billing/page.tsx
/src/app/api/stripe/create-checkout/route.ts
/src/app/api/stripe/webhook/route.ts
/src/app/api/stripe/portal/route.ts
/src/app/api/meal-plans/route.ts
/src/app/api/challenges/route.ts
/src/components/features/calendar/weekly-calendar.tsx
/src/components/features/calendar/meal-slot.tsx
/src/components/features/tracker/food-challenge-card.tsx
/src/components/features/tracker/progress-ring.tsx
/src/lib/stripe.ts
/src/lib/subscription.ts
/src/lib/analytics.ts
/supabase/migrations/010_meal_plans.sql
/supabase/migrations/011_subscriptions.sql
/supabase/migrations/012_food_challenges.sql
```

---

## ✅ 完了時の状態（100点）

```
60点 → 100点 の内訳

+20点: 継続率向上機能
  - 献立カレンダー
  - 今日のダッシュボード
  - 克服トラッカー
  - プッシュ通知

+15点: 課金機能
  - Stripe統合
  - プラン制限
  - 使用量管理

+10点: UX/コスト最適化
  - オンボーディング改善
  - APIコスト削減
  - パフォーマンス改善

+5点: リリース準備
  - PWA完成
  - ストア対応
  - 法務対応
```

---

## 🎯 成功の定義

**1ヶ月後**:
- [ ] 献立カレンダーが動作する
- [ ] Stripeで課金できる
- [ ] PWAとしてインストールできる
- [ ] 通知が届く

**3ヶ月後**:
- [ ] 100人の有料ユーザー獲得
- [ ] DAU/MAU 30%以上
- [ ] 運用コスト $100/月以下

**6ヶ月後**:
- [ ] 1,000人の有料ユーザー達成
- [ ] 月間収益 $5,000
- [ ] App Store / Play Store 公開
