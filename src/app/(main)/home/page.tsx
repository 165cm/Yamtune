"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/stores/auth-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function HomePage() {
  const router = useRouter()
  const { user, setUser, isLoading, setIsLoading } = useAuthStore()
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setIsLoading(false)

      if (!user) {
        router.push("/login")
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

        <Card>
          <CardHeader>
            <CardTitle>ようこそ！</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              {user?.email} としてログインしています
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <Button
                className="h-24"
                onClick={() => router.push("/scan")}
              >
                商品をスキャン
              </Button>
              <Button
                className="h-24"
                variant="outline"
                onClick={() => router.push("/recipes")}
              >
                レシピを見る
              </Button>
              <Button
                className="h-24"
                variant="outline"
                onClick={() => router.push("/family")}
              >
                家族管理
              </Button>
              <Button
                className="h-24"
                variant="outline"
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
