import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

// レシピを一括削除
export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { recipeIds } = await request.json()

  if (!recipeIds || !Array.isArray(recipeIds) || recipeIds.length === 0) {
    return NextResponse.json(
      { error: "recipeIds is required" },
      { status: 400 }
    )
  }

  // ユーザーが所有するレシピのみ削除できるよう確認
  const { data: ownedRecipes, error: checkError } = await (supabase as any)
    .from("recipes")
    .select("id")
    .eq("user_id", user.id)
    .in("id", recipeIds)

  if (checkError) {
    console.error("Error checking recipe ownership:", checkError)
    return NextResponse.json(
      { error: "Failed to verify recipe ownership" },
      { status: 500 }
    )
  }

  const ownedRecipeIds = ownedRecipes?.map((r: any) => r.id) || []

  if (ownedRecipeIds.length === 0) {
    return NextResponse.json(
      { error: "No valid recipes to delete" },
      { status: 400 }
    )
  }

  // 関連データを削除（外部キー制約があるため順番に削除）
  // 1. recipe_ingredients
  const { error: ingredientsError } = await (supabase as any)
    .from("recipe_ingredients")
    .delete()
    .in("recipe_id", ownedRecipeIds)

  if (ingredientsError) {
    console.error("Error deleting ingredients:", ingredientsError)
  }

  // 2. recipe_steps
  const { error: stepsError } = await (supabase as any)
    .from("recipe_steps")
    .delete()
    .in("recipe_id", ownedRecipeIds)

  if (stepsError) {
    console.error("Error deleting steps:", stepsError)
  }

  // 3. user_recipes
  const { error: userRecipesError } = await (supabase as any)
    .from("user_recipes")
    .delete()
    .in("recipe_id", ownedRecipeIds)

  if (userRecipesError) {
    console.error("Error deleting user_recipes:", userRecipesError)
  }

  // 4. meal_plans（献立からも削除）
  const { error: mealPlansError } = await (supabase as any)
    .from("meal_plans")
    .delete()
    .in("recipe_id", ownedRecipeIds)

  if (mealPlansError) {
    console.error("Error deleting meal_plans:", mealPlansError)
  }

  // 5. recipes本体を削除
  const { error: deleteError } = await (supabase as any)
    .from("recipes")
    .delete()
    .in("id", ownedRecipeIds)

  if (deleteError) {
    console.error("Error deleting recipes:", deleteError)
    return NextResponse.json(
      { error: "Failed to delete recipes" },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    deletedCount: ownedRecipeIds.length,
  })
}
