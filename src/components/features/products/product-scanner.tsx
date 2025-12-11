"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera, Upload, X, Loader2, Check, Search, Barcode } from "lucide-react"

// 栄養素フィールドの定義
const NUTRITION_FIELDS = {
  basic: [
    { key: "energy_kcal", label: "エネルギー", unit: "kcal", step: "1" },
    { key: "protein_g", label: "たんぱく質", unit: "g", step: "0.1" },
    { key: "fat_g", label: "脂質", unit: "g", step: "0.1" },
    { key: "carbohydrate_g", label: "炭水化物", unit: "g", step: "0.1" },
    { key: "salt_g", label: "食塩相当量", unit: "g", step: "0.01" },
  ],
  detailed: [
    { key: "sugar_g", label: "糖質", unit: "g", step: "0.1" },
    { key: "dietary_fiber_g", label: "食物繊維", unit: "g", step: "0.1" },
    { key: "sugars_g", label: "糖類", unit: "g", step: "0.1" },
    { key: "saturated_fat_g", label: "飽和脂肪酸", unit: "g", step: "0.01" },
    { key: "trans_fat_g", label: "トランス脂肪酸", unit: "g", step: "0.01" },
    { key: "cholesterol_mg", label: "コレステロール", unit: "mg", step: "1" },
    { key: "sodium_mg", label: "ナトリウム", unit: "mg", step: "1" },
  ],
  vitamins: [
    { key: "vitamin_a_ug", label: "ビタミンA", unit: "μg", step: "1" },
    { key: "vitamin_b1_mg", label: "ビタミンB1", unit: "mg", step: "0.01" },
    { key: "vitamin_b2_mg", label: "ビタミンB2", unit: "mg", step: "0.01" },
    { key: "vitamin_b6_mg", label: "ビタミンB6", unit: "mg", step: "0.01" },
    { key: "vitamin_b12_ug", label: "ビタミンB12", unit: "μg", step: "0.1" },
    { key: "vitamin_c_mg", label: "ビタミンC", unit: "mg", step: "1" },
    { key: "vitamin_d_ug", label: "ビタミンD", unit: "μg", step: "0.1" },
    { key: "vitamin_e_mg", label: "ビタミンE", unit: "mg", step: "0.1" },
    { key: "vitamin_k_ug", label: "ビタミンK", unit: "μg", step: "1" },
    { key: "folate_ug", label: "葉酸", unit: "μg", step: "1" },
    { key: "niacin_mg", label: "ナイアシン", unit: "mg", step: "0.1" },
    { key: "pantothenic_acid_mg", label: "パントテン酸", unit: "mg", step: "0.01" },
    { key: "biotin_ug", label: "ビオチン", unit: "μg", step: "0.1" },
  ],
  minerals: [
    { key: "calcium_mg", label: "カルシウム", unit: "mg", step: "1" },
    { key: "iron_mg", label: "鉄", unit: "mg", step: "0.1" },
    { key: "magnesium_mg", label: "マグネシウム", unit: "mg", step: "1" },
    { key: "phosphorus_mg", label: "リン", unit: "mg", step: "1" },
    { key: "potassium_mg", label: "カリウム", unit: "mg", step: "1" },
    { key: "zinc_mg", label: "亜鉛", unit: "mg", step: "0.1" },
    { key: "copper_mg", label: "銅", unit: "mg", step: "0.01" },
    { key: "manganese_mg", label: "マンガン", unit: "mg", step: "0.01" },
    { key: "iodine_ug", label: "ヨウ素", unit: "μg", step: "1" },
    { key: "selenium_ug", label: "セレン", unit: "μg", step: "1" },
    { key: "chromium_ug", label: "クロム", unit: "μg", step: "0.1" },
    { key: "molybdenum_ug", label: "モリブデン", unit: "μg", step: "1" },
  ],
}

interface ProductScannerProps {
  onScanComplete: (product: any) => void
}

export default function ProductScanner({ onScanComplete }: ProductScannerProps) {
  const [packageImage, setPackageImage] = useState<string | null>(null)
  const [nutritionImage, setNutritionImage] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // バーコード検索用
  const [barcodeInput, setBarcodeInput] = useState("")
  const [isSearchingBarcode, setIsSearchingBarcode] = useState(false)
  const [barcodeNotFound, setBarcodeNotFound] = useState(false)

  // 編集フォーム用
  const [productName, setProductName] = useState("")
  const [category, setCategory] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [nutrition, setNutrition] = useState<Record<string, number>>({})

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

  const handleBarcodeSearch = async () => {
    if (!barcodeInput.trim()) {
      setError("バーコード番号を入力してください")
      return
    }

    setIsSearchingBarcode(true)
    setError(null)
    setBarcodeNotFound(false)

    try {
      const response = await fetch(`/api/products/barcode?barcode=${barcodeInput.trim()}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "検索に失敗しました")
      }

      if (!data.found) {
        setBarcodeNotFound(true)
        setError(data.message || "商品が見つかりませんでした")
        return
      }

      // 商品が見つかった場合、編集フォームに情報をセット
      setProductName(data.product.name || "")
      setCategory(data.product.category || "")
      setImageUrl(data.product.image_url || "")
      setNutrition(data.product.nutrition || {})
      setShowEditForm(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました")
    } finally {
      setIsSearchingBarcode(false)
    }
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
          confirmNeeded: true,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "スキャンに失敗しました")
      }

      const data = await response.json()

      // AI抽出結果を初期値として設定
      setProductName(data.extractedData.product_name || "")
      setCategory(data.extractedData.category || "その他")
      setImageUrl(data.imageUrl || "")
      setNutrition(data.extractedData.nutrition_per_100g || {})

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
      // 商品を保存（confirmNeededなしで保存まで実行）
      const response = await fetch("/api/products/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: packageImage || nutritionImage,
          name: productName,
          nutrition: nutrition,
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
      setCategory("")
      setImageUrl("")
      setNutrition({})
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
    setCategory("")
    setImageUrl("")
    setNutrition({})
    setError(null)
    setBarcodeInput("")
    setBarcodeNotFound(false)
  }

  // 栄養素フィールドのレンダリングヘルパー
  const renderNutritionFields = (fields: typeof NUTRITION_FIELDS.basic) => {
    return fields.map((field) => (
      <div key={field.key}>
        <Label htmlFor={field.key} className="text-xs">
          {field.label} ({field.unit})
        </Label>
        <Input
          id={field.key}
          type="number"
          step={field.step}
          value={nutrition[field.key]?.toString() || ""}
          onChange={(e) => {
            const value = e.target.value
            if (value === "") {
              const newNutrition = { ...nutrition }
              delete newNutrition[field.key]
              setNutrition(newNutrition)
            } else {
              setNutrition({ ...nutrition, [field.key]: parseFloat(value) })
            }
          }}
          placeholder="-"
          className="mt-1 h-9"
        />
      </div>
    ))
  }

  // 編集フォーム表示
  if (showEditForm) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">商品情報を確認</CardTitle>
          <p className="text-sm text-muted-foreground">
            AIで読み取った情報を確認・編集してください
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {packageImage && (
              <div>
                <p className="text-sm font-medium mb-2">パッケージ</p>
                <div className="aspect-square w-full rounded-lg overflow-hidden">
                  <img src={packageImage} alt="パッケージ" className="w-full h-full object-cover" />
                </div>
              </div>
            )}
            {nutritionImage && (
              <div>
                <p className="text-sm font-medium mb-2">栄養表示</p>
                <div className="aspect-square w-full rounded-lg overflow-hidden">
                  <img src={nutritionImage} alt="栄養表示" className="w-full h-full object-cover" />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
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

            <div>
              <Label htmlFor="category">カテゴリ</Label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="カテゴリ"
                className="mt-1"
              />
            </div>

            <div className="space-y-3 border-t pt-3">
              <h3 className="font-medium text-sm">基本栄養素（100gあたり）</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {renderNutritionFields(NUTRITION_FIELDS.basic)}
              </div>
            </div>

            <details className="border-t pt-3">
              <summary className="font-medium text-sm cursor-pointer">詳細栄養素（表示がある場合）</summary>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                {renderNutritionFields(NUTRITION_FIELDS.detailed)}
              </div>
            </details>

            <details className="border-t pt-3">
              <summary className="font-medium text-sm cursor-pointer">ビタミン類（表示がある場合）</summary>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                {renderNutritionFields(NUTRITION_FIELDS.vitamins)}
              </div>
            </details>

            <details className="border-t pt-3">
              <summary className="font-medium text-sm cursor-pointer">ミネラル類（表示がある場合）</summary>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                {renderNutritionFields(NUTRITION_FIELDS.minerals)}
              </div>
            </details>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="flex gap-3 border-t pt-4">
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
                <div className="relative aspect-square w-full rounded-lg overflow-hidden">
                  <img
                    src={packageImage}
                    alt="パッケージ画像"
                    className="w-full h-full object-cover"
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
                <div className="relative aspect-square w-full rounded-lg overflow-hidden">
                  <img
                    src={nutritionImage}
                    alt="栄養表示画像"
                    className="w-full h-full object-cover"
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
          バーコードで検索、または写真を撮影してください
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* バーコード検索セクション */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Barcode className="w-5 h-5 text-primary" />
            <p className="text-sm font-medium">バーコードで検索（おすすめ）</p>
          </div>
          <div className="flex gap-2">
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="バーコード番号を入力（例: 4901234567890）"
              value={barcodeInput}
              onChange={(e) => {
                setBarcodeInput(e.target.value.replace(/\D/g, ""))
                setBarcodeNotFound(false)
                setError(null)
              }}
              className="flex-1"
              disabled={isSearchingBarcode}
            />
            <Button
              onClick={handleBarcodeSearch}
              disabled={!barcodeInput.trim() || isSearchingBarcode}
            >
              {isSearchingBarcode ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>
          {barcodeNotFound && (
            <p className="text-xs text-muted-foreground">
              見つからない場合は、下の写真撮影で登録できます
            </p>
          )}
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              または
            </span>
          </div>
        </div>

        {/* 画像スキャンセクション */}
        <div className="space-y-3">
          <p className="text-sm font-medium">写真で登録</p>
          <div className="grid md:grid-cols-2 gap-4">
            {/* パッケージ画像 */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">① パッケージ（任意）</p>
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
                  className="h-20 flex-col gap-1"
                  onClick={() => packageCameraRef.current?.click()}
                >
                  <Camera className="w-5 h-5" />
                  <span className="text-xs">撮影</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-20 flex-col gap-1"
                  onClick={() => packageInputRef.current?.click()}
                >
                  <Upload className="w-5 h-5" />
                  <span className="text-xs">選択</span>
                </Button>
              </div>
            </div>

            {/* 栄養表示画像 */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">② 栄養表示 *</p>
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
                  className="h-20 flex-col gap-1"
                  onClick={() => nutritionCameraRef.current?.click()}
                >
                  <Camera className="w-5 h-5" />
                  <span className="text-xs">撮影</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-20 flex-col gap-1"
                  onClick={() => nutritionInputRef.current?.click()}
                >
                  <Upload className="w-5 h-5" />
                  <span className="text-xs">選択</span>
                </Button>
              </div>
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
