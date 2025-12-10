"use client"

import { useState } from "react"
import { Member, FoodStatus } from "@/types"
import { foodPresets } from "@/lib/food-presets"
import { toast } from "@/stores/toast-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Heart, ThumbsDown, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface AddMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  familyId: string
  onMemberAdded: (member: Member) => void
}

interface SelectedFood {
  name: string
  emoji: string
  status: FoodStatus
}

export default function AddMemberDialog({
  open,
  onOpenChange,
  familyId,
  onMemberAdded,
}: AddMemberDialogProps) {
  const [name, setName] = useState("")
  const [birthDate, setBirthDate] = useState("")
  const [selectedFoods, setSelectedFoods] = useState<SelectedFood[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleFoodToggle = (food: { name: string; emoji: string }, status: FoodStatus) => {
    const existing = selectedFoods.find(f => f.name === food.name)
    if (existing) {
      // 同じステータスならトグルオフ、違うステータスなら変更
      if (existing.status === status) {
        setSelectedFoods(selectedFoods.filter(f => f.name !== food.name))
      } else {
        setSelectedFoods(selectedFoods.map(f =>
          f.name === food.name ? { ...f, status } : f
        ))
      }
    } else {
      setSelectedFoods([...selectedFoods, { ...food, status }])
    }
  }

  const removeFood = (foodName: string) => {
    setSelectedFoods(selectedFoods.filter(f => f.name !== foodName))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setError("名前を入力してください")
      return
    }

    if (!birthDate) {
      setError("生年月日を入力してください")
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      // 1. メンバーを作成
      const response = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          family_id: familyId,
          name,
          birth_date: birthDate,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create member")
      }

      const newMember = await response.json()

      // 2. 選択された食べ物を登録
      if (selectedFoods.length > 0) {
        const foodPromises = selectedFoods.map(food =>
          fetch(`/api/members/${newMember.id}/foods`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              food_name: food.name,
              status: food.status,
            }),
          })
        )
        await Promise.all(foodPromises)
      }

      onMemberAdded(newMember)
      toast.success(`${name}さんを追加しました`)

      // Reset form
      setName("")
      setBirthDate("")
      setSelectedFoods([])
    } catch (err) {
      setError("メンバーの追加に失敗しました")
    } finally {
      setIsSubmitting(false)
    }
  }

  const dislikedFoods = selectedFoods.filter(f => f.status === "dislike")
  const likedFoods = selectedFoods.filter(f => f.status === "like")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>メンバーを追加</DialogTitle>
            <DialogDescription>
              新しい家族メンバーの情報を入力してください
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* 基本情報 */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">名前</Label>
                <Input
                  id="name"
                  placeholder="例: ゆうと"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    setError("")
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthDate">生年月日</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={birthDate}
                  onChange={(e) => {
                    setBirthDate(e.target.value)
                    setError("")
                  }}
                />
              </div>
            </div>

            {/* 好き嫌いプリセット */}
            <div className="space-y-4 pt-4 border-t">
              <div>
                <Label className="text-base">好き嫌い（任意）</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  クリックで選択できます（後から変更可能）
                </p>
              </div>

              {/* 選択済みの食べ物 */}
              {selectedFoods.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">選択中:</p>
                  <div className="flex flex-wrap gap-2">
                    {dislikedFoods.map(food => (
                      <Badge
                        key={food.name}
                        variant="outline"
                        className="bg-red-50 text-red-700 border-red-200 cursor-pointer"
                        onClick={() => removeFood(food.name)}
                      >
                        {food.emoji} {food.name} 💔
                        <X className="w-3 h-3 ml-1" />
                      </Badge>
                    ))}
                    {likedFoods.map(food => (
                      <Badge
                        key={food.name}
                        variant="outline"
                        className="bg-green-50 text-green-700 border-green-200 cursor-pointer"
                        onClick={() => removeFood(food.name)}
                      >
                        {food.emoji} {food.name} 💚
                        <X className="w-3 h-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* 苦手な食べ物プリセット */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <ThumbsDown className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium">苦手な食べ物</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {foodPresets.dislike.slice(0, 8).map((food) => {
                    const isSelected = selectedFoods.some(f => f.name === food.name && f.status === "dislike")
                    return (
                      <Button
                        key={food.name}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        className={`text-xs h-8 ${isSelected ? "bg-red-500 hover:bg-red-600" : "hover:bg-red-50 hover:border-red-300"}`}
                        onClick={() => handleFoodToggle(food, "dislike")}
                      >
                        {food.emoji} {food.name}
                      </Button>
                    )
                  })}
                </div>
              </div>

              {/* 好きな食べ物プリセット */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">好きな食べ物</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {foodPresets.like.slice(0, 8).map((food) => {
                    const isSelected = selectedFoods.some(f => f.name === food.name && f.status === "like")
                    return (
                      <Button
                        key={food.name}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        className={`text-xs h-8 ${isSelected ? "bg-green-500 hover:bg-green-600" : "hover:bg-green-50 hover:border-green-300"}`}
                        onClick={() => handleFoodToggle(food, "like")}
                      >
                        {food.emoji} {food.name}
                      </Button>
                    )
                  })}
                </div>
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "追加中..." : "追加"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
