"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { toast } from "@/stores/toast-store"
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
  Camera,
  Loader2,
  ShoppingBag,
  Package,
  Home,
} from "lucide-react"

interface Recipe {
  id: string
  title: string
  description: string
  servings: number
  cooking_time: number
  difficulty: string
  image_url?: string
  nutrition: {
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
    notes?: string
  }>
  steps: Array<{
    step_number: number
    description: string
  }>
  isFavorite: boolean
}

interface MatchedProduct {
  ingredientName: string
  product: {
    id: string
    name: string
    image_url?: string
  }
}

export default function RecipeDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [matchedProducts, setMatchedProducts] = useState<MatchedProduct[]>([])
  const [matchedPantryItems, setMatchedPantryItems] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  const fetchRecipe = useCallback(async () => {
    try {
      const response = await fetch(`/api/recipes/${id}`)
      if (!response.ok) throw new Error("Failed to fetch recipe")

      const data = await response.json()
      setRecipe(data.recipe)
      setIsFavorite(data.recipe.isFavorite)
      if (data.matchedProducts) {
        setMatchedProducts(data.matchedProducts)
      }
      if (data.matchedPantryItems) {
        setMatchedPantryItems(data.matchedPantryItems)
      }
    } catch (error) {
      console.error("Error fetching recipe:", error)
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchRecipe()
  }, [fetchRecipe])

  const toggleFavorite = async () => {
    setIsTogglingFavorite(true)
    try {
      const newFavoriteStatus = !isFavorite
      const response = await fetch(`/api/recipes/${id}`, {
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !recipe) return

    setIsUploadingImage(true)
    try {
      // ファイルをBase64に変換
      const reader = new FileReader()
      reader.onload = async (event) => {
        const base64 = event.target?.result as string

        const response = await fetch(`/api/recipes/${recipe.id}/image`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64 }),
        })

        if (!response.ok) throw new Error("Failed to upload image")

        const data = await response.json()
        setRecipe({ ...recipe, image_url: data.image_url })
        toast.success("画像を更新しました")
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error("Error uploading image:", error)
      toast.error("画像のアップロードに失敗しました")
    } finally {
      setIsUploadingImage(false)
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
            {recipe.cooking_time && (
              <Badge variant="outline" className="gap-1">
                <Clock className="w-3 h-3" />
                {recipe.cooking_time}分
              </Badge>
            )}
            <Badge className={difficultyColor}>{recipe.difficulty}</Badge>
          </div>
        </CardHeader>
      </Card>

      {/* レシピ画像（クリックで変更可能） */}
      <Card className="mb-6 overflow-hidden">
        <CardContent className="p-0 relative">
          <label className="cursor-pointer block">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              disabled={isUploadingImage}
            />
            {recipe.image_url ? (
              <img
                src={recipe.image_url}
                alt={recipe.title}
                className="w-full h-auto object-cover max-h-96"
              />
            ) : (
              <div className="w-full h-48 bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">タップして画像を追加</p>
                </div>
              </div>
            )}
            {/* オーバーレイ */}
            <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center group">
              {isUploadingImage ? (
                <div className="bg-white/90 rounded-full p-3">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="bg-white/90 rounded-full p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-6 h-6 text-primary" />
                </div>
              )}
            </div>
          </label>
        </CardContent>
      </Card>

      {/* 栄養情報 */}
      {recipe.nutrition && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">栄養情報（1人分）</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {recipe.nutrition.energy_kcal !== undefined && (
                <div className="flex flex-col items-center p-3 bg-orange-50 rounded-lg">
                  <Flame className="w-5 h-5 text-orange-600 mb-1" />
                  <div className="text-2xl font-bold text-orange-600">
                    {Math.round(recipe.nutrition.energy_kcal / recipe.servings)}
                  </div>
                  <div className="text-xs text-muted-foreground">kcal</div>
                </div>
              )}
              {recipe.nutrition.protein_g !== undefined && (
                <div className="flex flex-col items-center p-3 bg-red-50 rounded-lg">
                  <Beef className="w-5 h-5 text-red-600 mb-1" />
                  <div className="text-2xl font-bold text-red-600">
                    {(recipe.nutrition.protein_g / recipe.servings).toFixed(1)}
                  </div>
                  <div className="text-xs text-muted-foreground">g たんぱく質</div>
                </div>
              )}
              {recipe.nutrition.fat_g !== undefined && (
                <div className="flex flex-col items-center p-3 bg-yellow-50 rounded-lg">
                  <Droplet className="w-5 h-5 text-yellow-600 mb-1" />
                  <div className="text-2xl font-bold text-yellow-600">
                    {(recipe.nutrition.fat_g / recipe.servings).toFixed(1)}
                  </div>
                  <div className="text-xs text-muted-foreground">g 脂質</div>
                </div>
              )}
              {recipe.nutrition.carbohydrate_g !== undefined && (
                <div className="flex flex-col items-center p-3 bg-amber-50 rounded-lg">
                  <Wheat className="w-5 h-5 text-amber-600 mb-1" />
                  <div className="text-2xl font-bold text-amber-600">
                    {(recipe.nutrition.carbohydrate_g / recipe.servings).toFixed(1)}
                  </div>
                  <div className="text-xs text-muted-foreground">g 炭水化物</div>
                </div>
              )}
              {recipe.nutrition.salt_g !== undefined && (
                <div className="flex flex-col items-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {(recipe.nutrition.salt_g / recipe.servings).toFixed(1)}
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
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">材料</CardTitle>
            <div className="flex gap-2">
              {matchedPantryItems.length > 0 && (
                <Badge variant="outline" className="gap-1 bg-amber-50 text-amber-700 border-amber-200">
                  <Home className="w-3 h-3" />
                  {matchedPantryItems.length}品が家にある
                </Badge>
              )}
              {matchedProducts.length > 0 && (
                <Badge variant="outline" className="gap-1 bg-green-50 text-green-700 border-green-200">
                  <Package className="w-3 h-3" />
                  {matchedProducts.length}品の手持ち商品
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recipe.ingredients.map((ingredient, index) => {
              const matchedProduct = matchedProducts.find(
                (mp) => mp.ingredientName === ingredient.name
              )
              const isPantryItem = matchedPantryItems.includes(ingredient.name)

              // スタイルを決定
              let bgClass = ""
              if (isPantryItem) {
                bgClass = "bg-amber-50 -mx-4 px-4 rounded"
              } else if (matchedProduct) {
                bgClass = "bg-green-50 -mx-4 px-4 rounded"
              }

              return (
                <div
                  key={index}
                  className={`flex justify-between items-center py-2 border-b last:border-b-0 ${bgClass}`}
                >
                  <div className="flex items-center gap-2">
                    {isPantryItem && (
                      <Home className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    )}
                    {!isPantryItem && matchedProduct && (
                      <ShoppingBag className="w-4 h-4 text-green-600 flex-shrink-0" />
                    )}
                    <div>
                      <span className="font-medium">{ingredient.name}</span>
                      {!isPantryItem && matchedProduct && (
                        <p className="text-xs text-green-600">
                          {matchedProduct.product.name}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-muted-foreground">
                    {ingredient.amount}
                  </span>
                </div>
              )
            })}
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
                  <p className="text-sm leading-relaxed">{step.description}</p>
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
