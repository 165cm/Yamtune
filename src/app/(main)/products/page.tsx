"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/stores/auth-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import ProductScanner from "@/components/features/products/product-scanner"
import ProductCard from "@/components/features/products/product-card"
import RecipeGenerator from "@/components/features/recipes/recipe-generator"
import { Package, ArrowLeft, Plus, X, ChefHat } from "lucide-react"
import { ProductCardSkeleton, FullPageLoader } from "@/components/ui/skeleton"

// Suspenseでラップするためのメインコンポーネント
function ProductsPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, setUser, isLoading, setIsLoading } = useAuthStore()
  const supabase = createClient()
  const [products, setProducts] = useState<any[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)
  const [familyPreferences, setFamilyPreferences] = useState<any[]>([])
  const [showScanner, setShowScanner] = useState(false)

  // URLパラメータでアクションを確認
  const actionParam = searchParams.get("action")

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setIsLoading(false)

      if (!user) {
        router.push("/login")
      } else {
        fetchProducts()
        fetchFamilyPreferences()
      }
    }

    checkUser()
  }, [supabase, setUser, setIsLoading, router])

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products")
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      }
    } catch (error) {
      console.error("Failed to fetch products:", error)
    } finally {
      setIsLoadingProducts(false)
    }
  }

  const fetchFamilyPreferences = async () => {
    try {
      const familyRes = await fetch("/api/families")
      if (!familyRes.ok) return

      const families = await familyRes.json()
      if (families.length === 0) return

      const membersRes = await fetch(`/api/members?family_id=${families[0].id}`)
      if (!membersRes.ok) return

      const members = await membersRes.json()

      const allPreferences: any[] = []
      for (const member of members) {
        const foodsRes = await fetch(`/api/members/${member.id}/foods`)
        if (foodsRes.ok) {
          const foods = await foodsRes.json()
          foods.forEach((food: any) => {
            allPreferences.push({
              memberName: member.name,
              foodName: food.food_name,
              status: food.status,
            })
          })
        }
      }

      setFamilyPreferences(allPreferences)
    } catch (error) {
      console.error("Failed to fetch family preferences:", error)
    }
  }

  const handleScanComplete = (product: any) => {
    setProducts([product, ...products])
    setShowScanner(false)
  }

  const handleDeleteProduct = (id: string) => {
    setProducts(products.filter((p) => p.id !== id))
  }

  const handleUpdateProduct = (updatedProduct: any) => {
    setProducts(products.map((p) =>
      p.id === updatedProduct.id ? updatedProduct : p
    ))
  }

  if (isLoading) {
    return <FullPageLoader />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-amber-50">
      {/* ヘッダー */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/home")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Package className="w-5 h-5" />
              商品一覧
              {!isLoadingProducts && (
                <span className="text-sm text-muted-foreground font-normal">
                  ({products.length}件)
                </span>
              )}
            </h1>
          </div>
          <Button
            onClick={() => setShowScanner(!showScanner)}
            className={showScanner ? "bg-red-500 hover:bg-red-600" : ""}
          >
            {showScanner ? (
              <>
                <X className="w-4 h-4 mr-2" />
                閉じる
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                商品を追加
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-4 pb-20">
        {/* スキャナー（トグル表示） */}
        {showScanner && (
          <Card className="border-2 border-dashed border-primary">
            <CardContent className="pt-6">
              <ProductScanner onScanComplete={handleScanComplete} />
            </CardContent>
          </Card>
        )}

        {/* レシピ生成ボタン（商品がある場合） */}
        {!isLoadingProducts && products.length > 0 && (
          <Card className={`${actionParam === "generate" ? "border-2 border-orange-300 bg-orange-50" : ""}`}>
            <CardContent className="py-4">
              {actionParam === "generate" && (
                <p className="text-sm text-orange-700 mb-3 text-center">
                  下の商品から使いたいものを選んでレシピを作りましょう！
                </p>
              )}
              <RecipeGenerator products={products} />
            </CardContent>
          </Card>
        )}

        {/* 商品一覧 */}
        {isLoadingProducts ? (
          <div className="grid gap-4 md:grid-cols-2">
            <ProductCardSkeleton />
            <ProductCardSkeleton />
            <ProductCardSkeleton />
            <ProductCardSkeleton />
          </div>
        ) : products.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onDelete={handleDeleteProduct}
                onUpdate={handleUpdateProduct}
                familyPreferences={familyPreferences}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Package className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                まだ商品が登録されていません
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                「商品を追加」ボタンから商品を登録してみましょう
              </p>
              <Button onClick={() => setShowScanner(true)}>
                <Plus className="w-4 h-4 mr-2" />
                最初の商品を追加
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

// useSearchParamsをSuspenseでラップ
export default function ProductsPage() {
  return (
    <Suspense fallback={<FullPageLoader />}>
      <ProductsPageContent />
    </Suspense>
  )
}
