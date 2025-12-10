import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id: recipeId } = await params

  // ユーザー認証チェック
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // レシピ基本情報を取得
  const { data: recipe, error: recipeError } = await (supabase as any)
    .from("recipes")
    .select("*")
    .eq("id", recipeId)
    .single()

  if (recipeError) {
    console.error("Error fetching recipe:", recipeError)
    return NextResponse.json(
      { error: "Failed to fetch recipe" },
      { status: 500 }
    )
  }

  // 材料を取得
  const { data: ingredients, error: ingredientsError } = await (
    supabase as any
  )
    .from("recipe_ingredients")
    .select("*")
    .eq("recipe_id", recipeId)
    .order("order_index")

  if (ingredientsError) {
    console.error("Error fetching ingredients:", ingredientsError)
  }

  // 手順を取得
  const { data: steps, error: stepsError } = await (supabase as any)
    .from("recipe_steps")
    .select("*")
    .eq("recipe_id", recipeId)
    .order("step_number")

  if (stepsError) {
    console.error("Error fetching steps:", stepsError)
  }

  // お気に入り状態を取得
  const { data: userRecipe } = await (supabase as any)
    .from("user_recipes")
    .select("is_favorite")
    .eq("user_id", user.id)
    .eq("recipe_id", recipeId)
    .single()

  const isFavorite = userRecipe?.is_favorite || false

  return NextResponse.json({
    recipe: {
      ...recipe,
      ingredients: ingredients || [],
      steps: steps || [],
      isFavorite,
    },
  })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id: recipeId } = await params

  // ユーザー認証チェック
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const body = await request.json()

  // 画像更新の場合
  if (body.image_url !== undefined) {
    const { error } = await (supabase as any)
      .from("recipes")
      .update({
        image_url: body.image_url,
        updated_at: new Date().toISOString()
      })
      .eq("id", recipeId)
      .eq("user_id", user.id)

    if (error) {
      console.error("Error updating recipe image:", error)
      return NextResponse.json(
        { error: "Failed to update recipe image" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, image_url: body.image_url })
  }

  // お気に入り更新の場合
  if (body.isFavorite !== undefined) {
    const { error } = await (supabase as any)
      .from("user_recipes")
      .upsert(
        {
          user_id: user.id,
          recipe_id: recipeId,
          is_favorite: body.isFavorite,
        },
        {
          onConflict: "user_id,recipe_id",
        }
      )

    if (error) {
      console.error("Error updating favorite status:", error)
      return NextResponse.json(
        { error: "Failed to update favorite status" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, isFavorite: body.isFavorite })
  }

  return NextResponse.json({ error: "No valid update field provided" }, { status: 400 })
}
