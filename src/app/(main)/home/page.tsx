"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/stores/auth-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import ProductScanner from "@/components/features/products/product-scanner"
import ProductCard from "@/components/features/products/product-card"
import { Package, Sparkles } from "lucide-react"

export default function HomePage() {
  const router = useRouter()
  const { user, setUser, isLoading, setIsLoading } = useAuthStore()
  const supabase = createClient()
  const [products, setProducts] = useState<any[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setIsLoading(false)

      if (!user) {
        router.push("/login")
      } else {
        fetchProducts()
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

  const handleScanComplete = (product: any) => {
    setProducts([product, ...products])
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
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">読み込み中...</div>
      </div>
    )
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

        {/* 商品スキャン */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Package className="w-6 h-6" />
            商品をスキャン
          </h2>
          <ProductScanner onScanComplete={handleScanComplete} />
        </div>

        {/* スキャン済み商品 */}
        {products.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">スキャン済み商品</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onDelete={handleDeleteProduct}
                />
              ))}
            </div>
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
