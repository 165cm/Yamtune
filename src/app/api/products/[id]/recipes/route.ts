import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

// 商品を使用したレシピを取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: productId } = await params

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // この商品を材料として使用しているレシピを取得
    const { data: ingredients, error: ingredientsError } = await (supabase as any)
      .from("recipe_ingredients")
      .select("recipe_id")
      .eq("product_id", productId)

    if (ingredientsError) {
      console.error("Error fetching ingredients:", ingredientsError)
      return NextResponse.json({ recipes: [] })
    }

    if (!ingredients || ingredients.length === 0) {
      // product_idでマッチしない場合、商品名で検索
      const { data: product } = await (supabase as any)
        .from("products")
        .select("name, food_name")
        .eq("id", productId)
        .single()

      if (product) {
        // 商品名またはfood_nameを含む材料を持つレシピを検索
        const searchTerms = [product.name, product.food_name].filter(Boolean)

        // まずユーザーのレシピIDを取得
        const { data: userRecipes } = await (supabase as any)
          .from("user_recipes")
          .select("recipe_id")
          .eq("user_id", user.id)

        if (userRecipes && userRecipes.length > 0) {
          const recipeIds = userRecipes.map((ur: any) => ur.recipe_id)

          // 材料名で検索
          let matchedRecipeIds: string[] = []
          for (const term of searchTerms) {
            if (term) {
              const { data: matchedIngredients } = await (supabase as any)
                .from("recipe_ingredients")
                .select("recipe_id")
                .in("recipe_id", recipeIds)
                .ilike("name", `%${term}%`)

              if (matchedIngredients) {
                matchedRecipeIds.push(...matchedIngredients.map((i: any) => i.recipe_id))
              }
            }
          }

          // 重複を除去
          const uniqueRecipeIds = [...new Set(matchedRecipeIds)]

          if (uniqueRecipeIds.length > 0) {
            const { data: recipes } = await (supabase as any)
              .from("recipes")
              .select("id, title, description, servings, cooking_time, difficulty, image_url")
              .in("id", uniqueRecipeIds)
              .order("created_at", { ascending: false })
              .limit(5)

            return NextResponse.json({ recipes: recipes || [] })
          }
        }
      }

      return NextResponse.json({ recipes: [] })
    }

    const recipeIds = [...new Set(ingredients.map((i: any) => i.recipe_id))]

    // ユーザーが所有するレシピのみを取得
    const { data: userRecipes } = await (supabase as any)
      .from("user_recipes")
      .select("recipe_id")
      .eq("user_id", user.id)
      .in("recipe_id", recipeIds)

    if (!userRecipes || userRecipes.length === 0) {
      return NextResponse.json({ recipes: [] })
    }

    const userRecipeIds = userRecipes.map((ur: any) => ur.recipe_id)

    // レシピ詳細を取得
    const { data: recipes, error: recipesError } = await (supabase as any)
      .from("recipes")
      .select("id, title, description, servings, cooking_time, difficulty, image_url")
      .in("id", userRecipeIds)
      .order("created_at", { ascending: false })
      .limit(5)

    if (recipesError) {
      console.error("Error fetching recipes:", recipesError)
      return NextResponse.json({ recipes: [] })
    }

    return NextResponse.json({ recipes: recipes || [] })
  } catch (error) {
    console.error("Get product recipes error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
