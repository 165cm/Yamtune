"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/stores/auth-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, User, LogOut, Trash2, Users, ChefHat, ShoppingBag } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function SettingsPage() {
  const router = useRouter()
  const { user, setUser } = useAuthStore()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [stats, setStats] = useState({
    recipeCount: 0,
    productCount: 0,
    memberCount: 0,
  })

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
        return
      }
      setUser(user)
      await loadStats()
      setIsLoading(false)
    }

    checkAuth()
  }, [router, setUser, supabase])

  const loadStats = async () => {
    try {
      // Load recipe count
      const recipeRes = await fetch("/api/recipes")
      if (recipeRes.ok) {
        const data = await recipeRes.json()
        setStats(prev => ({ ...prev, recipeCount: data.recipes?.length || 0 }))
      }

      // Load product count
      const productRes = await fetch("/api/products")
      if (productRes.ok) {
        const products = await productRes.json()
        setStats(prev => ({ ...prev, productCount: products?.length || 0 }))
      }

      // Load member count
      const familyRes = await fetch("/api/families")
      if (familyRes.ok) {
        const families = await familyRes.json()
        if (families.length > 0) {
          const memberRes = await fetch(`/api/members?family_id=${families[0].id}`)
          if (memberRes.ok) {
            const members = await memberRes.json()
            setStats(prev => ({ ...prev, memberCount: members?.length || 0 }))
          }
        }
      }
    } catch (error) {
      console.error("Failed to load stats:", error)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  const handleDeleteAccount = async () => {
    // Note: Supabase doesn't provide a direct method to delete user accounts
    // This would typically require a server-side function or edge function
    setIsDeleting(true)
    try {
      // For now, just log out the user
      // In production, you'd want to call a server-side function to delete the account
      await supabase.auth.signOut()
      router.push("/login")
    } catch (error) {
      console.error("Failed to delete account:", error)
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
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
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/home")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-bold">設定</h1>
        </div>

        {/* アカウント情報 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              アカウント情報
            </CardTitle>
            <CardDescription>
              ログイン中のアカウント情報
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">メールアドレス</label>
              <p className="text-lg">{user?.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">ユーザーID</label>
              <p className="text-sm text-muted-foreground font-mono">{user?.id}</p>
            </div>
          </CardContent>
        </Card>

        {/* 利用状況 */}
        <Card>
          <CardHeader>
            <CardTitle>利用状況</CardTitle>
            <CardDescription>
              あなたのYamtuneの利用状況
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-green-50 rounded-lg">
                <ChefHat className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <p className="text-2xl font-bold text-green-700">{stats.recipeCount}</p>
                <p className="text-sm text-muted-foreground">レシピ</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <p className="text-2xl font-bold text-blue-700">{stats.productCount}</p>
                <p className="text-sm text-muted-foreground">商品</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <Users className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                <p className="text-2xl font-bold text-purple-700">{stats.memberCount}</p>
                <p className="text-sm text-muted-foreground">メンバー</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* アクション */}
        <Card>
          <CardHeader>
            <CardTitle>アクション</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              ログアウト
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start text-destructive hover:text-destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              アカウントを削除
            </Button>
          </CardContent>
        </Card>

        {/* バージョン情報 */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Yamtune v1.0.0</p>
          <p className="mt-1">子供の好き嫌いを克服するレシピ提案アプリ</p>
        </div>
      </div>

      {/* アカウント削除確認ダイアログ */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>アカウントを削除</DialogTitle>
            <DialogDescription>
              本当にアカウントを削除しますか？すべてのデータが削除され、この操作は取り消せません。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isDeleting}
            >
              {isDeleting ? "削除中..." : "削除する"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
