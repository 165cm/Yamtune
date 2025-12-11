"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Clock, Users, ChefHat, X } from "lucide-react"
import { cn } from "@/lib/utils"

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
  mealType: string
  isCompleted: boolean
  memo?: string
  recipe?: Recipe
}

interface MealPlannerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  recipes: Recipe[]
  existingPlan?: MealPlan
  onSave: (recipeId: string | null, memo?: string) => void
  mealType?: "breakfast" | "lunch" | "dinner" | "snack"
  date?: string
}

const MEAL_TYPE_LABELS: Record<string, { label: string; emoji: string }> = {
  breakfast: { label: "朝食", emoji: "🍳" },
  lunch: { label: "昼食", emoji: "🍱" },
  dinner: { label: "夕食", emoji: "🍽️" },
  snack: { label: "おやつ", emoji: "🍪" },
}

export default function MealPlannerDialog({
  open,
  onOpenChange,
  recipes,
  existingPlan,
  onSave,
  mealType,
  date,
}: MealPlannerDialogProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null)
  const [memo, setMemo] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ダイアログが開いたときに初期値を設定
  useEffect(() => {
    if (open) {
      setSelectedRecipeId(existingPlan?.recipe?.id || null)
      setMemo(existingPlan?.memo || "")
      setSearchQuery("")
    }
  }, [open, existingPlan])

  // レシピをフィルタ
  const filteredRecipes = recipes.filter((recipe) =>
    recipe.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // 日付表示
  const formatDateDisplay = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}月${date.getDate()}日`
  }

  // 保存
  const handleSave = async () => {
    setIsSubmitting(true)
    try {
      await onSave(selectedRecipeId, memo || undefined)
    } finally {
      setIsSubmitting(false)
    }
  }

  // 献立を解除
  const handleClear = async () => {
    setIsSubmitting(true)
    try {
      await onSave(null, undefined)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mealType && (
              <>
                <span>{MEAL_TYPE_LABELS[mealType]?.emoji}</span>
                <span>{MEAL_TYPE_LABELS[mealType]?.label}</span>
              </>
            )}
            {date && (
              <span className="text-muted-foreground font-normal">
                - {formatDateDisplay(date)}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* 検索 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="レシピを検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* 選択中のレシピ表示 */}
          {selectedRecipeId && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ChefHat className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">
                    {recipes.find((r) => r.id === selectedRecipeId)?.title}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedRecipeId(null)}
                  className="h-6 w-6 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* レシピ一覧 */}
          <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
            {filteredRecipes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {recipes.length === 0 ? (
                  <p>まだレシピがありません</p>
                ) : (
                  <p>該当するレシピがありません</p>
                )}
              </div>
            ) : (
              filteredRecipes.map((recipe) => (
                <Card
                  key={recipe.id}
                  className={cn(
                    "cursor-pointer transition-colors",
                    selectedRecipeId === recipe.id
                      ? "border-green-500 bg-green-50"
                      : "hover:border-green-300"
                  )}
                  onClick={() => setSelectedRecipeId(recipe.id)}
                >
                  <CardContent className="p-3">
                    <div className="font-medium text-sm mb-1">{recipe.title}</div>
                    {recipe.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                        {recipe.description}
                      </p>
                    )}
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      {recipe.cooking_time && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {recipe.cooking_time}分
                        </span>
                      )}
                      {recipe.servings && (
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {recipe.servings}人分
                        </span>
                      )}
                      {recipe.difficulty && (
                        <span>{recipe.difficulty}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* メモ入力 */}
          <div>
            <Input
              placeholder="メモ（例: 子ども用に薄味で）"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            />
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex gap-2 pt-4 border-t">
          {existingPlan?.recipe && (
            <Button
              variant="outline"
              onClick={handleClear}
              disabled={isSubmitting}
              className="text-red-600 hover:text-red-700"
            >
              献立を解除
            </Button>
          )}
          <div className="flex-1" />
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            キャンセル
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSubmitting || !selectedRecipeId}
          >
            {isSubmitting ? "保存中..." : "保存"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
