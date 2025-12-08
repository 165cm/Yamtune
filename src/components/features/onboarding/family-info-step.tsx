"use client"

import { useState } from "react"
import { useOnboardingStore } from "@/stores/onboarding-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users } from "lucide-react"

export default function FamilyInfoStep() {
  const { nextStep, prevStep, familyData, setFamilyData } = useOnboardingStore()
  const [familyName, setFamilyName] = useState(familyData.name || "")
  const [error, setError] = useState("")

  const handleNext = () => {
    if (!familyName.trim()) {
      setError("家族の名前を入力してください")
      return
    }

    setFamilyData({ name: familyName })
    nextStep()
  }

  const handleSkip = () => {
    // デフォルトの家族名を設定してスキップ
    setFamilyData({ name: "マイファミリー" })
    nextStep()
  }

  return (
    <Card className="border-2">
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Users className="w-8 h-8 text-primary" />
        </div>
        <CardTitle className="text-2xl">家族情報の登録</CardTitle>
        <CardDescription>
          ご家族の情報を教えてください
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="familyName">家族の名前</Label>
          <Input
            id="familyName"
            placeholder="例: 田中家"
            value={familyName}
            onChange={(e) => {
              setFamilyName(e.target.value)
              setError("")
            }}
            className="h-12"
          />
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <p className="text-xs text-muted-foreground">
            あとから変更することもできます
          </p>
        </div>

        <div className="space-y-3 pt-4">
          <Button
            className="w-full h-12"
            onClick={handleNext}
          >
            次へ：お子様の情報を入力
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={prevStep}
          >
            戻る
          </Button>
          <Button
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={handleSkip}
          >
            スキップ
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
