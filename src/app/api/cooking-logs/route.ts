import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const supabase = await createClient()

  // ユーザー認証チェック
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // URLパラメータからrecipeIdを取得
    const { searchParams } = new URL(request.url)
    const recipeId = searchParams.get("recipeId")

    let query = (supabase as any)
      .from("cooking_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("cooked_at", { ascending: false })

    // recipeIdが指定されている場合はフィルタ
    if (recipeId) {
      query = query.eq("recipe_id", recipeId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching cooking logs:", error)
      return NextResponse.json(
        { error: "Failed to fetch cooking logs" },
        { status: 500 }
      )
    }

    return NextResponse.json({ logs: data })
  } catch (error) {
    console.error("Error in GET cooking logs:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const supabase = await createClient()

  // ユーザー認証チェック
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { recipeId, cookedAt, imageUrl, notes, rating } =
      await request.json()

    if (!recipeId) {
      return NextResponse.json(
        { error: "Recipe ID is required" },
        { status: 400 }
      )
    }

    // 調理記録を保存
    const { data: log, error: logError } = await (supabase as any)
      .from("cooking_logs")
      .insert({
        user_id: user.id,
        recipe_id: recipeId,
        cooked_at: cookedAt || new Date().toISOString(),
        image_url: imageUrl,
        notes,
        rating,
      })
      .select()
      .single()

    if (logError) {
      console.error("Error creating cooking log:", logError)
      return NextResponse.json(
        { error: "Failed to create cooking log" },
        { status: 500 }
      )
    }

    // user_recipesのcooked_countとlast_cooked_atを更新
    const { data: userRecipe } = await (supabase as any)
      .from("user_recipes")
      .select("cooked_count")
      .eq("user_id", user.id)
      .eq("recipe_id", recipeId)
      .single()

    if (userRecipe) {
      await (supabase as any)
        .from("user_recipes")
        .update({
          cooked_count: (userRecipe.cooked_count || 0) + 1,
          last_cooked_at: cookedAt || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .eq("recipe_id", recipeId)
    }

    return NextResponse.json({ log })
  } catch (error) {
    console.error("Error in POST cooking log:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
