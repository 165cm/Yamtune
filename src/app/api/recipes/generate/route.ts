import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // ユーザー認証チェック
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { productIds, servings = 2, preferences } = await request.json()

    if (!productIds || productIds.length === 0) {
      return NextResponse.json(
        { error: "少なくとも1つの商品を選択してください" },
        { status: 400 }
      )
    }

    console.log("Generating recipe for user:", user.id)
    console.log("Product IDs:", productIds)

    // 選択された商品を取得
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("*")
      .in("id", productIds)

    if (productsError) {
      console.error("Products fetch error:", productsError)
      return NextResponse.json(
        { error: "商品の取得に失敗しました" },
        { status: 500 }
      )
    }

    // 家族メンバーの好き嫌い情報を取得
    const { data: familyData } = await (supabase as any)
      .from("families")
      .select("*")
      .eq("user_id", user.id)
      .single()

    let memberPreferences: any[] = []
    if (familyData) {
      const { data: members } = await (supabase as any)
        .from("members")
        .select("*, member_foods(*)")
        .eq("family_id", familyData.id)

      if (members) {
        memberPreferences = members
      }
    }

    // OpenAI APIでレシピ生成
    const openaiApiKey = process.env.OPENAI_API_KEY
    if (!openaiApiKey) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      )
    }

    // プロンプト構築
    const productsInfo = products.map((p: any) => ({
      name: p.name,
      category: p.category,
      nutrition: p.nutrition_per_100g || p.nutrition,
    }))

    const dislikedFoods = memberPreferences.flatMap((member: any) =>
      (member.member_foods || [])
        .filter((food: any) => food.status === "dislike")
        .map((food: any) => food.food_name)
    )

    const prompt = `以下の食材を使って、栄養バランスの良い${servings}人分のレシピを1つ提案してください。

【利用可能な食材】
${productsInfo.map((p: any) => `- ${p.name} (${p.category || "カテゴリ不明"})`).join("\n")}

【栄養情報】
${productsInfo.map((p: any) => `${p.name}: ${JSON.stringify(p.nutrition || {})}`).join("\n")}

${dislikedFoods.length > 0 ? `【避けるべき食材】\n${dislikedFoods.join(", ")}` : ""}

【要件】
- 子ども（2〜10歳）が食べやすいレシピ
- 栄養バランスが良い
- 調理時間は30分以内が理想
- 材料は上記の食材を中心に使用（必要に応じて基本的な調味料や野菜は追加可）

以下のJSON形式で返してください：
{
  "title": "レシピ名",
  "description": "レシピの簡単な説明",
  "servings": ${servings},
  "cooking_time": 調理時間（分）,
  "difficulty": "簡単" | "普通" | "難しい",
  "ingredients": [
    {
      "name": "材料名",
      "amount": "分量",
      "notes": "備考（任意、例：みじん切り）"
    }
  ],
  "steps": [
    "手順1の説明",
    "手順2の説明",
    ...
  ],
  "nutrition": {
    "energy_kcal": カロリー（1人分）,
    "protein_g": たんぱく質（g）,
    "fat_g": 脂質（g）,
    "carbohydrate_g": 炭水化物（g）,
    "salt_g": 食塩相当量（g）
  },
  "tips": "調理のコツや栄養のポイント"
}`

    console.log("Calling OpenAI API...")

    const openaiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "あなたは子どもの栄養を考える優秀な栄養士兼料理研究家です。栄養バランスが良く、子どもが喜ぶ美味しいレシピを提案してください。",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          response_format: { type: "json_object" },
          temperature: 0.7,
          max_tokens: 2000,
        }),
      }
    )

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      console.error("OpenAI API error:", errorText)
      return NextResponse.json(
        { error: "レシピ生成に失敗しました" },
        { status: 500 }
      )
    }

    const openaiData = await openaiResponse.json()
    const recipeData = JSON.parse(
      openaiData.choices[0]?.message?.content || "{}"
    )

    console.log("Recipe generated:", recipeData.title)
    console.log("Recipe data from AI:", JSON.stringify(recipeData, null, 2))

    // データベースにレシピを保存（プレースホルダー画像付き）
    const insertData = {
      user_id: user.id,
      title: recipeData.title || "無題のレシピ",
      description: recipeData.description || "",
      servings: recipeData.servings || servings,
      cooking_time: recipeData.cooking_time || null,
      difficulty: recipeData.difficulty || "普通",
      nutrition: recipeData.nutrition || {},
      image_url: "/images/recipe-placeholder.svg", // デフォルトのプレースホルダー画像
    }

    console.log("Inserting recipe with data:", JSON.stringify(insertData, null, 2))

    const { data: recipe, error: recipeError } = await (supabase as any)
      .from("recipes")
      .insert(insertData)
      .select()
      .single()

    console.log("Insert result - recipe:", recipe)
    console.log("Insert result - error:", recipeError)

    if (recipeError || !recipe) {
      console.error("Recipe insert error:", recipeError)
      console.error("Recipe data:", recipe)
      return NextResponse.json(
        { error: `レシピの保存に失敗しました: ${recipeError?.message || "Unknown error"}` },
        { status: 500 }
      )
    }

    console.log("Recipe saved with ID:", recipe.id)

    // 材料を保存（選択された商品とマッチング）
    if (recipeData.ingredients && recipeData.ingredients.length > 0) {
      const ingredients = recipeData.ingredients.map(
        (ingredient: any, index: number) => {
          const ingredientName = ingredient.name.toLowerCase()
          // 選択された商品の中から材料名にマッチするものを探す
          const matchedProduct = (products as any[]).find((p) => {
            const productName = p.name?.toLowerCase() || ""
            const foodName = p.food_name?.toLowerCase() || ""
            return (
              productName.includes(ingredientName) ||
              ingredientName.includes(productName) ||
              (foodName && foodName.includes(ingredientName)) ||
              (foodName && ingredientName.includes(foodName))
            )
          })
          return {
            recipe_id: recipe.id,
            product_id: matchedProduct?.id || null,
            name: ingredient.name,
            amount: ingredient.amount,
            notes: ingredient.notes,
            order_index: index,
          }
        }
      )

      const { error: ingredientsError } = await (supabase as any)
        .from("recipe_ingredients")
        .insert(ingredients)

      if (ingredientsError) {
        console.error("Ingredients insert error:", ingredientsError)
      }
    }

    // 手順を保存
    if (recipeData.steps && recipeData.steps.length > 0) {
      const steps = recipeData.steps.map((step: string, index: number) => ({
        recipe_id: recipe.id,
        step_number: index + 1,
        description: step,
      }))

      const { error: stepsError } = await (supabase as any)
        .from("recipe_steps")
        .insert(steps)

      if (stepsError) {
        console.error("Steps insert error:", stepsError)
      }
    }

    // user_recipesテーブルに関連を作成
    await (supabase as any).from("user_recipes").insert({
      user_id: user.id,
      recipe_id: recipe.id,
    })

    // 完全なレシピデータを取得
    const { data: fullRecipe, error: fullRecipeError } = await (supabase as any)
      .from("recipes")
      .select(
        `
        *,
        recipe_ingredients(*),
        recipe_steps(*)
      `
      )
      .eq("id", recipe.id)
      .single()

    // fullRecipeがnullの場合のエラーハンドリング
    if (fullRecipeError || !fullRecipe) {
      console.error("Failed to fetch full recipe:", fullRecipeError)
      // フォールバック: 最初のinsertで取得したrecipeデータを使用
      return NextResponse.json({
        recipe: {
          ...recipe,
          recipe_ingredients: recipeData.ingredients?.map((ingredient: any, index: number) => ({
            id: `temp-${index}`,
            recipe_id: recipe.id,
            name: ingredient.name,
            amount: ingredient.amount,
            notes: ingredient.notes || null,
            order_index: index,
          })) || [],
          recipe_steps: recipeData.steps?.map((step: string, index: number) => ({
            id: `temp-${index}`,
            recipe_id: recipe.id,
            step_number: index + 1,
            description: step,
          })) || [],
        },
        tips: recipeData.tips,
      })
    }

    return NextResponse.json({
      recipe: fullRecipe,
      tips: recipeData.tips,
    })
  } catch (error) {
    console.error("Generate recipe error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { error: `Internal server error: ${errorMessage}` },
      { status: 500 }
    )
  }
}
