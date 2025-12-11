"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import MealSlot from "./meal-slot"
import MealPlannerDialog from "./meal-planner-dialog"

interface Recipe {
  id: string
  title: string
  description?: string
  servings?: number
  cooking_time?: number
  difficulty?: string
  image_url?: string
}

interface MealPlan {
  id: string
  plannedDate: string
  mealType: "breakfast" | "lunch" | "dinner" | "snack"
  isCompleted: boolean
  memo?: string
  recipe?: Recipe
}

interface WeeklyCalendarProps {
  recipes: Recipe[]
  onMealPlanChange?: () => void
}

const MEAL_TYPES = [
  { key: "breakfast", label: "朝食", emoji: "🍳" },
  { key: "lunch", label: "昼食", emoji: "🍱" },
  { key: "dinner", label: "夕食", emoji: "🍽️" },
] as const

const DAY_NAMES = ["日", "月", "火", "水", "木", "金", "土"]

export default function WeeklyCalendar({ recipes, onMealPlanChange }: WeeklyCalendarProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) // 月曜始まり
    const monday = new Date(today)
    monday.setDate(diff)
    monday.setHours(0, 0, 0, 0)
    return monday
  })

  const [mealPlans, setMealPlans] = useState<MealPlan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSlot, setSelectedSlot] = useState<{
    date: string
    mealType: "breakfast" | "lunch" | "dinner" | "snack"
    existingPlan?: MealPlan
  } | null>(null)

  // 週の日付配列を生成
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(currentWeekStart)
    date.setDate(currentWeekStart.getDate() + i)
    return date
  })

  // 日付をYYYY-MM-DD形式に変換
  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0]
  }

  // 献立を取得
  const fetchMealPlans = useCallback(async () => {
    setIsLoading(true)
    try {
      const dates = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(currentWeekStart)
        date.setDate(currentWeekStart.getDate() + i)
        return date
      })
      const startDate = formatDate(dates[0])
      const endDate = formatDate(dates[6])
      const response = await fetch(
        `/api/meal-plans?start_date=${startDate}&end_date=${endDate}`
      )
      if (response.ok) {
        const data = await response.json()
        setMealPlans(data.mealPlans)
      }
    } catch (error) {
      console.error("Failed to fetch meal plans:", error)
    } finally {
      setIsLoading(false)
    }
  }, [currentWeekStart])

  useEffect(() => {
    fetchMealPlans()
  }, [fetchMealPlans])

  // 前週へ
  const goToPrevWeek = () => {
    const newDate = new Date(currentWeekStart)
    newDate.setDate(newDate.getDate() - 7)
    setCurrentWeekStart(newDate)
  }

  // 次週へ
  const goToNextWeek = () => {
    const newDate = new Date(currentWeekStart)
    newDate.setDate(newDate.getDate() + 7)
    setCurrentWeekStart(newDate)
  }

  // 今週へ
  const goToCurrentWeek = () => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
    const monday = new Date(today)
    monday.setDate(diff)
    monday.setHours(0, 0, 0, 0)
    setCurrentWeekStart(monday)
  }

  // 特定の日・食事タイプの献立を取得
  const getMealPlan = (date: Date, mealType: string): MealPlan | undefined => {
    const dateStr = formatDate(date)
    return mealPlans.find(
      (plan) => plan.plannedDate === dateStr && plan.mealType === mealType
    )
  }

  // 献立完了を切り替え
  const handleToggleComplete = async (plan: MealPlan) => {
    try {
      const response = await fetch(`/api/meal-plans/${plan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted: !plan.isCompleted }),
      })
      if (response.ok) {
        fetchMealPlans()
        onMealPlanChange?.()
      }
    } catch (error) {
      console.error("Failed to toggle completion:", error)
    }
  }

  // 献立を削除
  const handleDelete = async (plan: MealPlan) => {
    try {
      const response = await fetch(`/api/meal-plans/${plan.id}`, {
        method: "DELETE",
      })
      if (response.ok) {
        fetchMealPlans()
        onMealPlanChange?.()
      }
    } catch (error) {
      console.error("Failed to delete meal plan:", error)
    }
  }

  // 献立スロットをクリック
  const handleSlotClick = (date: Date, mealType: "breakfast" | "lunch" | "dinner" | "snack") => {
    const dateStr = formatDate(date)
    const existingPlan = getMealPlan(date, mealType)
    setSelectedSlot({ date: dateStr, mealType, existingPlan })
  }

  // 献立を保存
  const handleSaveMealPlan = async (recipeId: string | null, memo?: string) => {
    if (!selectedSlot) return

    try {
      const response = await fetch("/api/meal-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipeId,
          plannedDate: selectedSlot.date,
          mealType: selectedSlot.mealType,
          memo,
        }),
      })
      if (response.ok) {
        fetchMealPlans()
        onMealPlanChange?.()
        setSelectedSlot(null)
      }
    } catch (error) {
      console.error("Failed to save meal plan:", error)
    }
  }

  // 今日かどうかチェック
  const isToday = (date: Date) => {
    const today = new Date()
    return formatDate(date) === formatDate(today)
  }

  // 週の表示文字列
  const getWeekLabel = () => {
    const startMonth = weekDates[0].getMonth() + 1
    const startDay = weekDates[0].getDate()
    const endMonth = weekDates[6].getMonth() + 1
    const endDay = weekDates[6].getDate()

    if (startMonth === endMonth) {
      return `${startMonth}月${startDay}日〜${endDay}日`
    }
    return `${startMonth}月${startDay}日〜${endMonth}月${endDay}日`
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            献立カレンダー
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToPrevWeek}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToCurrentWeek}>
              今週
            </Button>
            <Button variant="outline" size="sm" onClick={goToNextWeek}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{getWeekLabel()}</p>
      </CardHeader>
      <CardContent>
        {/* 曜日ヘッダー */}
        <div className="grid grid-cols-8 gap-1 mb-2">
          <div className="text-center text-xs font-medium text-muted-foreground py-2">
            {/* 空セル */}
          </div>
          {weekDates.map((date, index) => (
            <div
              key={index}
              className={`text-center text-xs py-2 rounded-lg ${
                isToday(date)
                  ? "bg-green-100 text-green-800 font-bold"
                  : "text-muted-foreground"
              }`}
            >
              <div className={date.getDay() === 0 ? "text-red-500" : date.getDay() === 6 ? "text-blue-500" : ""}>
                {DAY_NAMES[date.getDay()]}
              </div>
              <div className="text-lg font-medium">{date.getDate()}</div>
            </div>
          ))}
        </div>

        {/* 食事タイプ行 */}
        {MEAL_TYPES.map((mealType) => (
          <div key={mealType.key} className="grid grid-cols-8 gap-1 mb-1">
            <div className="flex items-center justify-center text-xs font-medium py-2">
              <span className="mr-1">{mealType.emoji}</span>
              <span className="hidden sm:inline">{mealType.label}</span>
            </div>
            {weekDates.map((date, index) => {
              const plan = getMealPlan(date, mealType.key)
              return (
                <MealSlot
                  key={`${mealType.key}-${index}`}
                  mealPlan={plan}
                  isToday={isToday(date)}
                  isLoading={isLoading}
                  onClick={() => handleSlotClick(date, mealType.key)}
                  onToggleComplete={plan ? () => handleToggleComplete(plan) : undefined}
                  onDelete={plan ? () => handleDelete(plan) : undefined}
                />
              )
            })}
          </div>
        ))}

        {/* レシピ選択ダイアログ */}
        <MealPlannerDialog
          open={selectedSlot !== null}
          onOpenChange={(open) => !open && setSelectedSlot(null)}
          recipes={recipes}
          existingPlan={selectedSlot?.existingPlan}
          onSave={handleSaveMealPlan}
          mealType={selectedSlot?.mealType}
          date={selectedSlot?.date}
        />
      </CardContent>
    </Card>
  )
}
