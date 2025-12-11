import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

// 献立一覧を取得（週単位）
export async function GET(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // URLパラメータから日付範囲を取得
  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get("start_date")
  const endDate = searchParams.get("end_date")

  if (!startDate || !endDate) {
    return NextResponse.json(
      { error: "start_date and end_date are required" },
      { status: 400 }
    )
  }

  // 献立を取得（レシピ情報も含む）
  const { data, error } = await (supabase as any)
    .from("meal_plans")
    .select(`
      id,
      planned_date,
      meal_type,
      is_completed,
      memo,
      created_at,
      recipes (
        id,
        title,
        description,
        servings,
        cooking_time,
        difficulty,
        image_url
      )
    `)
    .eq("user_id", user.id)
    .gte("planned_date", startDate)
    .lte("planned_date", endDate)
    .order("planned_date", { ascending: true })

  if (error) {
    console.error("Error fetching meal plans:", error)
    return NextResponse.json(
      { error: "Failed to fetch meal plans" },
      { status: 500 }
    )
  }

  // データを整形
  const mealPlans = data.map((item: any) => ({
    id: item.id,
    plannedDate: item.planned_date,
    mealType: item.meal_type,
    isCompleted: item.is_completed,
    memo: item.memo,
    recipe: item.recipes,
    createdAt: item.created_at,
  }))

  return NextResponse.json({ mealPlans })
}

// 献立を追加
export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { recipeId, plannedDate, mealType, memo } = body

  if (!plannedDate || !mealType) {
    return NextResponse.json(
      { error: "plannedDate and mealType are required" },
      { status: 400 }
    )
  }

  // 既存の献立を確認（同じ日・同じ食事タイプ）
  const { data: existing } = await (supabase as any)
    .from("meal_plans")
    .select("id")
    .eq("user_id", user.id)
    .eq("planned_date", plannedDate)
    .eq("meal_type", mealType)
    .single()

  if (existing) {
    // 既存の献立を更新
    const { data, error } = await (supabase as any)
      .from("meal_plans")
      .update({
        recipe_id: recipeId || null,
        memo: memo || null,
      })
      .eq("id", existing.id)
      .select(`
        id,
        planned_date,
        meal_type,
        is_completed,
        memo,
        recipes (
          id,
          title,
          description,
          servings,
          cooking_time,
          difficulty,
          image_url
        )
      `)
      .single()

    if (error) {
      console.error("Error updating meal plan:", error)
      return NextResponse.json(
        { error: "Failed to update meal plan" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      id: data.id,
      plannedDate: data.planned_date,
      mealType: data.meal_type,
      isCompleted: data.is_completed,
      memo: data.memo,
      recipe: data.recipes,
    })
  }

  // 新規作成
  const { data, error } = await (supabase as any)
    .from("meal_plans")
    .insert({
      user_id: user.id,
      recipe_id: recipeId || null,
      planned_date: plannedDate,
      meal_type: mealType,
      memo: memo || null,
    })
    .select(`
      id,
      planned_date,
      meal_type,
      is_completed,
      memo,
      recipes (
        id,
        title,
        description,
        servings,
        cooking_time,
        difficulty,
        image_url
      )
    `)
    .single()

  if (error) {
    console.error("Error creating meal plan:", error)
    return NextResponse.json(
      { error: "Failed to create meal plan" },
      { status: 500 }
    )
  }

  return NextResponse.json({
    id: data.id,
    plannedDate: data.planned_date,
    mealType: data.meal_type,
    isCompleted: data.is_completed,
    memo: data.memo,
    recipe: data.recipes,
  })
}
