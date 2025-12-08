import { createClient } from "@/lib/supabase/server"
import { klingAI } from "@/lib/services/kling-ai"
import { NextResponse } from "next/server"

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
    const { recipeId } = await request.json()

    if (!recipeId) {
      return NextResponse.json(
        { error: "Recipe ID is required" },
        { status: 400 }
      )
    }

    // Kling AIが設定されているかチェック
    if (!klingAI.isConfigured()) {
      return NextResponse.json(
        { error: "Kling AI is not configured" },
        { status: 503 }
      )
    }

    // レシピ情報を取得
    const { data: recipe, error: recipeError } = await (supabase as any)
      .from("recipes")
      .select("*")
      .eq("id", recipeId)
      .eq("user_id", user.id)
      .single()

    if (recipeError || !recipe) {
      return NextResponse.json(
        { error: "Recipe not found" },
        { status: 404 }
      )
    }

    // 材料を取得
    const { data: ingredients } = await (supabase as any)
      .from("recipe_ingredients")
      .select("name")
      .eq("recipe_id", recipeId)
      .order("order_index")

    const ingredientNames = ingredients
      ? ingredients.map((ing: any) => ing.name)
      : []

    // Kling AIで画像を生成
    console.log("Generating image for recipe:", recipe.title)
    const imageUrl = await klingAI.generateRecipeImage(
      recipe.title,
      recipe.description || "",
      ingredientNames
    )

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Failed to generate image" },
        { status: 500 }
      )
    }

    // レシピに画像URLを保存
    const { error: updateError } = await (supabase as any)
      .from("recipes")
      .update({
        image_url: imageUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", recipeId)
      .eq("user_id", user.id)

    if (updateError) {
      console.error("Failed to update recipe with image URL:", updateError)
      // エラーでも画像URLは返す
    }

    return NextResponse.json({ imageUrl })
  } catch (error) {
    console.error("Error generating image:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
