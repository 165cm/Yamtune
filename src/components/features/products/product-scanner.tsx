"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Camera, Upload, X, Loader2 } from "lucide-react"

interface ProductScannerProps {
  onScanComplete: (product: any) => void
}

export default function ProductScanner({ onScanComplete }: ProductScannerProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // ファイルサイズチェック（5MB制限）
    if (file.size > 5 * 1024 * 1024) {
      setError("画像サイズは5MB以下にしてください")
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setSelectedImage(reader.result as string)
      setError(null)
    }
    reader.readAsDataURL(file)
  }

  const handleScan = async () => {
    if (!selectedImage) return

    setIsScanning(true)
    setError(null)

    try {
      const response = await fetch("/api/products/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: selectedImage,
        }),
      })

      if (!response.ok) {
        throw new Error("スキャンに失敗しました")
      }

      const data = await response.json()
      onScanComplete(data.product)
      setSelectedImage(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました")
    } finally {
      setIsScanning(false)
    }
  }

  const handleCancel = () => {
    setSelectedImage(null)
    setError(null)
  }

  if (selectedImage) {
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="relative">
            <img
              src={selectedImage}
              alt="選択された画像"
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
      <CardContent className="p-6">
        <div className="grid grid-cols-2 gap-4">
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageSelect}
            className="hidden"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />

          <Button
            variant="outline"
            className="h-32 flex-col gap-2"
            onClick={() => cameraInputRef.current?.click()}
          >
            <Camera className="w-8 h-8" />
            <span className="text-sm">カメラで撮影</span>
          </Button>

          <Button
            variant="outline"
            className="h-32 flex-col gap-2"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-8 h-8" />
            <span className="text-sm">ファイルから選択</span>
          </Button>
        </div>

        {error && (
          <div className="mt-4 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
