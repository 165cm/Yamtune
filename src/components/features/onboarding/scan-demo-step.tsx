"use client"

import { useState } from "react"
import { useOnboardingStore } from "@/stores/onboarding-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera, CheckCircle2 } from "lucide-react"

export default function ScanDemoStep() {
  const { nextStep, prevStep } = useOnboardingStore()
  const [isScanning, setIsScanning] = useState(false)
  const [isScanned, setIsScanned] = useState(false)

  const handleScan = () => {
    setIsScanning(true)
    // デモ用のアニメーション
    setTimeout(() => {
      setIsScanning(false)
      setIsScanned(true)
    }, 2000)
  }

  return (
    <Card className="border-2">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">商品スキャン体験</CardTitle>
        <CardDescription>
          まずは機能を体験してみましょう
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="aspect-square bg-gradient-to-br from-muted to-muted/50 rounded-lg flex items-center justify-center relative overflow-hidden">
          {!isScanned ? (
            <div className="text-center">
              <Camera className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                商品パッケージを撮影
              </p>
            </div>
          ) : (
            <div className="text-center">
              <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-4" />
              <p className="text-sm font-medium">スキャン完了！</p>
              <div className="mt-4 p-4 bg-white rounded-lg shadow-sm text-left max-w-xs">
                <h4 className="font-semibold mb-2">商品情報</h4>
                <p className="text-sm text-muted-foreground mb-1">
                  商品名: サンプル食品
                </p>
                <p className="text-sm text-muted-foreground mb-1">
                  エネルギー: 150kcal
                </p>
                <p className="text-sm text-muted-foreground">
                  たんぱく質: 5.2g
                </p>
              </div>
            </div>
          )}

          {isScanning && (
            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
              <div className="animate-pulse text-white font-semibold">
                スキャン中...
              </div>
            </div>
          )}
        </div>

        {!isScanned ? (
          <Button
            className="w-full h-12"
            onClick={handleScan}
            disabled={isScanning}
          >
            {isScanning ? "スキャン中..." : "商品をスキャン"}
          </Button>
        ) : (
          <div className="space-y-3">
            <Button
              className="w-full h-12"
              onClick={nextStep}
            >
              次へ：レシピを生成
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
