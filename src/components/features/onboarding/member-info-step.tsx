"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useOnboardingStore } from "@/stores/onboarding-store"
import { useAuthStore } from "@/stores/auth-store"
import { useFamilyStore } from "@/stores/family-store"
import { foodPresets, getFoodEmoji } from "@/lib/food-presets"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Baby, Plus, X, Heart, ThumbsDown } from "lucide-react"

interface FoodItem {
  name: string
  status: "like" | "dislike"
}

export default function MemberInfoStep() {
  const router = useRouter()
  const { nextStep, prevStep, memberData, setMemberData, familyData, completeOnboarding } = useOnboardingStore()
  const { user } = useAuthStore()
  const { setCurrentFamily, setMembers, setSelectedMember } = useFamilyStore()

  const [name, setName] = useState(memberData.name || "")
  const [birthDate, setBirthDate] = useState(memberData.birthDate || "")
  const [foods, setFoods] = useState<FoodItem[]>(
    memberData.dislikes?.map((d: string) => ({ name: d, status: "dislike" as const })) || []
  )
  const [newFood, setNewFood] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const addFood = (foodName: string, status: "like" | "dislike") => {
    if (foodName.trim() && !foods.some(f => f.name === foodName)) {
      setFoods([...foods, { name: foodName.trim(), status }])
    }
  }

  const handleAddCustomFood = (status: "like" | "dislike") => {
    if (newFood.trim()) {
      addFood(newFood.trim(), status)
      setNewFood("")
    }
  }

  const handleRemoveFood = (foodName: string) => {
    setFoods(foods.filter((f) => f.name !== foodName))
  }

  const handleComplete = async () => {
    if (!name.trim()) {
      setError("お子様の名前を入力してください")
      return
    }

    if (!birthDate) {
      setError("生年月日を入力してください")
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      // 1. 家族を作成
      const familyResponse = await fetch("/api/families", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: familyData.name || "マイファミリー",
        }),
      })

      if (!familyResponse.ok) {
        throw new Error("家族の作成に失敗しました")
      }

      const family = await familyResponse.json()
      setCurrentFamily(family)

      // 2. メンバーを作成
      const memberResponse = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          family_id: family.id,
          name,
          birth_date: birthDate,
        }),
      })

      if (!memberResponse.ok) {
        throw new Error("メンバーの作成に失敗しました")
      }

      const member = await memberResponse.json()
      setMembers([member])
      setSelectedMember(member)

      // 3. 食べ物の好き嫌いを登録
      if (foods.length > 0) {
        await Promise.all(
          foods.map((food) =>
            fetch(`/api/members/${member.id}/foods`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                food_name: food.name,
                status: food.status,
              }),
            })
          )
        )
      }

      // メンバーデータを保存して次のステップへ
      setMemberData({
        name,
        birthDate,
        dislikes: foods.filter(f => f.status === "dislike").map(f => f.name)
      })
      nextStep()
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました")
      setIsSubmitting(false)
    }
  }

  const handleSkip = async () => {
    setIsSubmitting(true)
    setError("")

    try {
      // 家族だけ作成してスキップ
      const familyResponse = await fetch("/api/families", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: familyData.name || "マイファミリー",
        }),
      })

      if (!familyResponse.ok) {
        throw new Error("家族の作成に失敗しました")
      }

      const family = await familyResponse.json()
      setCurrentFamily(family)

      // オンボーディング完了してホームへ
      completeOnboarding()
      router.push("/home")
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました")
      setIsSubmitting(false)
    }
  }

  // 登録済みの食べ物を除外したプリセット
  const availableDislikePresets = foodPresets.dislike.filter(
    p => !foods.some(f => f.name === p.name)
  ).slice(0, 8)

  const availableLikePresets = foodPresets.like.filter(
    p => !foods.some(f => f.name === p.name)
  ).slice(0, 8)

  const dislikedFoods = foods.filter(f => f.status === "dislike")
  const likedFoods = foods.filter(f => f.status === "like")

  return (
    <Card className="border-2">
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Baby className="w-8 h-8 text-primary" />
        </div>
        <CardTitle className="text-2xl">お子様の情報</CardTitle>
        <CardDescription>
          お子様の好き嫌いを教えてください
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="childName">お子様の名前</Label>
            <Input
              id="childName"
              placeholder="例: ゆうと"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setError("")
              }}
              className="h-12"
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
              className="h-12"
            />
          </div>

          {/* 苦手な食べ物 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ThumbsDown className="w-4 h-4 text-red-600" />
              <Label>苦手な食べ物（任意）</Label>
            </div>

            {/* プリセットタグ */}
            <div className="flex flex-wrap gap-2">
              {availableDislikePresets.map((preset) => (
                <Button
                  key={preset.name}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 hover:bg-red-50 hover:border-red-300"
                  onClick={() => addFood(preset.name, "dislike")}
                >
                  {preset.emoji} {preset.name}
                </Button>
              ))}
            </div>

            {/* 登録済みの苦手な食べ物 */}
            {dislikedFoods.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {dislikedFoods.map((food) => (
                  <span
                    key={food.name}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 border border-red-200 rounded-full text-sm"
                  >
                    {getFoodEmoji(food.name)} {food.name}
                    <button
                      type="button"
                      onClick={() => handleRemoveFood(food.name)}
                      className="hover:bg-red-200 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 好きな食べ物 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-green-600" />
              <Label>好きな食べ物（任意）</Label>
            </div>

            {/* プリセットタグ */}
            <div className="flex flex-wrap gap-2">
              {availableLikePresets.map((preset) => (
                <Button
                  key={preset.name}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 hover:bg-green-50 hover:border-green-300"
                  onClick={() => addFood(preset.name, "like")}
                >
                  {preset.emoji} {preset.name}
                </Button>
              ))}
            </div>

            {/* 登録済みの好きな食べ物 */}
            {likedFoods.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {likedFoods.map((food) => (
                  <span
                    key={food.name}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 border border-green-200 rounded-full text-sm"
                  >
                    {getFoodEmoji(food.name)} {food.name}
                    <button
                      type="button"
                      onClick={() => handleRemoveFood(food.name)}
                      className="hover:bg-green-200 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* カスタム入力 */}
          <div className="space-y-2 pt-2 border-t">
            <Label>その他（手入力）</Label>
            <div className="flex gap-2">
              <Input
                placeholder="食べ物の名前"
                value={newFood}
                onChange={(e) => setNewFood(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleAddCustomFood("dislike")
                  }
                }}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleAddCustomFood("dislike")}
                disabled={!newFood.trim()}
                className="text-red-600 hover:bg-red-50"
              >
                💔
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleAddCustomFood("like")}
                disabled={!newFood.trim()}
                className="text-green-600 hover:bg-green-50"
              >
                💚
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              あとから追加・変更することもできます
            </p>
          </div>
        </div>

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            {error}
          </div>
        )}

        <div className="space-y-3 pt-4">
          <Button
            className="w-full h-12"
            onClick={handleComplete}
            disabled={isSubmitting}
          >
            {isSubmitting ? "登録中..." : "次へ：レシピ提案を見る"}
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={prevStep}
            disabled={isSubmitting}
          >
            戻る
          </Button>
          <Button
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={handleSkip}
            disabled={isSubmitting}
          >
            スキップして始める
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
