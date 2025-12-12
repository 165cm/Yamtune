// 年齢別の1日あたり推奨栄養素（日本人の食事摂取基準2020年版参考）

export interface NutritionGoals {
  protein: number      // g - たんぱく質
  iron: number         // mg - 鉄分
  calcium: number      // mg - カルシウム
  vitaminA: number     // μg - ビタミンA
  vitaminC: number     // mg - ビタミンC
  fiber: number        // g - 食物繊維
}

export interface NutritionPreset {
  id: string
  label: string
  emoji: string
  description: string
  category: "children" | "adult"
  goals: NutritionGoals
}

// 子供向けプリセット
const childrenPresets: NutritionPreset[] = [
  {
    id: "child-1-2",
    label: "1〜2歳（乳幼児）",
    emoji: "🍼",
    description: "離乳完了〜幼児期前期",
    category: "children",
    goals: {
      protein: 20,
      iron: 4.5,
      calcium: 400,
      vitaminA: 400,
      vitaminC: 35,
      fiber: 8,
    },
  },
  {
    id: "child-3-5",
    label: "3〜5歳（幼児）",
    emoji: "👶",
    description: "幼稚園・保育園児",
    category: "children",
    goals: {
      protein: 25,
      iron: 5.5,
      calcium: 600,
      vitaminA: 400,
      vitaminC: 40,
      fiber: 10,
    },
  },
  {
    id: "child-6-7",
    label: "6〜7歳（低学年）",
    emoji: "🧒",
    description: "小学校1〜2年生",
    category: "children",
    goals: {
      protein: 35,
      iron: 6.5,
      calcium: 600,
      vitaminA: 400,
      vitaminC: 55,
      fiber: 11,
    },
  },
  {
    id: "child-8-9",
    label: "8〜9歳（中学年）",
    emoji: "👦",
    description: "小学校3〜4年生",
    category: "children",
    goals: {
      protein: 40,
      iron: 7.0,
      calcium: 650,
      vitaminA: 500,
      vitaminC: 60,
      fiber: 12,
    },
  },
  {
    id: "child-10-11",
    label: "10〜11歳（高学年）",
    emoji: "🧑",
    description: "小学校5〜6年生",
    category: "children",
    goals: {
      protein: 50,
      iron: 8.0,
      calcium: 700,
      vitaminA: 600,
      vitaminC: 75,
      fiber: 13,
    },
  },
  {
    id: "teen-12-14",
    label: "12〜14歳（中学生）",
    emoji: "🎒",
    description: "成長期",
    category: "children",
    goals: {
      protein: 60,
      iron: 10.0,
      calcium: 800,
      vitaminA: 700,
      vitaminC: 85,
      fiber: 17,
    },
  },
]

// 大人向けプリセット
const adultPresets: NutritionPreset[] = [
  {
    id: "adult-female-18-49",
    label: "女性（18〜49歳）",
    emoji: "👩",
    description: "成人女性の標準",
    category: "adult",
    goals: {
      protein: 50,
      iron: 10.5,
      calcium: 650,
      vitaminA: 650,
      vitaminC: 100,
      fiber: 18,
    },
  },
  {
    id: "adult-male-18-49",
    label: "男性（18〜49歳）",
    emoji: "👨",
    description: "成人男性の標準",
    category: "adult",
    goals: {
      protein: 65,
      iron: 7.5,
      calcium: 800,
      vitaminA: 850,
      vitaminC: 100,
      fiber: 21,
    },
  },
  {
    id: "adult-female-50-plus",
    label: "女性（50歳以上）",
    emoji: "👵",
    description: "中高年女性",
    category: "adult",
    goals: {
      protein: 50,
      iron: 6.5,
      calcium: 650,
      vitaminA: 650,
      vitaminC: 100,
      fiber: 17,
    },
  },
  {
    id: "adult-male-50-plus",
    label: "男性（50歳以上）",
    emoji: "👴",
    description: "中高年男性",
    category: "adult",
    goals: {
      protein: 60,
      iron: 7.5,
      calcium: 750,
      vitaminA: 850,
      vitaminC: 100,
      fiber: 20,
    },
  },
]

// すべてのプリセット
export const nutritionPresets: NutritionPreset[] = [
  ...childrenPresets,
  ...adultPresets,
]

// カテゴリ別にグループ化
export const presetsByCategory = {
  children: {
    label: "子供",
    emoji: "👶",
    presets: childrenPresets,
  },
  adult: {
    label: "大人",
    emoji: "👨‍👩‍👧",
    presets: adultPresets,
  },
}

// デフォルトプリセット（6〜7歳）
export const DEFAULT_PRESET_ID = "child-6-7"

// プリセットをIDで検索
export function getPresetById(id: string): NutritionPreset | undefined {
  return nutritionPresets.find((p) => p.id === id)
}

// デフォルトの栄養目標を取得
export function getDefaultGoals(): NutritionGoals {
  const defaultPreset = getPresetById(DEFAULT_PRESET_ID)
  return defaultPreset?.goals || childrenPresets[2].goals
}
