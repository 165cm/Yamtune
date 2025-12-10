"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { toast } from "@/stores/toast-store"
import { getCategoryEmoji, getFoodEmoji } from "@/lib/food-presets"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Star,
  StarOff,
  Heart,
  ThumbsDown,
  Flame,
  Beef,
  Wheat,
  ChefHat,
  Clock,
  Users,
} from "lucide-react"
import { FullPageLoader } from "@/components/ui/skeleton"

interface FamilyPreference {
  memberName: string
  foodName: string
  status: "like" | "dislike"
}

interface RelatedRecipe {
  id: string
  title: string
  description: string
  servings: number
  cooking_time: number
  difficulty: string
  image_url?: string
}

export default function ProductDetailPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const [product, setProduct] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isUpdatingFavorite, setIsUpdatingFavorite] = useState(false)
  const [familyPreferences, setFamilyPreferences] = useState<FamilyPreference[]>([])
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editForm, setEditForm] = useState({
    name: "",
    category: "",
    food_name: "",
  })
  const [relatedRecipes, setRelatedRecipes] = useState<RelatedRecipe[]>([])

  const loadProduct = useCallback(async () => {
    if (!id) return
    try {
      const response = await fetch(`/api/products/${id}`)
      if (response.ok) {
        const data = await response.json()
        setProduct(data)
        setEditForm({
          name: data.name || "",
          category: data.category || "",
          food_name: data.food_name || "",
        })
        setIsFavorite(data.is_favorite || false)
      } else {
        toast.error("商品が見つかりません")
        router.push("/home")
      }
    } catch (error) {
      console.error("Failed to load product:", error)
      toast.error("商品の読み込みに失敗しました")
    } finally {
      setIsLoading(false)
    }
  }, [id, router])

  const loadFamilyPreferences = useCallback(async () => {
    try {
      const familyRes = await fetch("/api/families")
      if (!familyRes.ok) return
      const families = await familyRes.json()
      if (families.length === 0) return

      const membersRes = await fetch(`/api/members?family_id=${families[0].id}`)
      if (!membersRes.ok) return
      const members = await membersRes.json()

      const allPreferences: FamilyPreference[] = []
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
      console.error("Failed to load family preferences:", error)
    }
  }, [])

  const loadRelatedRecipes = useCallback(async () => {
    if (!id) return
    try {
      const response = await fetch(`/api/products/${id}/recipes`)
      if (response.ok) {
        const data = await response.json()
        setRelatedRecipes(data.recipes || [])
      }
    } catch (error) {
      console.error("Failed to load related recipes:", error)
    }
  }, [id])

  useEffect(() => {
    loadProduct()
    loadFamilyPreferences()
    loadRelatedRecipes()
  }, [loadProduct, loadFamilyPreferences, loadRelatedRecipes])

  const handleUpdate = async () => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      })

      if (response.ok) {
        const updatedProduct = await response.json()
        setProduct(updatedProduct)
        setShowEditDialog(false)
        toast.success("商品を更新しました")
      } else {
        toast.error("商品の更新に失敗しました")
      }
    } catch (error) {
      console.error("Failed to update product:", error)
      toast.error("商品の更新に失敗しました")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("商品を削除しました")
        router.push("/home")
      } else {
        toast.error("商品の削除に失敗しました")
      }
    } catch (error) {
      console.error("Failed to delete product:", error)
      toast.error("商品の削除に失敗しました")
    } finally {
      setIsDeleting(false)
    }
  }

  const toggleFavorite = async () => {
    setIsUpdatingFavorite(true)
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_favorite: !isFavorite }),
      })

      if (response.ok) {
        setIsFavorite(!isFavorite)
        toast.success(isFavorite ? "お気に入りを解除しました" : "お気に入りに追加しました")
      } else {
        toast.error("更新に失敗しました")
      }
    } catch (error) {
      console.error("Failed to toggle favorite:", error)
      toast.error("更新に失敗しました")
    } finally {
      setIsUpdatingFavorite(false)
    }
  }

  if (isLoading) {
    return <FullPageLoader />
  }

  if (!product) {
    return null
  }

  const nutrition = product.nutrition || product.nutrition_per_100g || {}

  // 商品名に含まれる家族の好き嫌いをチェック
  const matchedPreferences = familyPreferences.filter(
    (pref) =>
      product.name.includes(pref.foodName) ||
      pref.foodName.includes(product.name.replace(/[（(].*[)）]/, "").trim()) ||
      (product.food_name && (
        product.food_name.includes(pref.foodName) ||
        pref.foodName.includes(product.food_name)
      ))
  )

  const formatNutritionLabel = (key: string) => {
    const labels: Record<string, string> = {
      energy_kcal: "エネルギー",
      protein_g: "たんぱく質",
      fat_g: "脂質",
      carbohydrate_g: "炭水化物",
      salt_g: "食塩相当量",
      sugar_g: "糖質",
      dietary_fiber_g: "食物繊維",
      sugars_g: "糖類",
      saturated_fat_g: "飽和脂肪酸",
      trans_fat_g: "トランス脂肪酸",
      cholesterol_mg: "コレステロール",
      sodium_mg: "ナトリウム",
      vitamin_a_ug: "ビタミンA",
      vitamin_b1_mg: "ビタミンB1",
      vitamin_b2_mg: "ビタミンB2",
      vitamin_b6_mg: "ビタミンB6",
      vitamin_b12_ug: "ビタミンB12",
      vitamin_c_mg: "ビタミンC",
      vitamin_d_ug: "ビタミンD",
      vitamin_e_mg: "ビタミンE",
      vitamin_k_ug: "ビタミンK",
      folate_ug: "葉酸",
      niacin_mg: "ナイアシン",
      pantothenic_acid_mg: "パントテン酸",
      biotin_ug: "ビオチン",
      calcium_mg: "カルシウム",
      iron_mg: "鉄",
      magnesium_mg: "マグネシウム",
      phosphorus_mg: "リン",
      potassium_mg: "カリウム",
      zinc_mg: "亜鉛",
      copper_mg: "銅",
      manganese_mg: "マンガン",
      iodine_ug: "ヨウ素",
      selenium_ug: "セレン",
      chromium_ug: "クロム",
      molybdenum_ug: "モリブデン",
    }
    return labels[key] || key
  }

  const formatNutritionUnit = (key: string) => {
    if (key.endsWith("_mg")) return "mg"
    if (key.endsWith("_ug")) return "μg"
    if (key.endsWith("_g")) return "g"
    if (key.endsWith("_kcal")) return "kcal"
    return ""
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6 py-8">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFavorite}
              disabled={isUpdatingFavorite}
            >
              {isFavorite ? (
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              ) : (
                <StarOff className="w-5 h-5 text-muted-foreground" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowEditDialog(true)}
            >
              <Pencil className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowDeleteDialog(true)}
              className="text-destructive"
            >
              <Trash2 className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* 商品画像 */}
        {product.image_url && (
          <div className="relative aspect-video w-full rounded-xl overflow-hidden shadow-lg">
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-contain bg-white"
            />
          </div>
        )}

        {/* 商品情報 */}
        <Card>
          <CardHeader>
            <div className="space-y-2">
              {/* カテゴリ > 食材名 > 商品名 の階層表示 */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {product.category && (
                  <>
                    <span>{getCategoryEmoji(product.category)} {product.category}</span>
                    {product.food_name && <span>/</span>}
                  </>
                )}
                {product.food_name && (
                  <span>{getFoodEmoji(product.food_name)} {product.food_name}</span>
                )}
              </div>
              <CardTitle className="text-2xl">{product.name}</CardTitle>
            </div>

            {/* 家族の好き嫌いマッチング */}
            {matchedPreferences.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {matchedPreferences.map((pref, idx) => (
                  <Badge
                    key={`${pref.memberName}-${pref.foodName}-${idx}`}
                    variant="outline"
                    className={`${
                      pref.status === "like"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-red-50 text-red-700 border-red-200"
                    }`}
                  >
                    {pref.status === "like" ? (
                      <Heart className="w-3 h-3 mr-1" />
                    ) : (
                      <ThumbsDown className="w-3 h-3 mr-1" />
                    )}
                    {pref.memberName}さん
                    {pref.status === "like" ? "が好き" : "が苦手"}
                  </Badge>
                ))}
              </div>
            )}
          </CardHeader>
        </Card>

        {/* 栄養成分 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">栄養成分（100gあたり）</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(nutrition).length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                栄養情報がありません
              </p>
            ) : (
              <div className="space-y-4">
                {/* 主要栄養素 */}
                <div className="grid grid-cols-3 gap-4">
                  {nutrition.energy_kcal !== undefined && (
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <Flame className="w-6 h-6 mx-auto text-orange-500 mb-2" />
                      <p className="text-2xl font-bold">{nutrition.energy_kcal}</p>
                      <p className="text-xs text-muted-foreground">kcal</p>
                    </div>
                  )}
                  {nutrition.protein_g !== undefined && (
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <Beef className="w-6 h-6 mx-auto text-red-500 mb-2" />
                      <p className="text-2xl font-bold">{nutrition.protein_g}</p>
                      <p className="text-xs text-muted-foreground">たんぱく質 g</p>
                    </div>
                  )}
                  {nutrition.carbohydrate_g !== undefined && (
                    <div className="text-center p-4 bg-amber-50 rounded-lg">
                      <Wheat className="w-6 h-6 mx-auto text-amber-500 mb-2" />
                      <p className="text-2xl font-bold">{nutrition.carbohydrate_g}</p>
                      <p className="text-xs text-muted-foreground">炭水化物 g</p>
                    </div>
                  )}
                </div>

                {/* その他の栄養素 */}
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(nutrition)
                    .filter(
                      ([key]) =>
                        !["energy_kcal", "protein_g", "carbohydrate_g"].includes(key)
                    )
                    .map(([key, value]) => (
                      <div
                        key={key}
                        className="flex justify-between items-center p-3 bg-muted rounded-lg"
                      >
                        <span className="text-sm text-muted-foreground">
                          {formatNutritionLabel(key)}
                        </span>
                        <span className="font-medium">
                          {String(value)} {formatNutritionUnit(key)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* この商品を使ったレシピ */}
        {relatedRecipes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ChefHat className="w-5 h-5" />
                この商品を使ったレシピ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {relatedRecipes.map((recipe) => (
                  <div
                    key={recipe.id}
                    className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => router.push(`/recipes/${recipe.id}`)}
                  >
                    {recipe.image_url && (
                      <img
                        src={recipe.image_url}
                        alt={recipe.title}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{recipe.title}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {recipe.description}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        {recipe.cooking_time && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {recipe.cooking_time}分
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {recipe.servings}人分
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {recipe.difficulty}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 編集ダイアログ */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>商品を編集</DialogTitle>
            <DialogDescription>
              商品情報を変更できます
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>商品名</Label>
              <Input
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
                placeholder="商品名を入力"
              />
            </div>
            <div className="space-y-2">
              <Label>カテゴリ</Label>
              <Input
                value={editForm.category}
                onChange={(e) =>
                  setEditForm({ ...editForm, category: e.target.value })
                }
                placeholder="例: 野菜、肉、飲料"
              />
            </div>
            <div className="space-y-2">
              <Label>食材名（任意）</Label>
              <Input
                value={editForm.food_name}
                onChange={(e) =>
                  setEditForm({ ...editForm, food_name: e.target.value })
                }
                placeholder="例: にんじん、鶏肉"
              />
              <p className="text-xs text-muted-foreground">
                食材名を設定すると、家族の好き嫌いと連動します
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              キャンセル
            </Button>
            <Button onClick={handleUpdate} disabled={isUpdating || !editForm.name.trim()}>
              {isUpdating ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>商品を削除</DialogTitle>
            <DialogDescription>
              「{product.name}」を削除してもよろしいですか？
              この操作は取り消せません。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "削除中..." : "削除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
