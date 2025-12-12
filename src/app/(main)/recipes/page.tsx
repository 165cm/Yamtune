"use client"

import { useEffect, useState, useCallback } from "react"
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
  Trash2,
  CheckSquare,
  Square,
  X,
  Plus,
  Sparkles,
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
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchRecipes = useCallback(async () => {
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
  }, [showFavoritesOnly])

  useEffect(() => {
    fetchRecipes()
  }, [fetchRecipes])

  const difficultyColor = (difficulty: string) => {
    return {
      簡単: "bg-green-100 text-green-800",
      普通: "bg-blue-100 text-blue-800",
      難しい: "bg-orange-100 text-orange-800",
    }[difficulty] || "bg-gray-100 text-gray-800"
  }

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const selectAll = () => {
    setSelectedIds(new Set(recipes.map((r) => r.id)))
  }

  const exitSelectionMode = () => {
    setIsSelectionMode(false)
    setSelectedIds(new Set())
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return

    const confirmed = window.confirm(
      `${selectedIds.size}件のレシピを削除しますか？\nこの操作は取り消せません。`
    )
    if (!confirmed) return

    setIsDeleting(true)
    try {
      const response = await fetch("/api/recipes/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeIds: Array.from(selectedIds) }),
      })

      if (!response.ok) throw new Error("Failed to delete recipes")

      // 削除完了後、リストを更新
      await fetchRecipes()
      exitSelectionMode()
    } catch (error) {
      console.error("Error deleting recipes:", error)
      alert("削除に失敗しました")
    } finally {
      setIsDeleting(false)
    }
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

        {isSelectionMode ? (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={selectAll}
              className="gap-1"
            >
              <CheckSquare className="w-4 h-4" />
              全選択
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exitSelectionMode}
              className="gap-1"
            >
              <X className="w-4 h-4" />
              キャンセル
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setIsSelectionMode(true)}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              選択削除
            </Button>
            <Button
              variant={showFavoritesOnly ? "default" : "outline"}
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className="gap-2"
            >
              <Filter className="w-4 h-4" />
              {showFavoritesOnly ? "すべて表示" : "お気に入りのみ"}
            </Button>
          </div>
        )}
      </div>

      {/* 選択モード時のアクションバー */}
      {isSelectionMode && selectedIds.size > 0 && (
        <div className="fixed bottom-20 left-0 right-0 z-50 px-4">
          <div className="bg-red-500 text-white rounded-lg p-4 shadow-lg flex items-center justify-between max-w-md mx-auto">
            <span className="font-medium">{selectedIds.size}件選択中</span>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {isDeleting ? "削除中..." : "削除する"}
            </Button>
          </div>
        </div>
      )}

      {/* レシピリスト */}
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <RecipeCardSkeleton />
          <RecipeCardSkeleton />
          <RecipeCardSkeleton />
        </div>
      ) : recipes.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* 新しいレシピを作るカード（選択モード時は非表示） */}
          {!isSelectionMode && (
            <Card
              className="cursor-pointer hover:shadow-lg transition-all border-2 border-dashed border-orange-300 bg-gradient-to-br from-orange-50 to-amber-50"
              onClick={() => router.push("/products?action=generate")}
            >
              <CardContent className="flex flex-col items-center justify-center h-full min-h-[200px] py-8">
                <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mb-4">
                  <Plus className="w-8 h-8 text-orange-500" />
                </div>
                <h3 className="text-lg font-semibold text-orange-700 mb-1">
                  新しいレシピを作る
                </h3>
                <p className="text-sm text-muted-foreground text-center">
                  <Sparkles className="w-4 h-4 inline mr-1" />
                  AIが自動生成
                </p>
              </CardContent>
            </Card>
          )}
          {recipes.map((recipe) => (
            <Card
              key={recipe.id}
              className={`cursor-pointer hover:shadow-lg transition-all ${
                isSelectionMode && selectedIds.has(recipe.id)
                  ? "ring-2 ring-red-500 bg-red-50"
                  : ""
              }`}
              onClick={() => {
                if (isSelectionMode) {
                  toggleSelection(recipe.id)
                } else {
                  router.push(`/recipes/${recipe.id}`)
                }
              }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  {isSelectionMode && (
                    <div className="flex-shrink-0">
                      {selectedIds.has(recipe.id) ? (
                        <CheckSquare className="w-5 h-5 text-red-500" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  )}
                  <CardTitle className="text-lg line-clamp-2 flex-1">
                    {recipe.title}
                  </CardTitle>
                  {!isSelectionMode && recipe.isFavorite && (
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
