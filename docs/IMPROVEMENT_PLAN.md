# Yamtune 改善指示書

**現状スコア**: 60点
**目標スコア**: 100点
**期間**: 1ヶ月
**目標**: 月額$5 × 1,000ユーザー = $5,000/月（運用コスト10%以下）

---

## 🎨 Yamtuneのコンセプト

### ブランド哲学
**Yamtune = Yummy + Tune（好きなものを調整する）**

> 「嫌いなものを無理に食べさせる」のではなく、
> 「好きなものを中心に、無理なく栄養を取る方法を提案する」

### キーメッセージ
- ❌ 「苦手を克服しよう」
- ✅ 「好きなもので栄養バッチリ！」

- ❌ 「嫌いなものを食べられるようになった」
- ✅ 「好きなもので健康に成長できている」

### ターゲットの気持ち
- 「子どもが野菜を食べなくて栄養が心配...」
- 「でも無理強いはしたくない」
- 「好きなもので栄養が取れたらいいのに」

→ **Yamtuneが解決**: 好きな食材の組み合わせで、足りない栄養を補うレシピを提案

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
4. **栄養状況の可視化がない** → 価値が伝わらない

---

## 🎯 改善の全体像

```
Week 1: 継続率向上の基盤（献立・栄養トラッカー）
Week 2: 課金機能の実装（Stripe）
Week 3: UX改善とコスト最適化（Open Food Facts API統合）
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
│ 📊 今週の栄養バランス           │
│ たんぱく質: ████████░░ 80%      │
│ ビタミン:   ██████░░░░ 60%      │
│ 鉄分:      ████░░░░░░ 40% ⚠️   │
├─────────────────────────────────┤
│ 💡 今日のおすすめ               │
│ 「鉄分を補うなら、〇〇ちゃんの   │
│  好きなハンバーグがおすすめ！」  │
├─────────────────────────────────┤
│ [+ 商品スキャン] [📋 レシピ生成] │
└─────────────────────────────────┘
```

### 1.3 栄養バランストラッカー（旧: 克服トラッカー）
**目的**: 「好きなもので栄養が取れている」ことを可視化し、親に安心感を与える

**コンセプト変更**:
- ❌ 「苦手な食材を10回食べたら克服」
- ✅ 「今週の栄養バランスを可視化、好きなもので足りない栄養を補う提案」

**実装内容**:
```
/src/components/features/nutrition/
  ├── nutrition-dashboard.tsx      # 栄養ダッシュボード
  ├── nutrient-progress-bar.tsx    # 栄養素プログレスバー
  ├── weekly-nutrition-chart.tsx   # 週間栄養チャート
  └── nutrition-suggestion.tsx     # 栄養補充の提案
```

**DBスキーマ追加**:
```sql
-- 日別の栄養摂取記録
CREATE TABLE daily_nutrition (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  member_id UUID REFERENCES members(id),  -- 家族メンバー別
  date DATE NOT NULL,
  nutrients JSONB NOT NULL,  -- { protein: 50, iron: 8, ... }
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, member_id, date)
);

-- 栄養目標設定（年齢・性別別に自動設定）
CREATE TABLE nutrition_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES members(id) UNIQUE,
  goals JSONB NOT NULL,  -- { protein: 60, iron: 10, ... }
  created_at TIMESTAMP DEFAULT NOW()
);
```

**表示する栄養素（子どもに重要なもの）**:
| 栄養素 | 重要な理由 | 好きな食材で取れる例 |
|--------|-----------|-------------------|
| たんぱく質 | 成長に必須 | ハンバーグ、卵料理、チーズ |
| 鉄分 | 貧血予防 | レバー、ほうれん草（カレーに混ぜる） |
| カルシウム | 骨の成長 | 牛乳、チーズ、しらす |
| ビタミンA | 目・肌の健康 | にんじん（すりおろしてハンバーグに） |
| ビタミンC | 免疫力 | じゃがいも、果物 |
| 食物繊維 | 腸の健康 | さつまいも、りんご |

**AIによる提案例**:
```
「〇〇ちゃんは今週、鉄分が少し足りていません。
 好きなハンバーグにほうれん草を混ぜると、
 おいしく鉄分を補えますよ！」
```

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
| 商品スキャン | 5回/月 | 無制限 |
| AIレシピ生成 | 3回/月 | 無制限 |
| 献立カレンダー | 1週間分 | 無制限 |
| 栄養トラッカー | 基本（3栄養素） | 詳細（全栄養素） |
| 家族メンバー | 1人 | 無制限 |
| プッシュ通知 | ❌ | ✅ |
| 栄養アドバイス | 基本 | AIパーソナライズ |
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
  const limits = { scan: 5, generate: 3 }

  return {
    allowed: monthlyUsage < limits[action],
    remaining: Math.max(0, limits[action] - monthlyUsage),
    limit: limits[action]
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

### 3.1 Open Food Facts API統合 ⭐ NEW

**目的**: バーコードスキャンでAPIコストを大幅削減

**Open Food Facts とは**:
- 世界最大のオープン食品データベース（無料）
- 300万以上の商品データ
- 栄養成分情報を含む
- 日本の商品も対応

**API仕様**:
```
エンドポイント: https://world.openfoodfacts.org/api/v2/product/{barcode}.json
レート制限: 100 req/min（十分）
認証: User-Agentヘッダーのみ必要
コスト: 無料
```

**レスポンス例**:
```json
{
  "product": {
    "product_name": "明治おいしい牛乳",
    "nutriments": {
      "energy-kcal_100g": 67,
      "proteins_100g": 3.3,
      "fat_100g": 3.8,
      "carbohydrates_100g": 4.8,
      "calcium_100g": 110
    }
  }
}
```

**実装戦略（2段階スキャン）**:

```typescript
// /src/app/api/products/scan/route.ts（改修）

export async function POST(request: Request) {
  const { image, barcode } = await request.json()

  // Step 1: バーコードがあればOpen Food Factsを先に試す（無料）
  if (barcode) {
    const offResult = await searchOpenFoodFacts(barcode)
    if (offResult) {
      return saveProduct(offResult)  // コスト: $0
    }
  }

  // Step 2: 見つからない場合のみOpenAI Vision（有料）
  const aiResult = await analyzeWithOpenAI(image)
  return saveProduct(aiResult)  // コスト: ~$0.01
}

async function searchOpenFoodFacts(barcode: string) {
  const response = await fetch(
    `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`,
    {
      headers: {
        'User-Agent': 'Yamtune/1.0 (contact@yamtune.app)'
      }
    }
  )

  const data = await response.json()
  if (data.status !== 1) return null  // 商品が見つからない

  return {
    name: data.product.product_name,
    barcode: barcode,
    nutrition: {
      energy: data.product.nutriments['energy-kcal_100g'],
      protein: data.product.nutriments['proteins_100g'],
      fat: data.product.nutriments['fat_100g'],
      carbs: data.product.nutriments['carbohydrates_100g'],
      // ... 他の栄養素
    },
    image_url: data.product.image_url,
    source: 'openfoodfacts'  // データソースを記録
  }
}
```

**バーコードスキャン機能の追加**:

```typescript
// /src/components/features/products/barcode-scanner.tsx（新規）

import { BarcodeDetector } from 'barcode-detector'  // Polyfill for older browsers

export function BarcodeScanner({ onScan }: { onScan: (barcode: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const detector = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a'] })

    // カメラストリームを取得してバーコード検出
    const detect = async () => {
      if (videoRef.current) {
        const barcodes = await detector.detect(videoRef.current)
        if (barcodes.length > 0) {
          onScan(barcodes[0].rawValue)
        }
      }
      requestAnimationFrame(detect)
    }

    detect()
  }, [])

  return (
    <div className="relative">
      <video ref={videoRef} className="w-full rounded-lg" />
      <div className="absolute inset-0 border-2 border-green-500 pointer-events-none" />
      <p className="text-center mt-2">バーコードをカメラに映してください</p>
    </div>
  )
}
```

**UIフロー**:
```
┌─────────────────────────────────┐
│        商品を追加               │
├─────────────────────────────────┤
│  📷 バーコードをスキャン        │  ← 優先（無料）
│  ─────────────────────────      │
│  📸 パッケージを撮影           │  ← フォールバック（有料）
│  ─────────────────────────      │
│  ✏️ 手動で入力                 │
└─────────────────────────────────┘
```

**コスト削減効果**:
```
現状: 全てOpenAI Vision
  1,000スキャン × $0.01 = $10/月

改善後: Open Food Facts優先
  - バーコードヒット率 70%: 700スキャン × $0 = $0
  - フォールバック 30%: 300スキャン × $0.01 = $3/月

削減額: $7/月（70%削減）
```

### 3.2 オンボーディング改善

**現状の問題**:
- スキャンデモ → すぐ忘れる
- 価値が伝わりにくい

**改善案（コンセプトに沿った内容）**:
```
Step 1: 「お子さんの好きな食べ物は？」
        → 好きなものを登録（ポジティブスタート）

Step 2: 「気になる栄養素はありますか？」
        → 鉄分、カルシウムなど選択

Step 3: 「バーコードで商品をスキャン！」
        → 実際に体験

Step 4: 「好きなもので栄養バッチリ！」
        → AIがレシピを提案

Step 5: 「毎日の献立を楽にしよう」
        → 通知ON、カレンダー設定
```

### 3.3 その他のコスト最適化

**A) プロンプト圧縮（-30%トークン）**:
```typescript
// Before: 37項目全て説明
"エネルギー（kcal）、たんぱく質（g）、脂質（g）..."

// After: 必須項目のみ + 短縮形
const ESSENTIAL_NUTRIENTS = ['energy', 'protein', 'fat', 'carbs', 'salt']
```

**B) レシピキャッシュ（-50% API呼び出し）**:
```sql
CREATE TABLE recipe_cache (
  id UUID PRIMARY KEY,
  product_ids UUID[] NOT NULL,
  member_ids UUID[] NOT NULL,
  recipe_id UUID REFERENCES recipes(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(product_ids, member_ids)
);
```

**C) 画像最適化（-40%トークン）**:
```typescript
const compressImage = async (file: File) => {
  return await imageCompression(file, {
    maxWidthOrHeight: 800,
    maxSizeMB: 0.5,
  })
}
```

### 3.4 コスト試算（更新版）

```
1,000ユーザー × 月間アクション

スキャン: 5回/人 × 1,000 = 5,000回
├── Open Food Facts（70%）: 3,500回 × $0 = $0
└── OpenAI Vision（30%）:  1,500回 × $0.005 = $7.50

レシピ生成: 10回/人 × 1,000 = 10,000回
├── キャッシュヒット（50%）: 5,000回 × $0 = $0
└── AI生成（50%）: 5,000回 × $0.003 = $15

合計API: $22.50/月

インフラ:
├── Supabase Pro: $25/月
├── Vercel Pro: $20/月
└── その他: $15/月

総運用コスト: $82.50/月（目標$500以下 ✅）
利益率: 98.4%
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
- [ ] バーコードスキャン → Open Food Facts連携
- [ ] 画像スキャン → OpenAI Vision連携
- [ ] レシピ生成 → 調理記録
- [ ] 献立カレンダー操作
- [ ] 栄養バランストラッカー
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
trackEvent('scan_barcode')         // バーコードスキャン
trackEvent('scan_image')           // 画像スキャン
trackEvent('scan_openfoodfacts')   // OFFからデータ取得
trackEvent('scan_openai')          // OpenAIでデータ取得
trackEvent('recipe_generated')
trackEvent('meal_planned')
trackEvent('cooking_logged')
trackEvent('nutrition_viewed')     // 栄養ダッシュボード閲覧
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
5. 栄養バランストラッカー
6. 今日のダッシュボード改善
7. Open Food Facts API統合

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
/src/app/api/nutrition/route.ts
/src/app/api/openfoodfacts/route.ts           # NEW
/src/components/features/calendar/weekly-calendar.tsx
/src/components/features/calendar/meal-slot.tsx
/src/components/features/nutrition/nutrition-dashboard.tsx    # NEW
/src/components/features/nutrition/nutrient-progress-bar.tsx  # NEW
/src/components/features/nutrition/weekly-nutrition-chart.tsx # NEW
/src/components/features/products/barcode-scanner.tsx         # NEW
/src/lib/stripe.ts
/src/lib/subscription.ts
/src/lib/analytics.ts
/src/lib/openfoodfacts.ts                     # NEW
/supabase/migrations/010_meal_plans.sql
/supabase/migrations/011_subscriptions.sql
/supabase/migrations/012_daily_nutrition.sql  # NEW
```

---

## ✅ 完了時の状態（100点）

```
60点 → 100点 の内訳

+20点: 継続率向上機能
  - 献立カレンダー
  - 今日のダッシュボード
  - 栄養バランストラッカー（好きなもので栄養充足）
  - プッシュ通知

+15点: 課金機能
  - Stripe統合
  - プラン制限
  - 使用量管理

+10点: UX/コスト最適化
  - Open Food Facts API統合（コスト70%削減）
  - オンボーディング改善
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
- [ ] バーコードスキャンでOpen Food Facts連携
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

---

## 📚 参考リンク

- [Open Food Facts API Tutorial](https://openfoodfacts.github.io/openfoodfacts-server/api/tutorial-off-api/)
- [Open Food Facts API Introduction](https://openfoodfacts.github.io/openfoodfacts-server/api/)
- [Barcode Detector API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/BarcodeDetector)
