"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/stores/auth-store"
import { toast } from "@/stores/toast-store"
import { pantryPresets } from "@/lib/food-presets"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, User, LogOut, Trash2, Users, ChefHat, ShoppingBag, Loader2, Plus, X, Activity, RotateCcw } from "lucide-react"
import { DEFAULT_DAILY_GOALS } from "@/components/features/nutrition/nutrition-dashboard"
import { Input } from "@/components/ui/input"
import { FullPageLoader } from "@/components/ui/skeleton"
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
  const [pantryItems, setPantryItems] = useState<string[]>([])
  const [isSavingPantry, setIsSavingPantry] = useState(false)
  const [newPantryItem, setNewPantryItem] = useState("")
  const [nutritionGoals, setNutritionGoals] = useState(DEFAULT_DAILY_GOALS)
  const [isSavingGoals, setIsSavingGoals] = useState(false)

  const loadPantryItems = useCallback(async () => {
    try {
      const response = await fetch("/api/pantry")
      if (response.ok) {
        const data = await response.json()
        setPantryItems(data.items || [])
      }
    } catch (error) {
      console.error("Failed to load pantry items:", error)
    }
  }, [])

  const savePantryItems = async (items: string[]) => {
    setIsSavingPantry(true)
    try {
      const response = await fetch("/api/pantry", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      })
      if (response.ok) {
        toast.success("調味料ストックを保存しました")
      } else {
        toast.error("保存に失敗しました")
      }
    } catch (error) {
      console.error("Failed to save pantry items:", error)
      toast.error("保存に失敗しました")
    } finally {
      setIsSavingPantry(false)
    }
  }

  const togglePantryItem = (itemName: string) => {
    const newItems = pantryItems.includes(itemName)
      ? pantryItems.filter((item) => item !== itemName)
      : [...pantryItems, itemName]
    setPantryItems(newItems)
    savePantryItems(newItems)
  }

  const addCustomPantryItem = () => {
    const trimmed = newPantryItem.trim()
    if (!trimmed) return
    if (pantryItems.includes(trimmed)) {
      toast.error("既に登録されています")
      return
    }
    const newItems = [...pantryItems, trimmed]
    setPantryItems(newItems)
    savePantryItems(newItems)
    setNewPantryItem("")
    toast.success(`「${trimmed}」を追加しました`)
  }

  const removePantryItem = (itemName: string) => {
    const newItems = pantryItems.filter((item) => item !== itemName)
    setPantryItems(newItems)
    savePantryItems(newItems)
  }

  const loadNutritionGoals = useCallback(async () => {
    try {
      const response = await fetch("/api/nutrition-goals")
      if (response.ok) {
        const data = await response.json()
        setNutritionGoals(data.goals)
      }
    } catch (error) {
      console.error("Failed to load nutrition goals:", error)
    }
  }, [])

  const saveNutritionGoals = async (goals: typeof DEFAULT_DAILY_GOALS) => {
    setIsSavingGoals(true)
    try {
      const response = await fetch("/api/nutrition-goals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goals }),
      })
      if (response.ok) {
        toast.success("栄養目標を保存しました")
      } else {
        toast.error("保存に失敗しました")
      }
    } catch (error) {
      console.error("Failed to save nutrition goals:", error)
      toast.error("保存に失敗しました")
    } finally {
      setIsSavingGoals(false)
    }
  }

  const resetNutritionGoals = async () => {
    setNutritionGoals(DEFAULT_DAILY_GOALS)
    await saveNutritionGoals(DEFAULT_DAILY_GOALS)
  }

  const updateNutritionGoal = (key: keyof typeof DEFAULT_DAILY_GOALS, value: number) => {
    const newGoals = { ...nutritionGoals, [key]: value }
    setNutritionGoals(newGoals)
  }

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
        return
      }
      setUser(user)
      await Promise.all([loadStats(), loadPantryItems(), loadNutritionGoals()])
      setIsLoading(false)
    }

    checkAuth()
  }, [router, setUser, supabase, loadPantryItems, loadNutritionGoals])

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
    return <FullPageLoader />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-amber-50 p-4">
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

        {/* 調味料ストック */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🏠 うちの調味料ストック
              {isSavingPantry && (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              )}
            </CardTitle>
            <CardDescription>
              いつも家にある調味料を登録してください。レシピ生成時に活用します。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 登録済みの調味料 */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">登録済み（{pantryItems.length}種類）</h4>
              {pantryItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">まだ登録がありません</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {pantryItems.map((item) => (
                    <span
                      key={item}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-50 border border-green-200 text-green-800 rounded-full text-sm group cursor-pointer hover:bg-green-100"
                      onClick={() => removePantryItem(item)}
                    >
                      {item}
                      <X className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* カスタム追加 */}
            <div className="space-y-3 pt-4 border-t">
              <h4 className="text-sm font-medium">調味料を追加</h4>
              <div className="flex gap-2">
                <Input
                  placeholder="調味料名を入力"
                  value={newPantryItem}
                  onChange={(e) => setNewPantryItem(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCustomPantryItem()}
                  className="flex-1"
                />
                <Button
                  onClick={addCustomPantryItem}
                  disabled={!newPantryItem.trim() || isSavingPantry}
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  追加
                </Button>
              </div>
            </div>

            {/* クイック追加（プリセット） */}
            <div className="space-y-3 pt-4 border-t">
              <h4 className="text-sm font-medium">クイック追加</h4>
              {Object.entries(pantryPresets).map(([key, category]) => (
                <div key={key} className="space-y-2">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <span>{category.emoji}</span>
                    {category.label}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {category.items
                      .filter((item) => !pantryItems.includes(item.name))
                      .map((item) => (
                        <Button
                          key={item.name}
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => togglePantryItem(item.name)}
                          disabled={isSavingPantry}
                        >
                          {item.emoji} {item.name}
                        </Button>
                      ))}
                    {category.items.filter((item) => !pantryItems.includes(item.name)).length === 0 && (
                      <span className="text-xs text-muted-foreground">すべて登録済み ✓</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 栄養目標 */}
        <Card id="nutrition-goals">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-600" />
              1日の栄養目標
              {isSavingGoals && (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              )}
            </CardTitle>
            <CardDescription>
              お子様に合わせて栄養目標をカスタマイズできます
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 栄養素入力 */}
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium flex items-center gap-1 mb-1">
                    🥩 たんぱく質（g）
                  </label>
                  <Input
                    type="number"
                    value={nutritionGoals.protein}
                    onChange={(e) => updateNutritionGoal("protein", Number(e.target.value))}
                    onBlur={() => saveNutritionGoals(nutritionGoals)}
                    min={0}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium flex items-center gap-1 mb-1">
                    🩸 鉄分（mg）
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={nutritionGoals.iron}
                    onChange={(e) => updateNutritionGoal("iron", Number(e.target.value))}
                    onBlur={() => saveNutritionGoals(nutritionGoals)}
                    min={0}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium flex items-center gap-1 mb-1">
                    🦴 カルシウム（mg）
                  </label>
                  <Input
                    type="number"
                    value={nutritionGoals.calcium}
                    onChange={(e) => updateNutritionGoal("calcium", Number(e.target.value))}
                    onBlur={() => saveNutritionGoals(nutritionGoals)}
                    min={0}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium flex items-center gap-1 mb-1">
                    👀 ビタミンA（μg）
                  </label>
                  <Input
                    type="number"
                    value={nutritionGoals.vitaminA}
                    onChange={(e) => updateNutritionGoal("vitaminA", Number(e.target.value))}
                    onBlur={() => saveNutritionGoals(nutritionGoals)}
                    min={0}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium flex items-center gap-1 mb-1">
                    🍊 ビタミンC（mg）
                  </label>
                  <Input
                    type="number"
                    value={nutritionGoals.vitaminC}
                    onChange={(e) => updateNutritionGoal("vitaminC", Number(e.target.value))}
                    onBlur={() => saveNutritionGoals(nutritionGoals)}
                    min={0}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium flex items-center gap-1 mb-1">
                    🥬 食物繊維（g）
                  </label>
                  <Input
                    type="number"
                    value={nutritionGoals.fiber}
                    onChange={(e) => updateNutritionGoal("fiber", Number(e.target.value))}
                    onBlur={() => saveNutritionGoals(nutritionGoals)}
                    min={0}
                  />
                </div>
              </div>
            </div>

            {/* リセットボタン */}
            <div className="pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={resetNutritionGoals}
                disabled={isSavingGoals}
                className="w-full"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                デフォルトに戻す
              </Button>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                デフォルト: 6〜7歳児の推奨栄養量（日本人の食事摂取基準）
              </p>
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
