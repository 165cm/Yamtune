"use client"

import { useOnboardingStore } from "@/stores/onboarding-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, Camera, ChefHat, Users } from "lucide-react"

export default function WelcomeStep() {
  const { nextStep } = useOnboardingStore()

  return (
    <Card className="border-2">
      <CardHeader className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <CardTitle className="text-3xl">Yamtuneへようこそ！</CardTitle>
        <CardDescription className="text-base">
          子どもの好き嫌い克服をサポートする<br />
          栄養レシピアプリです
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
              <Camera className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">商品をスキャン</h3>
              <p className="text-sm text-muted-foreground">
                食品パッケージを撮影して栄養情報を取得
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
              <ChefHat className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">AIレシピ生成</h3>
              <p className="text-sm text-muted-foreground">
                お子様の好みに合わせた栄養バランスレシピを提案
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">成長を記録</h3>
              <p className="text-sm text-muted-foreground">
                食べられるようになった食材を記録して成長を実感
              </p>
            </div>
          </div>
        </div>

        <div className="pt-4">
          <Button
            className="w-full h-12 text-lg"
            onClick={nextStep}
          >
            始める
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
