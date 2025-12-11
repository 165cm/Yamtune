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
      const nutrition = plan.recipes.nutrition
      totals.protein += nutrition.protein || 0
      totals.iron += nutrition.iron || 0
      totals.calcium += nutrition.calcium || 0
      totals.vitaminA += nutrition.vitamin_a || nutrition.vitaminA || 0
      totals.vitaminC += nutrition.vitamin_c || nutrition.vitaminC || 0
      totals.fiber += nutrition.fiber || nutrition.dietary_fiber || 0
      totals.energy += nutrition.energy || nutrition.calories || 0
      totals.fat += nutrition.fat || 0
      totals.carbs += nutrition.carbs || nutrition.carbohydrates || 0
    }
  })

  return NextResponse.json({
    weeklyNutrition: totals,
    completedMeals: mealPlans?.length || 0,
  })
}
