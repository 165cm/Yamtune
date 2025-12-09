"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ChefHat,
  Heart,
  Users,
  Clock,
  Flame,
  Beef,
  Wheat,
  Filter,
  CookingPot,
  ArrowLeft,
} from "lucide-react"
import { RecipeCardSkeleton } from "@/components/ui/skeleton"

interface Recipe {
  id: string
  title: string
  description: string
  servings: number
  cooking_time: number
  difficulty: string
  nutrition: {
    energy_kcal?: number
    protein_g?: number
    fat_g?: number
    carbohydrate_g?: number
  }
  image_url?: string
  isFavorite: boolean
  created_at: string
}

export default function RecipesPage() {
  const router = useRouter()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)

  useEffect(() => {
    fetchRecipes()
  }, [showFavoritesOnly])

  const fetchRecipes = async () => {
    setIsLoading(true)
    try {
      const url = showFavoritesOnly
        ? "/api/recipes?favorites=true"
        : "/api/recipes"
      const response = await fetch(url)
      if (!response.ok) throw new Error("Failed to fetch recipes")

      const data = await response.json()
      setRecipes(data.recipes)
    } catch (error) {
      console.error("Error fetching recipes:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const difficultyColor = (difficulty: string) => {
    return {
      簡単: "bg-green-100 text-green-800",
      普通: "bg-blue-100 text-blue-800",
      難しい: "bg-orange-100 text-orange-800",
    }[difficulty] || "bg-gray-100 text-gray-800"
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/home")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <ChefHat className="w-8 h-8" />
              レシピ一覧
            </h1>
            {!isLoading && (
              <p className="text-sm text-muted-foreground mt-1">
                {showFavoritesOnly
                  ? `お気に入り ${recipes.length}件`
                  : `全 ${recipes.length}件`}
              </p>
            )}
          </div>
        </div>

        <Button
          variant={showFavoritesOnly ? "default" : "outline"}
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          className="gap-2"
        >
          <Filter className="w-4 h-4" />
          {showFavoritesOnly ? "すべて表示" : "お気に入りのみ"}
        </Button>
      </div>

      {/* レシピリスト */}
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <RecipeCardSkeleton />
          <RecipeCardSkeleton />
          <RecipeCardSkeleton />
        </div>
      ) : recipes.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => (
            <Card
              key={recipe.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => router.push(`/recipes/${recipe.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg line-clamp-2">
                    {recipe.title}
                  </CardTitle>
                  {recipe.isFavorite && (
                    <Heart className="w-5 h-5 text-red-500 fill-current flex-shrink-0" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                  {recipe.description}
                </p>
              </CardHeader>
              <CardContent>
                {/* 基本情報バッジ */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="outline" className="gap-1">
                    <Users className="w-3 h-3" />
                    {recipe.servings}人分
                  </Badge>
                  {recipe.cooking_time && (
                    <Badge variant="outline" className="gap-1">
                      <Clock className="w-3 h-3" />
                      {recipe.cooking_time}分
                    </Badge>
                  )}
                  <Badge className={difficultyColor(recipe.difficulty)}>
                    {recipe.difficulty}
                  </Badge>
                </div>

                {/* 栄養情報サマリー */}
                {recipe.nutrition && (
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t">
                    {recipe.nutrition.energy_kcal !== undefined && (
                      <div className="text-center">
                        <Flame className="w-4 h-4 text-orange-600 mx-auto mb-1" />
                        <div className="text-sm font-bold">
                          {Math.round(
                            recipe.nutrition.energy_kcal / recipe.servings
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          kcal
                        </div>
                      </div>
                    )}
                    {recipe.nutrition.protein_g !== undefined && (
                      <div className="text-center">
                        <Beef className="w-4 h-4 text-red-600 mx-auto mb-1" />
                        <div className="text-sm font-bold">
                          {(
                            recipe.nutrition.protein_g / recipe.servings
                          ).toFixed(1)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          g P
                        </div>
                      </div>
                    )}
                    {recipe.nutrition.carbohydrate_g !== undefined && (
                      <div className="text-center">
                        <Wheat className="w-4 h-4 text-amber-600 mx-auto mb-1" />
                        <div className="text-sm font-bold">
                          {(
                            recipe.nutrition.carbohydrate_g /
                            recipe.servings
                          ).toFixed(1)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          g C
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <CookingPot className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {showFavoritesOnly
                ? "お気に入りのレシピがありません"
                : "まだレシピが作成されていません"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {showFavoritesOnly
                ? "レシピ詳細ページでお気に入りに追加してみましょう"
                : "ホームページから商品を登録して、レシピを生成してみましょう"}
            </p>
            <Button onClick={() => router.push("/home")} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              ホームに戻る
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
