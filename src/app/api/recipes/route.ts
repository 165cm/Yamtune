import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const supabase = await createClient()

  // ユーザー認証チェック
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // URLパラメータからフィルタを取得
  const { searchParams } = new URL(request.url)
  const onlyFavorites = searchParams.get("favorites") === "true"

  // レシピ一覧を取得（user_recipesテーブルを通じてユーザーのレシピを取得）
  let query = (supabase as any)
    .from("user_recipes")
    .select(
      `
      recipe_id,
      is_favorite,
      created_at,
      recipes (
        id,
        title,
        description,
        servings,
        cooking_time_minutes,
        difficulty,
        total_nutrition,
        created_at
      )
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  // お気に入りのみフィルタ
  if (onlyFavorites) {
    query = query.eq("is_favorite", true)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching recipes:", error)
    return NextResponse.json(
      { error: "Failed to fetch recipes" },
      { status: 500 }
    )
  }

  // データを整形
  const recipes = data.map((item: any) => ({
    ...item.recipes,
    isFavorite: item.is_favorite,
  }))

  return NextResponse.json({ recipes })
}
