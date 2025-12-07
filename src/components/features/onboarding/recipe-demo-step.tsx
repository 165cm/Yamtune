"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useOnboardingStore } from "@/stores/onboarding-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, Clock, Users as UsersIcon } from "lucide-react"

export default function RecipeDemoStep() {
  const router = useRouter()
  const { prevStep, completeOnboarding } = useOnboardingStore()
  const [isGenerating, setIsGenerating] = useState(false)
  const [isGenerated, setIsGenerated] = useState(false)

  const handleGenerate = () => {
    setIsGenerating(true)
    // デモ用のアニメーション
    setTimeout(() => {
      setIsGenerating(false)
      setIsGenerated(true)
    }, 3000)
  }

  const handleComplete = () => {
    completeOnboarding()
    router.push("/home")
  }

  return (
    <Card className="border-2">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">AIレシピ生成体験</CardTitle>
        <CardDescription>
          お子様に合わせたレシピを生成します
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isGenerated ? (
          <div className="aspect-square bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg flex items-center justify-center">
            <div className="text-center p-6">
              <Sparkles className="w-16 h-16 text-primary mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                {isGenerating
                  ? "AIがレシピを考えています..."
                  : "AIがお子様に最適なレシピを生成します"}
              </p>
              {isGenerating && (
                <div className="mt-4">
                  <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="aspect-video bg-gradient-to-br from-orange-100 to-yellow-100 rounded-lg flex items-center justify-center">
              <span className="text-4xl">🍳</span>
            </div>

            <div className="space-y-3">
              <h3 className="text-xl font-bold">野菜たっぷりハンバーグ</h3>
              <p className="text-sm text-muted-foreground">
                にんじんとほうれん草を細かく刻んで混ぜ込んだ、栄養満点のハンバーグです。
              </p>

              <div className="flex gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>30分</span>
                </div>
                <div className="flex items-center gap-1">
                  <UsersIcon className="w-4 h-4" />
                  <span>2人分</span>
                </div>
              </div>

              <div className="p-3 bg-primary/5 rounded-lg">
                <p className="text-xs font-medium text-primary mb-1">
                  💡 隠し野菜ポイント
                </p>
                <p className="text-xs text-muted-foreground">
                  にんじん、ほうれん草を細かく刻むことで、お子様が気づきにくくなります
                </p>
              </div>
            </div>
          </div>
        )}

        {!isGenerated ? (
          <div className="space-y-3">
            <Button
              className="w-full h-12"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? "生成中..." : "レシピを生成"}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={prevStep}
              disabled={isGenerating}
            >
              戻る
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <Button
              className="w-full h-12"
              onClick={handleComplete}
            >
              Yamtuneを始める
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={prevStep}
            >
              戻る
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
