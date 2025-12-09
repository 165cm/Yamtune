"use client"

import { useState } from "react"
import { toast } from "@/stores/toast-store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Flame, Beef, Wheat, ChevronDown, ChevronUp, Pencil } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ProductCardProps {
  product: any
  onDelete?: (id: string) => void
  onUpdate?: (product: any) => void
}

export default function ProductCard({ product, onDelete, onUpdate }: ProductCardProps) {
  const [showAllNutrition, setShowAllNutrition] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [editName, setEditName] = useState(product.name)
  const [editCategory, setEditCategory] = useState(product.category || "")
  const [currentProduct, setCurrentProduct] = useState(product)

  const nutrition = currentProduct.nutrition || currentProduct.nutrition_per_100g || {}

  // 基本3種類以外の栄養素を取得
  const otherNutrition = Object.entries(nutrition).filter(
    ([key]) => !["energy_kcal", "protein_g", "carbohydrate_g"].includes(key)
  )

  const formatNutritionLabel = (key: string) => {
    const labels: Record<string, string> = {
      fat_g: "脂質",
      salt_g: "食塩",
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

  const handleDelete = async () => {
    if (!onDelete) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/products/${currentProduct.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        onDelete(currentProduct.id)
        setShowDeleteDialog(false)
        toast.success("商品を削除しました")
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

  const handleUpdate = async () => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/products/${currentProduct.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          category: editCategory || null,
        }),
      })

      if (response.ok) {
        const updatedProduct = await response.json()
        setCurrentProduct(updatedProduct)
        if (onUpdate) {
          onUpdate(updatedProduct)
        }
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

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="text-lg line-clamp-2">{currentProduct.name}</CardTitle>
              {currentProduct.category && (
                <p className="text-xs text-muted-foreground mt-1">{currentProduct.category}</p>
              )}
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setEditName(currentProduct.name)
                  setEditCategory(currentProduct.category || "")
                  setShowEditDialog(true)
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <Pencil className="w-4 h-4" />
              </Button>
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive hover:text-destructive/90"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentProduct.image_url && (
            <div className="relative aspect-square w-full rounded-md overflow-hidden">
              <img
                src={currentProduct.image_url}
                alt={currentProduct.name}
                className="w-full h-full object-cover"
              />
              {/* 栄養情報オーバーレイ */}
              {(nutrition.energy_kcal !== undefined || nutrition.protein_g !== undefined || nutrition.carbohydrate_g !== undefined) && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <div className="flex gap-4 text-white">
                    {nutrition.energy_kcal !== undefined && (
                      <div className="flex items-center gap-1">
                        <Flame className="w-4 h-4" />
                        <span className="text-sm font-bold">{nutrition.energy_kcal}</span>
                        <span className="text-xs opacity-80">kcal</span>
                      </div>
                    )}
                    {nutrition.protein_g !== undefined && (
                      <div className="flex items-center gap-1">
                        <Beef className="w-4 h-4" />
                        <span className="text-sm font-bold">{nutrition.protein_g}</span>
                        <span className="text-xs opacity-80">g</span>
                      </div>
                    )}
                    {nutrition.carbohydrate_g !== undefined && (
                      <div className="flex items-center gap-1">
                        <Wheat className="w-4 h-4" />
                        <span className="text-sm font-bold">{nutrition.carbohydrate_g}</span>
                        <span className="text-xs opacity-80">g</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* その他の栄養素 */}
          {otherNutrition.length > 0 && (
            <div className="space-y-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllNutrition(!showAllNutrition)}
                className="w-full text-xs"
              >
                {showAllNutrition ? (
                  <>
                    <ChevronUp className="w-3 h-3 mr-1" />
                    その他の栄養素を隠す
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3 mr-1" />
                    その他の栄養素 ({otherNutrition.length}個) を表示
                  </>
                )}
              </Button>

              {showAllNutrition && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {otherNutrition.map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center p-2 bg-muted rounded">
                      <span className="text-muted-foreground">{formatNutritionLabel(key)}</span>
                      <span className="font-medium">
                        {String(value)} {formatNutritionUnit(key)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {Object.keys(nutrition).length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-2">
              栄養情報なし
            </p>
          )}
        </CardContent>
      </Card>

      {/* 削除確認ダイアログ */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>商品を削除</DialogTitle>
            <DialogDescription>
              「{currentProduct.name}」を削除してもよろしいですか？
              この操作は取り消せません。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
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

      {/* 編集ダイアログ */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>商品を編集</DialogTitle>
            <DialogDescription>
              商品の名前やカテゴリを変更できます
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">商品名</label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="商品名を入力"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">カテゴリ（任意）</label>
              <Input
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                placeholder="例: 飲料、お菓子、調味料"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
            >
              キャンセル
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={isUpdating || !editName.trim()}
            >
              {isUpdating ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
