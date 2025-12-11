"use client"

import { Check, X, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface Recipe {
  id: string
  title: string
  description?: string
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

interface MealSlotProps {
  mealPlan?: MealPlan
  isToday: boolean
  isLoading: boolean
  onClick: () => void
  onToggleComplete?: () => void
  onDelete?: () => void
}

export default function MealSlot({
  mealPlan,
  isToday,
  isLoading,
  onClick,
  onToggleComplete,
  onDelete,
}: MealSlotProps) {
  if (isLoading) {
    return (
      <div className="h-16 rounded-lg bg-gray-100 animate-pulse" />
    )
  }

  // 献立がない場合
  if (!mealPlan || !mealPlan.recipe) {
    return (
      <button
        onClick={onClick}
        className={cn(
          "h-16 rounded-lg border-2 border-dashed border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors flex items-center justify-center",
          isToday && "border-green-300 bg-green-50/50"
        )}
      >
        <span className="text-xs text-gray-400">+</span>
      </button>
    )
  }

  // 献立がある場合
  return (
    <div
      className={cn(
        "h-16 rounded-lg border relative group cursor-pointer transition-colors overflow-hidden",
        mealPlan.isCompleted
          ? "bg-green-50 border-green-200"
          : isToday
          ? "bg-amber-50 border-amber-200"
          : "bg-white border-gray-200 hover:border-green-300"
      )}
    >
      {/* メインコンテンツ */}
      <button
        onClick={onClick}
        className="w-full h-full p-1 text-left"
      >
        <div className="text-xs font-medium line-clamp-2 leading-tight">
          {mealPlan.recipe.title}
        </div>
        {mealPlan.isCompleted && (
          <div className="absolute bottom-1 right-1">
            <Check className="w-3 h-3 text-green-600" />
          </div>
        )}
      </button>

      {/* アクションメニュー（ホバー時表示） */}
      <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 bg-white/80 hover:bg-white"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                onToggleComplete?.()
              }}
            >
              {mealPlan.isCompleted ? (
                <>
                  <X className="w-4 h-4 mr-2" />
                  未完了に戻す
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  完了にする
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                onDelete?.()
              }}
              className="text-red-600"
            >
              <X className="w-4 h-4 mr-2" />
              削除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
