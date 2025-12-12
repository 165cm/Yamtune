"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Activity, Lightbulb, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { getDefaultGoals } from "@/lib/nutrition-presets"

// 後方互換性のためにエクスポート（プリセットから取得）
export const DEFAULT_DAILY_GOALS = getDefaultGoals()

interface NutritionData {
  protein: number
  iron: number
  calcium: number
  vitaminA: number
  vitaminC: number
  fiber: number
}

interface NutritionGoals {
  protein: number
  iron: number
  calcium: number
  vitaminA: number
  vitaminC: number
  fiber: number
}

// 新しいProps（日単位対応）
interface DailyNutritionDashboardProps {
  nutrition: NutritionData
  goals?: NutritionGoals
  memberName?: string
  likedFoods?: string[]
  compact?: boolean
  showSettings?: boolean
}

// 後方互換性のためのProps（週単位）
interface WeeklyNutritionDashboardProps {
  weeklyNutrition: NutritionData
  memberName?: string
  likedFoods?: string[]
  compact?: boolean
}

// 好きな食材で補える栄養素の提案
const FOOD_SUGGESTIONS: Record<string, string[]> = {
  protein: ["ハンバーグ", "卵焼き", "チーズ", "から揚げ", "ソーセージ"],
  iron: ["ハンバーグ（レバー入り）", "ほうれん草カレー", "ひじきご飯"],
  calcium: ["牛乳", "チーズ", "ヨーグルト", "しらす"],
  vitaminA: ["にんじんハンバーグ", "かぼちゃコロッケ", "ほうれん草"],
  vitaminC: ["じゃがいも", "果物", "ブロッコリー"],
  fiber: ["さつまいも", "りんご", "バナナ", "コーンスープ"],
}

// 栄養素の定義
const NUTRIENT_CONFIG = [
  { key: "protein", name: "たんぱく質", unit: "g", emoji: "🥩" },
  { key: "iron", name: "鉄分", unit: "mg", emoji: "🩸" },
  { key: "calcium", name: "カルシウム", unit: "mg", emoji: "🦴" },
  { key: "vitaminA", name: "ビタミンA", unit: "μg", emoji: "👀" },
  { key: "vitaminC", name: "ビタミンC", unit: "mg", emoji: "🍊" },
  { key: "fiber", name: "食物繊維", unit: "g", emoji: "🥬" },
]

// 日単位の栄養ダッシュボード
export function DailyNutritionDashboard({
  nutrition,
  goals = DEFAULT_DAILY_GOALS,
  memberName = "お子さん",
  likedFoods = [],
  compact = false,
  showSettings = false,
}: DailyNutritionDashboardProps) {
  const router = useRouter()

  const nutrients = NUTRIENT_CONFIG.map((config) => ({
    ...config,
    current: nutrition[config.key as keyof NutritionData] || 0,
    goal: goals[config.key as keyof NutritionGoals] || 1,
  }))

  // 不足している栄養素を見つける
  const hasNoData = nutrients.every((n) => n.current === 0)
  const lowNutrients = nutrients.filter(
    (n) => (n.current / n.goal) * 100 < 60 && !hasNoData
  )

  // 不足栄養素に対する提案を生成
  const getSuggestion = () => {
    if (hasNoData) {
      return {
        message: "今日の献立を「完了」にすると栄養が記録されます",
        type: "info" as const,
      }
    }

    if (lowNutrients.length === 0) {
      return {
        message: `${memberName}は今日、栄養バランスがとても良いです！`,
        type: "success" as const,
      }
    }

    const lowestNutrient = lowNutrients.reduce((prev, curr) =>
      (prev.current / prev.goal) < (curr.current / curr.goal) ? prev : curr
    )

    const suggestions = FOOD_SUGGESTIONS[lowestNutrient.key] || []
    const matchedFood = likedFoods.find((food) =>
      suggestions.some((s) => s.includes(food) || food.includes(s))
    )

    const suggestedFood = matchedFood || suggestions[0] || "バランスの良い食事"

    return {
      message: `${lowestNutrient.name}が少し足りません。${suggestedFood}で補えますよ！`,
      type: "suggestion" as const,
    }
  }

  const suggestion = getSuggestion()

  // 達成度を計算（全体の平均）
  const overallProgress = hasNoData
    ? 0
    : Math.round(
        nutrients.reduce((acc, n) => acc + Math.min(100, (n.current / n.goal) * 100), 0) /
        nutrients.length
      )

  const content = (
    <div className="space-y-4">
      {/* 達成度サマリー */}
      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-amber-50 rounded-lg">
        <div>
          <p className="text-sm text-muted-foreground">今日の達成度</p>
          <p className="text-2xl font-bold text-green-700">{overallProgress}%</p>
        </div>
        <div className="w-16 h-16 relative">
          <svg className="w-16 h-16 -rotate-90">
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="6"
            />
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke={overallProgress >= 80 ? "#22c55e" : overallProgress >= 50 ? "#f59e0b" : "#e5e7eb"}
              strokeWidth="6"
              strokeDasharray={`${overallProgress * 1.76} 176`}
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      {/* 栄養素プログレスバー */}
      <div className={`grid ${compact ? "gap-2" : "gap-3"}`}>
        {nutrients.map((nutrient) => {
          const percentage = Math.min(
            100,
            Math.round((nutrient.current / nutrient.goal) * 100)
          )
          const isLow = percentage < 60 && !hasNoData
          const isGood = percentage >= 80

          return (
            <div key={nutrient.key} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1">
                  <span>{nutrient.emoji}</span>
                  <span className={isLow ? "text-amber-600 font-medium" : ""}>
                    {nutrient.name}
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {nutrient.current.toFixed(1)}/{nutrient.goal}{nutrient.unit}
                  </span>
                  <span className={`text-xs font-medium min-w-[32px] text-right ${
                    isLow ? "text-amber-600" : isGood ? "text-green-600" : "text-muted-foreground"
                  }`}>
                    {percentage}%
                  </span>
                </span>
              </div>
              <Progress
                value={percentage}
                className={`h-2 ${
                  isLow
                    ? "[&>div]:bg-amber-500"
                    : isGood
                    ? "[&>div]:bg-green-500"
                    : ""
                }`}
              />
            </div>
          )
        })}
      </div>

      {/* AIからの提案 */}
      <div
        className={`p-3 rounded-lg flex items-start gap-3 ${
          suggestion.type === "success"
            ? "bg-green-50 border border-green-200"
            : suggestion.type === "info"
            ? "bg-gray-50 border border-gray-200"
            : "bg-amber-50 border border-amber-200"
        }`}
      >
        <Lightbulb
          className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
            suggestion.type === "success"
              ? "text-green-600"
              : suggestion.type === "info"
              ? "text-gray-500"
              : "text-amber-600"
          }`}
        />
        <p className="text-sm">{suggestion.message}</p>
      </div>

      {/* 設定リンク */}
      {showSettings && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-muted-foreground"
          onClick={() => router.push("/settings#nutrition-goals")}
        >
          <Settings className="w-4 h-4 mr-2" />
          栄養目標をカスタマイズ
        </Button>
      )}
    </div>
  )

  if (compact) {
    return content
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="w-5 h-5 text-green-600" />
          今日の栄養バランス
        </CardTitle>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  )
}

// 後方互換性のための週単位ダッシュボード（デフォルトexport）
export default function NutritionDashboard({
  weeklyNutrition,
  memberName = "お子さん",
  likedFoods = [],
  compact = false,
}: WeeklyNutritionDashboardProps) {
  const weeklyGoals = {
    protein: DEFAULT_DAILY_GOALS.protein * 7,
    iron: DEFAULT_DAILY_GOALS.iron * 7,
    calcium: DEFAULT_DAILY_GOALS.calcium * 7,
    vitaminA: DEFAULT_DAILY_GOALS.vitaminA * 7,
    vitaminC: DEFAULT_DAILY_GOALS.vitaminC * 7,
    fiber: DEFAULT_DAILY_GOALS.fiber * 7,
  }

  const nutrients = NUTRIENT_CONFIG.map((config) => ({
    ...config,
    current: weeklyNutrition[config.key as keyof NutritionData] || 0,
    goal: weeklyGoals[config.key as keyof NutritionGoals],
  }))

  // 不足している栄養素を見つける
  const hasNoData = nutrients.every((n) => n.current === 0)
  const lowNutrients = nutrients.filter(
    (n) => (n.current / n.goal) * 100 < 60 && !hasNoData
  )

  // 不足栄養素に対する提案を生成
  const getSuggestion = () => {
    if (lowNutrients.length === 0) {
      return {
        message: `${memberName}は今週、栄養バランスがとても良いです！`,
        type: "success" as const,
      }
    }

    const lowestNutrient = lowNutrients.reduce((prev, curr) =>
      (prev.current / prev.goal) < (curr.current / curr.goal) ? prev : curr
    )

    const suggestions = FOOD_SUGGESTIONS[lowestNutrient.key] || []
    const matchedFood = likedFoods.find((food) =>
      suggestions.some((s) => s.includes(food) || food.includes(s))
    )

    const suggestedFood = matchedFood || suggestions[0]

    return {
      message: `${memberName}は今週、${lowestNutrient.name}が少し足りていません。好きな${suggestedFood}で補えますよ！`,
      type: "suggestion" as const,
    }
  }

  const suggestion = getSuggestion()

  const content = (
    <div className="space-y-4">
      {hasNoData && (
        <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 text-center">
          <p className="text-sm text-muted-foreground">
            献立を「完了」にすると栄養が記録されます
          </p>
        </div>
      )}
      {/* 栄養素プログレスバー */}
      <div className={`grid ${compact ? "gap-2" : "gap-3"}`}>
        {nutrients.map((nutrient) => {
          const percentage = Math.min(
            100,
            Math.round((nutrient.current / nutrient.goal) * 100)
          )
          const isLow = percentage < 60
          const isGood = percentage >= 80

          return (
            <div key={nutrient.key} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1">
                  <span>{nutrient.emoji}</span>
                  <span className={isLow ? "text-amber-600 font-medium" : ""}>
                    {nutrient.name}
                  </span>
                </span>
                <span className={`text-xs ${isLow ? "text-amber-600" : "text-muted-foreground"}`}>
                  {percentage}%
                </span>
              </div>
              <Progress
                value={percentage}
                className={`h-2 ${
                  isLow
                    ? "[&>div]:bg-amber-500"
                    : isGood
                    ? "[&>div]:bg-green-500"
                    : ""
                }`}
              />
            </div>
          )
        })}
      </div>

      {/* AIからの提案 */}
      <div
        className={`p-3 rounded-lg flex items-start gap-3 ${
          suggestion.type === "success"
            ? "bg-green-50 border border-green-200"
            : "bg-amber-50 border border-amber-200"
        }`}
      >
        <Lightbulb
          className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
            suggestion.type === "success" ? "text-green-600" : "text-amber-600"
          }`}
        />
        <p className="text-sm">{suggestion.message}</p>
      </div>
    </div>
  )

  if (compact) {
    return content
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="w-5 h-5 text-green-600" />
          今週の栄養バランス
        </CardTitle>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  )
}
