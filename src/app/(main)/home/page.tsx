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
import { Package, Sparkles, ShoppingBag, ChefHat, Heart, Calendar, Check, Sun } from "lucide-react"
import { ProductCardSkeleton, RecipeCardSkeleton, FullPageLoader } from "@/components/ui/skeleton"

export default function HomePage() {
  const router = useRouter()
  const { user, setUser, isLoading, setIsLoading } = useAuthStore()
  const supabase = createClient()
  const [products, setProducts] = useState<any[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)
  const [recentRecipes, setRecentRecipes] = useState<any[]>([])
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(true)
  const [familyPreferences, setFamilyPreferences] = useState<any[]>([])
  const [todayMeals, setTodayMeals] = useState<any[]>([])
  const [isLoadingMeals, setIsLoadingMeals] = useState(true)
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
        fetchFamilyPreferences()
        fetchTodayMeals()
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

  const fetchFamilyPreferences = async () => {
    try {
      // 家族を取得
      const familyRes = await fetch("/api/families")
      if (!familyRes.ok) return

      const families = await familyRes.json()
      if (families.length === 0) return

      // メンバーを取得
      const membersRes = await fetch(`/api/members?family_id=${families[0].id}`)
      if (!membersRes.ok) return

      const members = await membersRes.json()

      // 各メンバーの食べ物好き嫌いを取得
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

  const fetchTodayMeals = async () => {
    try {
      const today = new Date().toISOString().split("T")[0]
      const response = await fetch(
        `/api/meal-plans?start_date=${today}&end_date=${today}`
      )
      if (response.ok) {
        const data = await response.json()
        setTodayMeals(data.mealPlans || [])
      }
    } catch (error) {
      console.error("Failed to fetch today meals:", error)
    } finally {
      setIsLoadingMeals(false)
    }
  }

  // 挨拶メッセージを時間帯で変更
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "おはようございます"
    if (hour < 18) return "こんにちは"
    return "こんばんは"
  }

  // 食事タイプのラベル
  const getMealLabel = (mealType: string) => {
    const labels: Record<string, { label: string; emoji: string }> = {
      breakfast: { label: "朝食", emoji: "🍳" },
      lunch: { label: "昼食", emoji: "🍱" },
      dinner: { label: "夕食", emoji: "🍽️" },
      snack: { label: "おやつ", emoji: "🍪" },
    }
    return labels[mealType] || { label: mealType, emoji: "🍴" }
  }

  // 今日の献立を食事タイプ順にソート
  const sortedTodayMeals = [...todayMeals].sort((a, b) => {
    const order = ["breakfast", "lunch", "dinner", "snack"]
    return order.indexOf(a.mealType) - order.indexOf(b.mealType)
  })

  const handleScanComplete = (product: any) => {
    setProducts([product, ...products])
    // 商品一覧にスクロール
    setTimeout(() => {
      productsListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 100)
  }

  const handleDeleteProduct = (id: string) => {
    setProducts(products.filter((p) => p.id !== id))
  }

  const handleUpdateProduct = (updatedProduct: any) => {
    setProducts(products.map((p) =>
      p.id === updatedProduct.id ? updatedProduct : p
    ))
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

        {/* 今日の挨拶と献立 */}
        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Sun className="w-5 h-5 text-amber-500" />
              <CardTitle className="text-lg">{getGreeting()}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">今日の献立</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/calendar")}
                className="text-amber-700 hover:text-amber-800"
              >
                <Calendar className="w-4 h-4 mr-1" />
                カレンダー
              </Button>
            </div>

            {isLoadingMeals ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 bg-amber-100 rounded animate-pulse" />
                ))}
              </div>
            ) : sortedTodayMeals.length > 0 ? (
              <div className="space-y-2">
                {sortedTodayMeals.map((meal) => {
                  const mealInfo = getMealLabel(meal.mealType)
                  return (
                    <div
                      key={meal.id}
                      className={`flex items-center gap-3 p-2 rounded-lg ${
                        meal.isCompleted ? "bg-green-100" : "bg-white"
                      }`}
                    >
                      <span className="text-lg">{mealInfo.emoji}</span>
                      <span className="text-sm font-medium w-12">{mealInfo.label}</span>
                      <span className="flex-1 text-sm truncate">
                        {meal.recipe?.title || "未設定"}
                      </span>
                      {meal.isCompleted && (
                        <Check className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-3">
                  今日の献立がまだ設定されていません
                </p>
                <Button
                  size="sm"
                  onClick={() => router.push("/calendar")}
                  className="bg-amber-500 hover:bg-amber-600"
                >
                  献立を設定する
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

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
                  onUpdate={handleUpdateProduct}
                  familyPreferences={familyPreferences}
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
            <div className="grid gap-4 md:grid-cols-4">
              <Button
                variant="outline"
                className="h-20"
                onClick={() => router.push("/calendar")}
              >
                <Calendar className="w-5 h-5 mr-2" />
                献立カレンダー
              </Button>
              <Button
                variant="outline"
                className="h-20"
                onClick={() => router.push("/recipes")}
              >
                <ChefHat className="w-5 h-5 mr-2" />
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
