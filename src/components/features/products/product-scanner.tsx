"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera, Upload, X, Loader2, Check } from "lucide-react"

interface ProductScannerProps {
  onScanComplete: (product: any) => void
}

export default function ProductScanner({ onScanComplete }: ProductScannerProps) {
  const [packageImage, setPackageImage] = useState<string | null>(null)
  const [nutritionImage, setNutritionImage] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 編集フォーム用
  const [productName, setProductName] = useState("")
  const [calories, setCalories] = useState("")
  const [protein, setProtein] = useState("")
  const [carbs, setCarbs] = useState("")

  const packageInputRef = useRef<HTMLInputElement>(null)
  const packageCameraRef = useRef<HTMLInputElement>(null)
  const nutritionInputRef = useRef<HTMLInputElement>(null)
  const nutritionCameraRef = useRef<HTMLInputElement>(null)

  const handlePackageImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setError("画像サイズは5MB以下にしてください")
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setPackageImage(reader.result as string)
      setError(null)
    }
    reader.readAsDataURL(file)
  }

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

      // OCRの結果を初期値として設定
      setProductName(data.product.name || "")
      setCalories(data.product.nutrition?.energy_kcal?.toString() || "")
      setProtein(data.product.nutrition?.protein_g?.toString() || "")
      setCarbs(data.product.nutrition?.carbohydrate_g?.toString() || "")

      setShowEditForm(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました")
    } finally {
      setIsScanning(false)
    }
  }

  const handleSave = async () => {
    if (!productName.trim()) {
      setError("商品名を入力してください")
      return
    }

    setIsScanning(true)
    setError(null)

    try {
      // 栄養情報を構築
      const nutritionInfo: any = {}
      if (calories) nutritionInfo.energy_kcal = parseFloat(calories)
      if (protein) nutritionInfo.protein_g = parseFloat(protein)
      if (carbs) nutritionInfo.carbohydrate_g = parseFloat(carbs)

      // 商品を更新または新規作成
      const response = await fetch("/api/products/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: packageImage || nutritionImage,
          name: productName,
          nutrition: nutritionInfo,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "保存に失敗しました")
      }

      const data = await response.json()
      onScanComplete(data.product)

      // リセット
      setPackageImage(null)
      setNutritionImage(null)
      setShowEditForm(false)
      setProductName("")
      setCalories("")
      setProtein("")
      setCarbs("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました")
    } finally {
      setIsScanning(false)
    }
  }

  const handleCancel = () => {
    setPackageImage(null)
    setNutritionImage(null)
    setShowEditForm(false)
    setProductName("")
    setCalories("")
    setProtein("")
    setCarbs("")
    setError(null)
  }

  // 編集フォーム表示
  if (showEditForm) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">商品情報を確認</CardTitle>
          <p className="text-sm text-muted-foreground">
            OCRで読み取った情報を確認・編集してください
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {packageImage && (
              <div>
                <p className="text-sm font-medium mb-2">パッケージ</p>
                <img src={packageImage} alt="パッケージ" className="w-full h-32 object-cover rounded-lg" />
              </div>
            )}
            {nutritionImage && (
              <div>
                <p className="text-sm font-medium mb-2">栄養表示</p>
                <img src={nutritionImage} alt="栄養表示" className="w-full h-32 object-cover rounded-lg" />
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="productName">商品名 *</Label>
              <Input
                id="productName"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="商品名を入力"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="calories">エネルギー (kcal)</Label>
                <Input
                  id="calories"
                  type="number"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  placeholder="0"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="protein">たんぱく質 (g)</Label>
                <Input
                  id="protein"
                  type="number"
                  step="0.1"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                  placeholder="0.0"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="carbs">炭水化物 (g)</Label>
                <Input
                  id="carbs"
                  type="number"
                  step="0.1"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value)}
                  placeholder="0.0"
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleSave}
              disabled={isScanning}
              className="flex-1 h-12"
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  保存
                </>
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

  // 画像プレビュー表示
  if (packageImage || nutritionImage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">商品画像</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* パッケージ画像 */}
            <div className="space-y-2">
              <p className="text-sm font-medium">パッケージ（任意）</p>
              {packageImage ? (
                <div className="relative">
                  <img
                    src={packageImage}
                    alt="パッケージ画像"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => setPackageImage(null)}
                    className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white"
                    disabled={isScanning}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <input
                    ref={packageCameraRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePackageImageSelect}
                    className="hidden"
                  />
                  <input
                    ref={packageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePackageImageSelect}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => packageCameraRef.current?.click()}
                  >
                    <Camera className="w-4 h-4 mr-1" />
                    撮影
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => packageInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    選択
                  </Button>
                </div>
              )}
            </div>

            {/* 栄養表示画像 */}
            <div className="space-y-2">
              <p className="text-sm font-medium">栄養表示 *</p>
              {nutritionImage ? (
                <div className="relative">
                  <img
                    src={nutritionImage}
                    alt="栄養表示画像"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => setNutritionImage(null)}
                    className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white"
                    disabled={isScanning}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
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
                    size="sm"
                    onClick={() => nutritionCameraRef.current?.click()}
                  >
                    <Camera className="w-4 h-4 mr-1" />
                    撮影
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => nutritionInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    選択
                  </Button>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleScan}
              disabled={!nutritionImage || isScanning}
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

  // 初期画面
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">商品を登録</CardTitle>
        <p className="text-sm text-muted-foreground">
          パッケージと栄養表示の写真を撮影してください
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          {/* パッケージ画像 */}
          <div className="space-y-2">
            <p className="text-sm font-medium">① パッケージ（任意）</p>
            <div className="grid grid-cols-2 gap-2">
              <input
                ref={packageCameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePackageImageSelect}
                className="hidden"
              />
              <input
                ref={packageInputRef}
                type="file"
                accept="image/*"
                onChange={handlePackageImageSelect}
                className="hidden"
              />

              <Button
                variant="outline"
                className="h-24 flex-col gap-2"
                onClick={() => packageCameraRef.current?.click()}
              >
                <Camera className="w-6 h-6" />
                <span className="text-xs">撮影</span>
              </Button>

              <Button
                variant="outline"
                className="h-24 flex-col gap-2"
                onClick={() => packageInputRef.current?.click()}
              >
                <Upload className="w-6 h-6" />
                <span className="text-xs">選択</span>
              </Button>
            </div>
          </div>

          {/* 栄養表示画像 */}
          <div className="space-y-2">
            <p className="text-sm font-medium">② 栄養表示 *</p>
            <div className="grid grid-cols-2 gap-2">
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
                className="h-24 flex-col gap-2"
                onClick={() => nutritionCameraRef.current?.click()}
              >
                <Camera className="w-6 h-6" />
                <span className="text-xs">撮影</span>
              </Button>

              <Button
                variant="outline"
                className="h-24 flex-col gap-2"
                onClick={() => nutritionInputRef.current?.click()}
              >
                <Upload className="w-6 h-6" />
                <span className="text-xs">選択</span>
              </Button>
            </div>
          </div>
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
