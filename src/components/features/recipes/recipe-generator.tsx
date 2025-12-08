"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ChefHat, Loader2, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"

interface RecipeGeneratorProps {
  products: any[]
}

export default function RecipeGenerator({ products }: RecipeGeneratorProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleProductToggle = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    )
  }

  const handleGenerate = async () => {
    if (selectedProducts.length === 0) {
      setError("少なくとも1つの商品を選択してください")
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch("/api/recipes/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productIds: selectedProducts,
          servings: 2,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "レシピ生成に失敗しました")
      }

      const data = await response.json()

      // レシピ詳細ページに遷移
      router.push(`/recipes/${data.recipe.id}`)
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました")
    } finally {
      setIsGenerating(false)
    }
  }

  if (products.length === 0) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="w-full h-20 text-lg">
          <ChefHat className="w-6 h-6 mr-2" />
          AIレシピ生成
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            レシピを生成
          </DialogTitle>
          <DialogDescription>
            使用する商品を選択してください。AIが栄養バランスの良いレシピを提案します。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            {products.map((product) => (
              <div
                key={product.id}
                className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent cursor-pointer"
                onClick={() => handleProductToggle(product.id)}
              >
                <Checkbox
                  id={product.id}
                  checked={selectedProducts.includes(product.id)}
                  onCheckedChange={() => handleProductToggle(product.id)}
                />
                <div className="flex-1">
                  <Label
                    htmlFor={product.id}
                    className="text-sm font-medium cursor-pointer"
                  >
                    {product.name}
                  </Label>
                  {product.category && (
                    <p className="text-xs text-muted-foreground">
                      {product.category}
                    </p>
                  )}
                </div>
                {product.image_url && (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                )}
              </div>
            ))}
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            <p>💡 ヒント:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>複数の商品を選ぶと、よりバラエティ豊かなレシピが生成されます</li>
              <li>お子様の好き嫌い情報を考慮してレシピを提案します</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isGenerating}>
            キャンセル
          </Button>
          <Button onClick={handleGenerate} disabled={isGenerating || selectedProducts.length === 0}>
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                レシピを生成
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
