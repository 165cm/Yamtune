"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Activity, Lightbulb } from "lucide-react"

interface NutrientData {
  name: string
  current: number
  goal: number
  unit: string
  emoji: string
  suggestion?: string
}

interface NutritionDashboardProps {
  weeklyNutrition: {
    protein: number
    iron: number
    calcium: number
    vitaminA: number
    vitaminC: number
    fiber: number
  }
  memberName?: string
  likedFoods?: string[]
  compact?: boolean
}

// 子どもの1日あたりの推奨栄養素（6〜7歳を基準）× 7日
const WEEKLY_GOALS = {
  protein: 35 * 7,      // g - たんぱく質
  iron: 6.5 * 7,        // mg - 鉄分
  calcium: 600 * 7,     // mg - カルシウム
  vitaminA: 400 * 7,    // μg - ビタミンA
  vitaminC: 55 * 7,     // mg - ビタミンC
  fiber: 11 * 7,        // g - 食物繊維
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

export default function NutritionDashboard({
  weeklyNutrition,
  memberName = "お子さん",
  likedFoods = [],
  compact = false,
}: NutritionDashboardProps) {
  const nutrients: NutrientData[] = [
    {
      name: "たんぱく質",
      current: weeklyNutrition.protein,
      goal: WEEKLY_GOALS.protein,
      unit: "g",
      emoji: "🥩",
    },
    {
      name: "鉄分",
      current: weeklyNutrition.iron,
      goal: WEEKLY_GOALS.iron,
      unit: "mg",
      emoji: "🩸",
    },
    {
      name: "カルシウム",
      current: weeklyNutrition.calcium,
      goal: WEEKLY_GOALS.calcium,
      unit: "mg",
      emoji: "🦴",
    },
    {
      name: "ビタミンA",
      current: weeklyNutrition.vitaminA,
      goal: WEEKLY_GOALS.vitaminA,
      unit: "μg",
      emoji: "👀",
    },
    {
      name: "ビタミンC",
      current: weeklyNutrition.vitaminC,
      goal: WEEKLY_GOALS.vitaminC,
      unit: "mg",
      emoji: "🍊",
    },
    {
      name: "食物繊維",
      current: weeklyNutrition.fiber,
      goal: WEEKLY_GOALS.fiber,
      unit: "g",
      emoji: "🥬",
    },
  ]

  // 不足している栄養素を見つける
  const lowNutrients = nutrients.filter(
    (n) => (n.current / n.goal) * 100 < 60
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

    const nutrientKey = lowestNutrient.name === "たんぱく質" ? "protein"
      : lowestNutrient.name === "鉄分" ? "iron"
      : lowestNutrient.name === "カルシウム" ? "calcium"
      : lowestNutrient.name === "ビタミンA" ? "vitaminA"
      : lowestNutrient.name === "ビタミンC" ? "vitaminC"
      : "fiber"

    const suggestions = FOOD_SUGGESTIONS[nutrientKey]
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

  // すべての栄養素が0かどうかをチェック
  const hasNoData = nutrients.every((n) => n.current === 0)

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
            <div key={nutrient.name} className="space-y-1">
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
