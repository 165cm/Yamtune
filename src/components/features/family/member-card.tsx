"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "@/stores/toast-store"
import { Member, MemberFood, FoodStatus } from "@/types"
import { foodPresets, getFoodEmoji } from "@/lib/food-presets"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Trash2, Calendar, Plus, X, Heart, ThumbsDown } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface MemberCardProps {
  member: Member
  onDelete: (memberId: string) => void
}

const statusConfig: Record<FoodStatus, { label: string; color: string; emoji: string }> = {
  like: { label: "好き", color: "bg-green-100 text-green-800 border-green-200", emoji: "💚" },
  dislike: { label: "苦手", color: "bg-red-100 text-red-800 border-red-200", emoji: "💔" },
  neutral: { label: "普通", color: "bg-gray-100 text-gray-800 border-gray-200", emoji: "😐" },
}

export default function MemberCard({ member, onDelete }: MemberCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [foods, setFoods] = useState<MemberFood[]>([])
  const [isLoadingFoods, setIsLoadingFoods] = useState(true)
  const [showAddFoodDialog, setShowAddFoodDialog] = useState(false)
  const [newFoodName, setNewFoodName] = useState("")
  const [newFoodStatus, setNewFoodStatus] = useState<FoodStatus>("dislike")
  const [isAddingFood, setIsAddingFood] = useState(false)

  const loadFoods = useCallback(async () => {
    try {
      const response = await fetch(`/api/members/${member.id}/foods`)
      if (response.ok) {
        const data = await response.json()
        setFoods(data)
      }
    } catch (error) {
      console.error("Failed to load foods:", error)
    } finally {
      setIsLoadingFoods(false)
    }
  }, [member.id])

  useEffect(() => {
    loadFoods()
  }, [loadFoods])

  const calculateAge = (birthDate: string) => {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/members/${member.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        onDelete(member.id)
        setShowDeleteDialog(false)
        toast.success("メンバーを削除しました")
      } else {
        toast.error("メンバーの削除に失敗しました")
      }
    } catch (error) {
      console.error("Failed to delete member:", error)
      toast.error("メンバーの削除に失敗しました")
    } finally {
      setIsDeleting(false)
    }
  }

  const addFood = async (foodName: string, status: FoodStatus) => {
    // 既に登録済みかチェック
    if (foods.some(f => f.food_name === foodName)) {
      toast.error("既に登録されています")
      return
    }

    setIsAddingFood(true)
    try {
      const response = await fetch(`/api/members/${member.id}/foods`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          food_name: foodName,
          status: status,
        }),
      })

      if (response.ok) {
        const newFood = await response.json()
        setFoods([...foods, newFood])
        toast.success(`${getFoodEmoji(foodName)} ${foodName}を追加しました`)
      } else {
        toast.error("登録に失敗しました")
      }
    } catch (error) {
      console.error("Failed to add food:", error)
      toast.error("登録に失敗しました")
    } finally {
      setIsAddingFood(false)
    }
  }

  const handleAddFood = async () => {
    if (!newFoodName.trim()) return
    await addFood(newFoodName.trim(), newFoodStatus)
    setNewFoodName("")
    setShowAddFoodDialog(false)
  }

  const handlePresetClick = async (foodName: string, status: FoodStatus) => {
    await addFood(foodName, status)
  }

  const handleDeleteFood = async (foodId: string) => {
    try {
      const response = await fetch(`/api/members/${member.id}/foods/${foodId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setFoods(foods.filter((f) => f.id !== foodId))
        toast.success("削除しました")
      } else {
        toast.error("削除に失敗しました")
      }
    } catch (error) {
      console.error("Failed to delete food:", error)
      toast.error("削除に失敗しました")
    }
  }

  const dislikedFoods = foods.filter((f) => f.status === "dislike")
  const likedFoods = foods.filter((f) => f.status === "like")

  // 登録済みの食べ物を除外したプリセット
  const availableDislikePresets = foodPresets.dislike.filter(
    p => !foods.some(f => f.food_name === p.name)
  )
  const availableLikePresets = foodPresets.like.filter(
    p => !foods.some(f => f.food_name === p.name)
  )

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle className="text-xl">{member.name}</CardTitle>
            <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>{calculateAge(member.birth_date)}歳</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 苦手な食べ物 */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-red-700">💔 苦手な食べ物</p>
            <div className="flex flex-wrap gap-2">
              {isLoadingFoods ? (
                <span className="text-xs text-muted-foreground">読み込み中...</span>
              ) : dislikedFoods.length === 0 ? (
                <span className="text-xs text-muted-foreground">登録なし</span>
              ) : (
                dislikedFoods.map((food) => (
                  <Badge
                    key={food.id}
                    variant="outline"
                    className={`text-xs ${statusConfig.dislike.color} group cursor-pointer`}
                    onClick={() => handleDeleteFood(food.id)}
                  >
                    {getFoodEmoji(food.food_name)} {food.food_name}
                    <X className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100" />
                  </Badge>
                ))
              )}
            </div>
          </div>

          {/* 好きな食べ物 */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-green-700">💚 好きな食べ物</p>
            <div className="flex flex-wrap gap-2">
              {isLoadingFoods ? (
                <span className="text-xs text-muted-foreground">読み込み中...</span>
              ) : likedFoods.length === 0 ? (
                <span className="text-xs text-muted-foreground">登録なし</span>
              ) : (
                likedFoods.map((food) => (
                  <Badge
                    key={food.id}
                    variant="outline"
                    className={`text-xs ${statusConfig.like.color} group cursor-pointer`}
                    onClick={() => handleDeleteFood(food.id)}
                  >
                    {getFoodEmoji(food.food_name)} {food.food_name}
                    <X className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100" />
                  </Badge>
                ))
              )}
            </div>
          </div>

          {/* 食べ物追加ボタン */}
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setShowAddFoodDialog(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            好き嫌いを追加
          </Button>
        </CardContent>
      </Card>

      {/* メンバー削除ダイアログ */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>メンバーを削除</DialogTitle>
            <DialogDescription>
              {member.name}さんを削除してもよろしいですか？
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

      {/* 食べ物追加ダイアログ */}
      <Dialog open={showAddFoodDialog} onOpenChange={setShowAddFoodDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>好き嫌いを追加</DialogTitle>
            <DialogDescription>
              {member.name}さんの好きな食べ物・苦手な食べ物を登録します
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* 苦手な食べ物プリセット */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <ThumbsDown className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium">苦手な食べ物</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableDislikePresets.slice(0, 10).map((preset) => (
                  <Button
                    key={preset.name}
                    variant="outline"
                    size="sm"
                    className="text-xs h-8 hover:bg-red-50 hover:border-red-300"
                    onClick={() => handlePresetClick(preset.name, "dislike")}
                    disabled={isAddingFood}
                  >
                    {preset.emoji} {preset.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* 好きな食べ物プリセット */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium">好きな食べ物</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableLikePresets.slice(0, 10).map((preset) => (
                  <Button
                    key={preset.name}
                    variant="outline"
                    size="sm"
                    className="text-xs h-8 hover:bg-green-50 hover:border-green-300"
                    onClick={() => handlePresetClick(preset.name, "like")}
                    disabled={isAddingFood}
                  >
                    {preset.emoji} {preset.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* カスタム入力 */}
            <div className="space-y-3 pt-4 border-t">
              <p className="text-sm font-medium">その他（手入力）</p>
              <div className="flex gap-2">
                <Input
                  placeholder="食べ物の名前"
                  value={newFoodName}
                  onChange={(e) => setNewFoodName(e.target.value)}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setNewFoodStatus("dislike")
                    handleAddFood()
                  }}
                  disabled={isAddingFood || !newFoodName.trim()}
                  className="text-red-600 hover:bg-red-50"
                >
                  💔 苦手
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setNewFoodStatus("like")
                    handleAddFood()
                  }}
                  disabled={isAddingFood || !newFoodName.trim()}
                  className="text-green-600 hover:bg-green-50"
                >
                  💚 好き
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddFoodDialog(false)}
            >
              閉じる
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
