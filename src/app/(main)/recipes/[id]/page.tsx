"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CookingLogDialog } from "@/components/features/recipes/cooking-log-dialog"
import {
  ArrowLeft,
  Heart,
  Users,
  Clock,
  Flame,
  Beef,
  Wheat,
  Droplet,
  CheckCircle2,
} from "lucide-react"

interface Recipe {
  id: string
  title: string
  description: string
  servings: number
  cooking_time_minutes: number
  difficulty: string
  image_url?: string
  total_nutrition: {
    energy_kcal?: number
    protein_g?: number
    fat_g?: number
    carbohydrate_g?: number
    salt_g?: number
  }
  tips?: string[]
  ingredients: Array<{
    name: string
    amount: string
    category?: string
  }>
  steps: Array<{
    step_number: number
    instruction: string
    time_minutes?: number
  }>
  isFavorite: boolean
}

export default function RecipeDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false)

  useEffect(() => {
    fetchRecipe()
  }, [params.id])

  const fetchRecipe = async () => {
    try {
      const response = await fetch(`/api/recipes/${params.id}`)
      if (!response.ok) throw new Error("Failed to fetch recipe")

      const data = await response.json()
      setRecipe(data.recipe)
      setIsFavorite(data.recipe.isFavorite)
    } catch (error) {
      console.error("Error fetching recipe:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleFavorite = async () => {
    setIsTogglingFavorite(true)
    try {
      const newFavoriteStatus = !isFavorite
      const response = await fetch(`/api/recipes/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: newFavoriteStatus }),
      })

      if (!response.ok) throw new Error("Failed to update favorite status")

      setIsFavorite(newFavoriteStatus)
    } catch (error) {
      console.error("Error toggling favorite:", error)
    } finally {
      setIsTogglingFavorite(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">読み込み中...</div>
        </div>
      </div>
    )
  }

  if (!recipe) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground mb-4">
            レシピが見つかりませんでした
          </p>
          <Button onClick={() => router.push("/home")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            ホームに戻る
          </Button>
        </div>
      </div>
    )
  }

  const difficultyColor = {
    簡単: "bg-green-100 text-green-800",
    普通: "bg-blue-100 text-blue-800",
    難しい: "bg-orange-100 text-orange-800",
  }[recipe.difficulty] || "bg-gray-100 text-gray-800"

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* ヘッダー */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            onClick={() => router.push("/recipes")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            レシピ一覧
          </Button>
          <div className="flex gap-2">
            <CookingLogDialog
              recipeId={recipe.id}
              recipeTitle={recipe.title}
              onSuccess={() => {
                // 調理記録が成功したら、ページをリロードして最新のデータを取得
                fetchRecipe()
              }}
            />
            <Button
              variant={isFavorite ? "default" : "outline"}
              onClick={toggleFavorite}
              disabled={isTogglingFavorite}
              className="gap-2"
            >
              <Heart
                className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`}
              />
              {isFavorite ? "お気に入り済み" : "お気に入り"}
            </Button>
          </div>
        </div>
      </div>

      {/* タイトルと基本情報 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl">{recipe.title}</CardTitle>
          <p className="text-muted-foreground mt-2">{recipe.description}</p>
          <div className="flex flex-wrap gap-3 mt-4">
            <Badge variant="outline" className="gap-1">
              <Users className="w-3 h-3" />
              {recipe.servings}人分
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Clock className="w-3 h-3" />
              {recipe.cooking_time_minutes}分
            </Badge>
            <Badge className={difficultyColor}>{recipe.difficulty}</Badge>
          </div>
        </CardHeader>
      </Card>

      {/* AI生成画像 */}
      {recipe.image_url && (
        <Card className="mb-6 overflow-hidden">
          <CardContent className="p-0">
            <img
              src={recipe.image_url}
              alt={recipe.title}
              className="w-full h-auto object-cover max-h-96"
            />
          </CardContent>
        </Card>
      )}

      {/* 栄養情報 */}
      {recipe.total_nutrition && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">栄養情報（1人分）</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {recipe.total_nutrition.energy_kcal !== undefined && (
                <div className="flex flex-col items-center p-3 bg-orange-50 rounded-lg">
                  <Flame className="w-5 h-5 text-orange-600 mb-1" />
                  <div className="text-2xl font-bold text-orange-600">
                    {Math.round(recipe.total_nutrition.energy_kcal / recipe.servings)}
                  </div>
                  <div className="text-xs text-muted-foreground">kcal</div>
                </div>
              )}
              {recipe.total_nutrition.protein_g !== undefined && (
                <div className="flex flex-col items-center p-3 bg-red-50 rounded-lg">
                  <Beef className="w-5 h-5 text-red-600 mb-1" />
                  <div className="text-2xl font-bold text-red-600">
                    {(recipe.total_nutrition.protein_g / recipe.servings).toFixed(1)}
                  </div>
                  <div className="text-xs text-muted-foreground">g たんぱく質</div>
                </div>
              )}
              {recipe.total_nutrition.fat_g !== undefined && (
                <div className="flex flex-col items-center p-3 bg-yellow-50 rounded-lg">
                  <Droplet className="w-5 h-5 text-yellow-600 mb-1" />
                  <div className="text-2xl font-bold text-yellow-600">
                    {(recipe.total_nutrition.fat_g / recipe.servings).toFixed(1)}
                  </div>
                  <div className="text-xs text-muted-foreground">g 脂質</div>
                </div>
              )}
              {recipe.total_nutrition.carbohydrate_g !== undefined && (
                <div className="flex flex-col items-center p-3 bg-amber-50 rounded-lg">
                  <Wheat className="w-5 h-5 text-amber-600 mb-1" />
                  <div className="text-2xl font-bold text-amber-600">
                    {(recipe.total_nutrition.carbohydrate_g / recipe.servings).toFixed(1)}
                  </div>
                  <div className="text-xs text-muted-foreground">g 炭水化物</div>
                </div>
              )}
              {recipe.total_nutrition.salt_g !== undefined && (
                <div className="flex flex-col items-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {(recipe.total_nutrition.salt_g / recipe.servings).toFixed(1)}
                  </div>
                  <div className="text-xs text-muted-foreground">g 食塩</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 材料 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">材料</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recipe.ingredients.map((ingredient, index) => (
              <div
                key={index}
                className="flex justify-between items-center py-2 border-b last:border-b-0"
              >
                <span className="font-medium">{ingredient.name}</span>
                <span className="text-muted-foreground">
                  {ingredient.amount}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 作り方 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">作り方</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recipe.steps.map((step) => (
              <div key={step.step_number} className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    {step.step_number}
                  </div>
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-sm leading-relaxed">{step.instruction}</p>
                  {step.time_minutes && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      約{step.time_minutes}分
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* アドバイス・Tips */}
      {recipe.tips && recipe.tips.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">栄養士からのアドバイス</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recipe.tips.map((tip, index) => (
                <div key={index} className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
