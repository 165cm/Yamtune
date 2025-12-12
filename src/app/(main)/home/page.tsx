"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/stores/auth-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import NutritionDashboard from "@/components/features/nutrition/nutrition-dashboard"
import {
  Calendar,
  ChefHat,
  Heart,
  Check,
  Sun,
  Moon,
  CloudSun,
  ShoppingBag,
  Sparkles,
  Settings,
  ChevronDown,
  ChevronUp,
  Plus,
  LogOut,
  Flame,
} from "lucide-react"
import { FullPageLoader } from "@/components/ui/skeleton"

export default function HomePage() {
  const router = useRouter()
  const { user, setUser, isLoading, setIsLoading } = useAuthStore()
  const supabase = createClient()
  const [recentRecipes, setRecentRecipes] = useState<any[]>([])
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(true)
  const [familyPreferences, setFamilyPreferences] = useState<any[]>([])
  const [todayMeals, setTodayMeals] = useState<any[]>([])
  const [isLoadingMeals, setIsLoadingMeals] = useState(true)
  const [weeklyNutrition, setWeeklyNutrition] = useState({
    protein: 0, iron: 0, calcium: 0, vitaminA: 0, vitaminC: 0, fiber: 0
  })
  const [isLoadingNutrition, setIsLoadingNutrition] = useState(true)
  const [isNutritionOpen, setIsNutritionOpen] = useState(false)
  const [productCount, setProductCount] = useState(0)
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setIsLoading(false)

      if (!user) {
        router.push("/login")
      } else {
        fetchRecentRecipes()
        fetchFamilyPreferences()
        fetchTodayMeals()
        fetchWeeklyNutrition()
        fetchProductCount()
        fetchStreak()
      }
    }

    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase, setUser, setIsLoading, router])

  const fetchProductCount = async () => {
    try {
      const response = await fetch("/api/products")
      if (response.ok) {
        const data = await response.json()
        setProductCount(data.length)
      }
    } catch (error) {
      console.error("Failed to fetch products:", error)
    }
  }

  const fetchRecentRecipes = async () => {
    try {
      const response = await fetch("/api/recipes")
      if (response.ok) {
        const data = await response.json()
        setRecentRecipes(data.recipes.slice(0, 6))
      }
    } catch (error) {
      console.error("Failed to fetch recipes:", error)
    } finally {
      setIsLoadingRecipes(false)
    }
  }

  const fetchFamilyPreferences = async () => {
    try {
      const familyRes = await fetch("/api/families")
      if (!familyRes.ok) return

      const families = await familyRes.json()
      if (families.length === 0) return

      const membersRes = await fetch(`/api/members?family_id=${families[0].id}`)
      if (!membersRes.ok) return

      const members = await membersRes.json()

      const allPreferences: any[] = []
      for (const member of members) {
        const foodsRes = await fetch(`/api/members/${member.id}/foods`)
        if (foodsRes.ok) {
          const foods = await foodsRes.json()
          foods.forEach((food: any) => {
            allPreferences.push({
              memberName: member.name,
              foodName: food.food_name,
              status: food.status,
            })
          })
        }
      }

      setFamilyPreferences(allPreferences)
    } catch (error) {
      console.error("Failed to fetch family preferences:", error)
    }
  }

  const fetchTodayMeals = async () => {
    try {
      const today = new Date().toISOString().split("T")[0]
      const response = await fetch(
        `/api/meal-plans?start_date=${today}&end_date=${today}`
      )
      if (response.ok) {
        const data = await response.json()
        setTodayMeals(data.mealPlans || [])
      }
    } catch (error) {
      console.error("Failed to fetch today meals:", error)
    } finally {
      setIsLoadingMeals(false)
    }
  }

  const fetchWeeklyNutrition = async () => {
    try {
      const today = new Date()
      const dayOfWeek = today.getDay()
      const monday = new Date(today)
      monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 6)

      const startDate = monday.toISOString().split("T")[0]
      const endDate = sunday.toISOString().split("T")[0]

      const response = await fetch(
        `/api/nutrition?start_date=${startDate}&end_date=${endDate}`
      )
      if (response.ok) {
        const data = await response.json()
        setWeeklyNutrition(data.weeklyNutrition)
      }
    } catch (error) {
      console.error("Failed to fetch weekly nutrition:", error)
    } finally {
      setIsLoadingNutrition(false)
    }
  }

  // ストリーク（連続達成日数）を計算
  const fetchStreak = async () => {
    try {
      // 過去30日分の献立を取得
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 30)

      const response = await fetch(
        `/api/meal-plans?start_date=${startDate.toISOString().split("T")[0]}&end_date=${endDate.toISOString().split("T")[0]}`
      )
      if (!response.ok) return

      const data = await response.json()
      const mealPlans = data.mealPlans || []

      // 日付ごとに完了した食事があるかチェック
      let currentStreak = 0
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      for (let i = 0; i <= 30; i++) {
        const checkDate = new Date(today)
        checkDate.setDate(today.getDate() - i)
        const dateStr = checkDate.toISOString().split("T")[0]

        const dayMeals = mealPlans.filter(
          (m: any) => m.plannedDate === dateStr && m.isCompleted
        )

        if (dayMeals.length > 0) {
          currentStreak++
        } else if (i > 0) {
          // 今日以外で途切れたらストップ
          break
        }
      }

      setStreak(currentStreak)
    } catch (error) {
      console.error("Failed to fetch streak:", error)
    }
  }

  // 献立の完了を切り替え
  const toggleMealComplete = async (mealId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/meal-plans/${mealId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted: !currentStatus }),
      })
      if (response.ok) {
        fetchTodayMeals()
        fetchStreak()
        fetchWeeklyNutrition()
      }
    } catch (error) {
      console.error("Failed to toggle meal completion:", error)
    }
  }

  // 挨拶メッセージとアイコンを時間帯で変更
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return { text: "おはようございます", icon: Sun }
    if (hour < 18) return { text: "こんにちは", icon: CloudSun }
    return { text: "こんばんは", icon: Moon }
  }

  // 食事タイプのラベル
  const getMealLabel = (mealType: string) => {
    const labels: Record<string, { label: string; emoji: string }> = {
      breakfast: { label: "朝食", emoji: "🍳" },
      lunch: { label: "昼食", emoji: "🍱" },
      dinner: { label: "夕食", emoji: "🍽️" },
      snack: { label: "おやつ", emoji: "🍪" },
    }
    return labels[mealType] || { label: mealType, emoji: "🍴" }
  }

  // 今日の献立を食事タイプ順にソート
  const sortedTodayMeals = [...todayMeals].sort((a, b) => {
    const order = ["breakfast", "lunch", "dinner", "snack"]
    return order.indexOf(a.mealType) - order.indexOf(b.mealType)
  })

  // 今日の日付フォーマット
  const getFormattedDate = () => {
    const today = new Date()
    const weekdays = ["日", "月", "火", "水", "木", "金", "土"]
    return `${today.getMonth() + 1}月${today.getDate()}日（${weekdays[today.getDay()]}）`
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  const greeting = getGreeting()
  const GreetingIcon = greeting.icon

  if (isLoading) {
    return <FullPageLoader />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-amber-50 pb-24">
      {/* ヘッダー */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-orange-500 bg-clip-text text-transparent">
            Yamtune
          </h1>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/settings")}
            >
              <Settings className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* 挨拶カード + ストリーク */}
        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <GreetingIcon className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-lg font-medium">{greeting.text}</p>
                  <p className="text-sm text-muted-foreground">{getFormattedDate()}</p>
                </div>
              </div>
              {/* ストリーク表示 */}
              {streak > 0 && (
                <div className="flex flex-col items-center bg-orange-100 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-1">
                    <Flame className="w-5 h-5 text-orange-500" />
                    <span className="text-2xl font-bold text-orange-600">{streak}</span>
                  </div>
                  <span className="text-xs text-orange-600">日連続</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 今日の献立 */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-500" />
                今日の献立
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/calendar")}
                className="text-xs"
              >
                カレンダー →
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            {isLoadingMeals ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : sortedTodayMeals.length > 0 ? (
              <div className="space-y-2">
                {sortedTodayMeals.map((meal) => {
                  const mealInfo = getMealLabel(meal.mealType)
                  return (
                    <div
                      key={meal.id}
                      className={`flex items-center gap-2 p-3 rounded-lg transition-all ${
                        meal.isCompleted
                          ? "bg-green-50 border border-green-200"
                          : "bg-gray-50 border border-transparent"
                      }`}
                    >
                      <span className="text-xl">{mealInfo.emoji}</span>
                      <span className="text-sm font-medium w-10">{mealInfo.label}</span>
                      <button
                        className="flex-1 text-left"
                        onClick={() => meal.recipe && router.push(`/recipes/${meal.recipe.id}`)}
                      >
                        <span className="text-sm truncate block">
                          {meal.recipe?.title || "未設定"}
                        </span>
                      </button>
                      {/* 完了ボタン */}
                      {meal.recipe && (
                        <button
                          onClick={() => toggleMealComplete(meal.id, meal.isCompleted)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                            meal.isCompleted
                              ? "bg-green-500 text-white"
                              : "bg-gray-200 text-gray-400 hover:bg-green-400 hover:text-white"
                          }`}
                          title={meal.isCompleted ? "完了を取り消す" : "完了にする"}
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground mb-3">
                  今日の献立がまだありません
                </p>
                <Button
                  size="sm"
                  onClick={() => router.push("/calendar")}
                  className="bg-amber-500 hover:bg-amber-600"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  献立を設定
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 最近のレシピ（横スクロール） */}
        {recentRecipes.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <ChefHat className="w-5 h-5" />
                最近のレシピ
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/recipes")}
                className="text-xs"
              >
                すべて見る →
              </Button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory">
              {recentRecipes.map((recipe) => (
                <Card
                  key={recipe.id}
                  className="flex-shrink-0 w-40 cursor-pointer hover:shadow-lg transition-shadow snap-start"
                  onClick={() => router.push(`/recipes/${recipe.id}`)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <h3 className="text-sm font-medium line-clamp-2 flex-1">
                        {recipe.title}
                      </h3>
                      {recipe.isFavorite && (
                        <Heart className="w-3 h-3 text-red-500 fill-current flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      <span>{recipe.cooking_time}分</span>
                      <span>•</span>
                      <span>{recipe.difficulty}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* 栄養バランス（折りたたみ） */}
        {!isLoadingNutrition && (
          <Collapsible open={isNutritionOpen} onOpenChange={setIsNutritionOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-500" />
                      今週の栄養バランス
                    </CardTitle>
                    {isNutritionOpen ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <NutritionDashboard
                    weeklyNutrition={weeklyNutrition}
                    likedFoods={familyPreferences
                      .filter((p) => p.status === "like")
                      .map((p) => p.foodName)}
                    compact
                  />
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}

        {/* レシピを作るボタン */}
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200"
          onClick={() => router.push("/products?action=generate")}
        >
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-orange-500" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-orange-700">AIでレシピを作る</p>
              <p className="text-xs text-muted-foreground">商品を選んで自動生成</p>
            </div>
            <ChefHat className="w-6 h-6 text-orange-400" />
          </CardContent>
        </Card>

        {/* クイックステータス */}
        <div className="grid grid-cols-2 gap-3">
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push("/products")}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{productCount}</p>
                <p className="text-xs text-muted-foreground">登録商品</p>
              </div>
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push("/recipes")}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <ChefHat className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{recentRecipes.length > 0 ? "+" : "0"}</p>
                <p className="text-xs text-muted-foreground">レシピ</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* フローティングアクションバー */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="max-w-lg mx-auto px-4 py-2">
          <div className="grid grid-cols-4 gap-1">
            <Button
              variant="ghost"
              className="flex flex-col items-center gap-1 h-auto py-2"
              onClick={() => router.push("/calendar")}
            >
              <Calendar className="w-5 h-5 text-amber-600" />
              <span className="text-xs">献立</span>
            </Button>
            <Button
              variant="ghost"
              className="flex flex-col items-center gap-1 h-auto py-2"
              onClick={() => router.push("/products")}
            >
              <ShoppingBag className="w-5 h-5 text-green-600" />
              <span className="text-xs">商品</span>
            </Button>
            <Button
              variant="ghost"
              className="flex flex-col items-center gap-1 h-auto py-2"
              onClick={() => router.push("/recipes")}
            >
              <ChefHat className="w-5 h-5 text-orange-600" />
              <span className="text-xs">レシピ</span>
            </Button>
            <Button
              variant="ghost"
              className="flex flex-col items-center gap-1 h-auto py-2"
              onClick={() => router.push("/family")}
            >
              <Heart className="w-5 h-5 text-pink-600" />
              <span className="text-xs">家族</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
