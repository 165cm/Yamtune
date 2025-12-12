import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getDefaultGoals } from "@/lib/nutrition-presets"

export const dynamic = "force-dynamic"

// デフォルト目標をプリセットから取得
const DEFAULT_DAILY_GOALS = getDefaultGoals()

// 栄養目標を取得
export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // ユーザーの栄養目標を取得
  const { data: settings } = await (supabase as any)
    .from("user_settings")
    .select("nutrition_goals")
    .eq("user_id", user.id)
    .single()

  // カスタム設定があればそれを、なければデフォルトを返す
  const goals = settings?.nutrition_goals || DEFAULT_DAILY_GOALS

  return NextResponse.json({
    goals,
    isCustom: !!settings?.nutrition_goals,
  })
}

// 栄養目標を保存
export async function PUT(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { goals } = await request.json()

  // user_settingsテーブルにupsert
  const { error } = await (supabase as any)
    .from("user_settings")
    .upsert(
      {
        user_id: user.id,
        nutrition_goals: goals,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      }
    )

  if (error) {
    console.error("Error saving nutrition goals:", error)
    // テーブルが存在しない場合はlocalStorageにフォールバック
    return NextResponse.json({
      success: true,
      goals,
      fallback: true,
    })
  }

  return NextResponse.json({
    success: true,
    goals,
  })
}

// デフォルトにリセット
export async function DELETE() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // nutrition_goalsをnullにリセット
  await (supabase as any)
    .from("user_settings")
    .update({ nutrition_goals: null })
    .eq("user_id", user.id)

  return NextResponse.json({
    success: true,
    goals: DEFAULT_DAILY_GOALS,
  })
}
