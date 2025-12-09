"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/stores/auth-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import ProductScanner from "@/components/features/products/product-scanner"
import ProductCard from "@/components/features/products/product-card"
import RecipeGenerator from "@/components/features/recipes/recipe-generator"
import { Package, Sparkles, ShoppingBag, ChefHat, Heart } from "lucide-react"
import { ProductCardSkeleton, RecipeCardSkeleton, FullPageLoader } from "@/components/ui/skeleton"

export default function HomePage() {
  const router = useRouter()
  const { user, setUser, isLoading, setIsLoading } = useAuthStore()
  const supabase = createClient()
  const [products, setProducts] = useState<any[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)
  const [recentRecipes, setRecentRecipes] = useState<any[]>([])
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(true)
  const productsListRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setIsLoading(false)

      if (!user) {
        router.push("/login")
      } else {
        fetchProducts()
        fetchRecentRecipes()
      }
    }

    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
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

  const fetchRecentRecipes = async () => {
    try {
      const response = await fetch("/api/recipes")
      if (response.ok) {
        const data = await response.json()
        setRecentRecipes(data.recipes.slice(0, 3)) // 最新3件のみ
      }
    } catch (error) {
      console.error("Failed to fetch recipes:", error)
    } finally {
      setIsLoadingRecipes(false)
    }
  }

  const handleScanComplete = (product: any) => {
    setProducts([product, ...products])
    // 商品一覧にスクロール
    setTimeout(() => {
      productsListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 100)
  }

  const handleDeleteProduct = async (id: string) => {
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setProducts(products.filter((p) => p.id !== id))
      }
    } catch (error) {
      console.error("Failed to delete product:", error)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  if (isLoading) {
    return <FullPageLoader />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Yamtune</h1>
          <Button variant="outline" onClick={handleLogout}>
            ログアウト
          </Button>
        </div>

        {/* 登録済み商品一覧 */}
        <div ref={productsListRef}>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <ShoppingBag className="w-6 h-6" />
            登録済み商品
            {!isLoadingProducts && products.length > 0 && (
              <span className="text-sm text-muted-foreground font-normal">
                ({products.length}件)
              </span>
            )}
          </h2>

          {isLoadingProducts ? (
            <div className="grid gap-4 md:grid-cols-2">
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
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Package className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">まだ商品が登録されていません</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  下の「商品をスキャン」から商品を登録してみましょう
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 商品スキャン */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Package className="w-6 h-6" />
            商品をスキャン
          </h2>
          <ProductScanner onScanComplete={handleScanComplete} />
        </div>

        {/* 最近のレシピ */}
        {recentRecipes.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <ChefHat className="w-6 h-6" />
                最近のレシピ
              </h2>
              <Button
                variant="ghost"
                onClick={() => router.push("/recipes")}
                className="text-sm"
              >
                すべて見る →
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {recentRecipes.map((recipe) => (
                <Card
                  key={recipe.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => router.push(`/recipes/${recipe.id}`)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base line-clamp-2">
                        {recipe.title}
                      </CardTitle>
                      {recipe.isFavorite && (
                        <Heart className="w-4 h-4 text-red-500 fill-current flex-shrink-0" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                      {recipe.description}
                    </p>
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      <span>{recipe.servings}人分</span>
                      <span>•</span>
                      <span>{recipe.cooking_time}分</span>
                      <span>•</span>
                      <span>{recipe.difficulty}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* AIレシピ生成 */}
        {products.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="w-6 h-6" />
              AIレシピ生成
            </h2>
            <Card>
              <CardContent className="pt-6">
                <RecipeGenerator products={products} />
              </CardContent>
            </Card>
          </div>
        )}

        {/* クイックアクション */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              クイックアクション
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Button
                variant="outline"
                className="h-20"
                onClick={() => router.push("/recipes")}
              >
                レシピを見る
              </Button>
              <Button
                variant="outline"
                className="h-20"
                onClick={() => router.push("/family")}
              >
                家族管理
              </Button>
              <Button
                variant="outline"
                className="h-20"
                onClick={() => router.push("/settings")}
              >
                設定
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
