"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2, Flame, Beef, Wheat } from "lucide-react"

interface ProductCardProps {
  product: any
  onDelete?: (id: string) => void
}

export default function ProductCard({ product, onDelete }: ProductCardProps) {
  const nutrition = product.nutrition || product.nutrition_per_100g || {}

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg line-clamp-2">{product.name}</CardTitle>
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(product.id)}
              className="text-destructive hover:text-destructive/90 flex-shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {product.image_url && (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-40 object-cover rounded-md"
          />
        )}

        {/* 厳選3種類の栄養素 */}
        <div className="grid grid-cols-3 gap-3">
          {nutrition.energy_kcal !== undefined && (
            <div className="flex flex-col items-center p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
              <Flame className="w-5 h-5 text-orange-600 dark:text-orange-400 mb-1" />
              <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {nutrition.energy_kcal}
              </span>
              <span className="text-xs text-muted-foreground">kcal</span>
            </div>
          )}
          {nutrition.protein_g !== undefined && (
            <div className="flex flex-col items-center p-3 bg-red-50 dark:bg-red-950 rounded-lg">
              <Beef className="w-5 h-5 text-red-600 dark:text-red-400 mb-1" />
              <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                {nutrition.protein_g}
              </span>
              <span className="text-xs text-muted-foreground">g</span>
            </div>
          )}
          {nutrition.carbohydrate_g !== undefined && (
            <div className="flex flex-col items-center p-3 bg-amber-50 dark:bg-amber-950 rounded-lg">
              <Wheat className="w-5 h-5 text-amber-600 dark:text-amber-400 mb-1" />
              <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {nutrition.carbohydrate_g}
              </span>
              <span className="text-xs text-muted-foreground">g</span>
            </div>
          )}
        </div>

        {Object.keys(nutrition).length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-2">
            栄養情報なし
          </p>
        )}
      </CardContent>
    </Card>
  )
}
