"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

interface ProductCardProps {
  product: any
  onDelete?: (id: string) => void
}

export default function ProductCard({ product, onDelete }: ProductCardProps) {
  const nutrition = product.nutrition_per_100g || {}

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{product.name}</CardTitle>
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(product.id)}
              className="text-destructive hover:text-destructive/90"
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
            className="w-full h-48 object-cover rounded-md"
          />
        )}

        {Object.keys(nutrition).length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">栄養成分（100gあたり）</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {nutrition.energy_kcal && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">エネルギー</span>
                  <span className="font-medium">{nutrition.energy_kcal} kcal</span>
                </div>
              )}
              {nutrition.protein_g && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">たんぱく質</span>
                  <span className="font-medium">{nutrition.protein_g} g</span>
                </div>
              )}
              {nutrition.fat_g && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">脂質</span>
                  <span className="font-medium">{nutrition.fat_g} g</span>
                </div>
              )}
              {nutrition.carbohydrate_g && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">炭水化物</span>
                  <span className="font-medium">{nutrition.carbohydrate_g} g</span>
                </div>
              )}
              {nutrition.salt_g && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">食塩相当量</span>
                  <span className="font-medium">{nutrition.salt_g} g</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
