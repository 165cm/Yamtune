import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// ユーザーのレシピ一覧を取得
export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // ユーザーのレシピを取得（材料と手順も含む）
    const { data: recipes, error } = await (supabase as any)
      .from("recipes")
      .select(
        `
        *,
        recipe_ingredients(*),
        recipe_steps(*)
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Fetch recipes error:", error)
      return NextResponse.json(
        { error: "Failed to fetch recipes" },
        { status: 500 }
      )
    }

    return NextResponse.json(recipes)
  } catch (error) {
    console.error("Get recipes error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
