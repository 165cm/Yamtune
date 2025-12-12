"use client"

import { Check, X, MoreHorizontal, CheckCircle2 } from "lucide-react"
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

  // 完了ボタンをタップ
  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleComplete?.()
  }

  // 献立がある場合
  return (
    <div
      className={cn(
        "h-16 rounded-lg border relative group transition-all overflow-hidden",
        mealPlan.isCompleted
          ? "bg-green-50 border-green-300 shadow-sm"
          : isToday
          ? "bg-amber-50 border-amber-300"
          : "bg-white border-gray-200"
      )}
    >
      {/* メインコンテンツ */}
      <button
        onClick={onClick}
        className="w-full h-full p-1 text-left pr-7"
      >
        <div className="text-xs font-medium line-clamp-2 leading-tight">
          {mealPlan.recipe.title}
        </div>
      </button>

      {/* 完了チェックボタン（常に表示） */}
      <button
        onClick={handleComplete}
        className={cn(
          "absolute bottom-1 right-1 w-5 h-5 rounded-full flex items-center justify-center transition-all",
          mealPlan.isCompleted
            ? "bg-green-500 text-white"
            : "bg-gray-200 text-gray-400 hover:bg-green-400 hover:text-white"
        )}
        title={mealPlan.isCompleted ? "完了を取り消す" : "完了にする"}
      >
        <Check className="w-3 h-3" />
      </button>

      {/* 削除メニュー（ホバー時） */}
      <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 bg-white/80 hover:bg-white"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-28">
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
