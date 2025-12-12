import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

// 週間の栄養摂取量を取得
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

  // 完了した献立からレシピの栄養情報を取得
  const { data: mealPlans, error } = await (supabase as any)
    .from("meal_plans")
    .select(`
      id,
      is_completed,
      recipes (
        id,
        title,
        nutrition
      )
    `)
    .eq("user_id", user.id)
    .eq("is_completed", true)
    .gte("planned_date", startDate)
    .lte("planned_date", endDate)

  if (error) {
    console.error("Error fetching nutrition data:", error)
    return NextResponse.json(
      { error: "Failed to fetch nutrition data" },
      { status: 500 }
    )
  }

  // 栄養素を集計
  const totals = {
    protein: 0,
    iron: 0,
    calcium: 0,
    vitaminA: 0,
    vitaminC: 0,
    fiber: 0,
    energy: 0,
    fat: 0,
    carbs: 0,
  }

  mealPlans?.forEach((plan: any) => {
    if (plan.recipes?.nutrition) {
      const n = plan.recipes.nutrition
      // 複数のフィールド名パターンに対応
      totals.protein += n.protein_g || n.protein || 0
      totals.iron += n.iron_mg || n.iron || 0
      totals.calcium += n.calcium_mg || n.calcium || 0
      totals.vitaminA += n.vitamin_a_ug || n.vitamin_a || n.vitaminA || 0
      totals.vitaminC += n.vitamin_c_mg || n.vitamin_c || n.vitaminC || 0
      totals.fiber += n.dietary_fiber_g || n.fiber || n.dietary_fiber || 0
      totals.energy += n.energy_kcal || n.energy || n.calories || 0
      totals.fat += n.fat_g || n.fat || 0
      totals.carbs += n.carbohydrate_g || n.carbs || n.carbohydrates || 0
    }
  })

  console.log("Nutrition totals:", totals, "from", mealPlans?.length, "completed meals")

  return NextResponse.json({
    weeklyNutrition: totals,
    completedMeals: mealPlans?.length || 0,
  })
}
