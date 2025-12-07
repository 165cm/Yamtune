"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useOnboardingStore } from "@/stores/onboarding-store"
import { useAuthStore } from "@/stores/auth-store"
import { useFamilyStore } from "@/stores/family-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Baby, Plus, X } from "lucide-react"

export default function MemberInfoStep() {
  const router = useRouter()
  const { nextStep, prevStep, memberData, setMemberData, familyData, completeOnboarding } = useOnboardingStore()
  const { user } = useAuthStore()
  const { setCurrentFamily, setMembers, setSelectedMember } = useFamilyStore()

  const [name, setName] = useState(memberData.name || "")
  const [birthDate, setBirthDate] = useState(memberData.birthDate || "")
  const [dislikes, setDislikes] = useState<string[]>(memberData.dislikes || [])
  const [newDislike, setNewDislike] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleAddDislike = () => {
    if (newDislike.trim() && !dislikes.includes(newDislike.trim())) {
      setDislikes([...dislikes, newDislike.trim()])
      setNewDislike("")
    }
  }

  const handleRemoveDislike = (dislike: string) => {
    setDislikes(dislikes.filter((d) => d !== dislike))
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

      // 3. 嫌いな食べ物を登録
      if (dislikes.length > 0) {
        await Promise.all(
          dislikes.map((food) =>
            fetch(`/api/members/${member.id}/foods`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                food_name: food,
                category: "dislike",
              }),
            })
          )
        )
      }

      // メンバーデータを保存して次のステップへ
      setMemberData({ name, birthDate, dislikes })
      nextStep()
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました")
      setIsSubmitting(false)
    }
  }

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

          <div className="space-y-2">
            <Label htmlFor="dislikes">苦手な食べ物（任意）</Label>
            <div className="flex gap-2">
              <Input
                id="dislikes"
                placeholder="例: ピーマン"
                value={newDislike}
                onChange={(e) => setNewDislike(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleAddDislike()
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleAddDislike}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {dislikes.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {dislikes.map((dislike) => (
                  <span
                    key={dislike}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-destructive/10 text-destructive rounded-full text-sm"
                  >
                    {dislike}
                    <button
                      type="button"
                      onClick={() => handleRemoveDislike(dislike)}
                      className="hover:bg-destructive/20 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
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
        </div>
      </CardContent>
    </Card>
  )
}
