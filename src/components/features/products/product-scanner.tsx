"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera, Upload, X, Loader2 } from "lucide-react"

interface ProductScannerProps {
  onScanComplete: (product: any) => void
}

export default function ProductScanner({ onScanComplete }: ProductScannerProps) {
  const [nutritionImage, setNutritionImage] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const nutritionInputRef = useRef<HTMLInputElement>(null)
  const nutritionCameraRef = useRef<HTMLInputElement>(null)

  const handleNutritionImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // ファイルサイズチェック（5MB制限）
    if (file.size > 5 * 1024 * 1024) {
      setError("画像サイズは5MB以下にしてください")
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setNutritionImage(reader.result as string)
      setError(null)
    }
    reader.readAsDataURL(file)
  }

  const handleScan = async () => {
    if (!nutritionImage) {
      setError("栄養表示の画像を選択してください")
      return
    }

    setIsScanning(true)
    setError(null)

    try {
      const response = await fetch("/api/products/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: nutritionImage,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "スキャンに失敗しました")
      }

      const data = await response.json()
      onScanComplete(data.product)
      setNutritionImage(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました")
    } finally {
      setIsScanning(false)
    }
  }

  const handleCancel = () => {
    setNutritionImage(null)
    setError(null)
  }

  if (nutritionImage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">栄養表示をスキャン</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <img
              src={nutritionImage}
              alt="栄養表示画像"
              className="w-full h-auto rounded-lg"
            />
            <button
              onClick={handleCancel}
              className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white"
              disabled={isScanning}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleScan}
              disabled={isScanning}
              className="flex-1 h-12"
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  スキャン中...
                </>
              ) : (
                "商品をスキャン"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isScanning}
              className="h-12"
            >
              キャンセル
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">栄養表示を撮影</CardTitle>
        <p className="text-sm text-muted-foreground">
          商品パッケージの栄養成分表示部分を撮影してください
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <input
            ref={nutritionCameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleNutritionImageSelect}
            className="hidden"
          />
          <input
            ref={nutritionInputRef}
            type="file"
            accept="image/*"
            onChange={handleNutritionImageSelect}
            className="hidden"
          />

          <Button
            variant="outline"
            className="h-32 flex-col gap-2"
            onClick={() => nutritionCameraRef.current?.click()}
          >
            <Camera className="w-8 h-8" />
            <span className="text-sm">カメラで撮影</span>
          </Button>

          <Button
            variant="outline"
            className="h-32 flex-col gap-2"
            onClick={() => nutritionInputRef.current?.click()}
          >
            <Upload className="w-8 h-8" />
            <span className="text-sm">ファイルから選択</span>
          </Button>
        </div>

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
