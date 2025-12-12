"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/stores/auth-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import WeeklyCalendar from "@/components/features/calendar/weekly-calendar"
import { ArrowLeft, ChefHat, Sparkles } from "lucide-react"
import { FullPageLoader } from "@/components/ui/skeleton"

interface Recipe {
  id: string
  title: string
  description?: string
  servings?: number
  cooking_time?: number
  difficulty?: string
  image_url?: string
}

export default function CalendarPage() {
  const router = useRouter()
  const { user, setUser, isLoading, setIsLoading } = useAuthStore()
  const supabase = createClient()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(true)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setIsLoading(false)

      if (!user) {
        router.push("/login")
      } else {
        fetchRecipes()
      }
    }

    checkUser()
  }, [supabase, setUser, setIsLoading, router])

  const fetchRecipes = async () => {
    try {
      const response = await fetch("/api/recipes")
      if (response.ok) {
        const data = await response.json()
        setRecipes(data.recipes)
      }
    } catch (error) {
      console.error("Failed to fetch recipes:", error)
    } finally {
      setIsLoadingRecipes(false)
    }
  }

  if (isLoading) {
    return <FullPageLoader />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-amber-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6 py-8">
        {/* ヘッダー */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/home")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            戻る
          </Button>
          <h1 className="text-2xl font-bold">献立カレンダー</h1>
        </div>

        {/* 説明カード */}
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-100 rounded-full">
                <Sparkles className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-green-900 mb-1">
                  好きなもので栄養バッチリ！
                </h3>
                <p className="text-sm text-green-700">
                  週間の献立を計画して、毎日の「今日何作ろう？」を解決しましょう。
                  レシピをクリックして献立を設定できます。
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 週間カレンダー */}
        <WeeklyCalendar
          recipes={recipes}
          onMealPlanChange={fetchRecipes}
        />

        {/* レシピがない場合のガイド */}
        {!isLoadingRecipes && recipes.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ChefHat className="w-5 h-5" />
                まずはレシピを作成しましょう
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                献立を設定するには、まずレシピを作成する必要があります。
                ホーム画面から商品をスキャンして、AIレシピを生成してみましょう。
              </p>
              <Button onClick={() => router.push("/home")}>
                ホームへ戻る
              </Button>
            </CardContent>
          </Card>
        )}

        {/* クイックアクション */}
        <div className="grid gap-4 md:grid-cols-2">
          <Button
            variant="outline"
            className="h-16"
            onClick={() => router.push("/recipes")}
          >
            <ChefHat className="w-5 h-5 mr-2" />
            レシピ一覧を見る
          </Button>
          <Button
            variant="outline"
            className="h-16"
            onClick={() => router.push("/home")}
          >
            <Sparkles className="w-5 h-5 mr-2" />
            新しいレシピを作る
          </Button>
        </div>
      </div>
    </div>
  )
}
