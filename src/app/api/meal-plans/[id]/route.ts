import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

// 献立を更新（完了マークなど）
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { isCompleted, recipeId, memo } = body

  // 更新するフィールドを構築
  const updateFields: any = {}
  if (typeof isCompleted === "boolean") {
    updateFields.is_completed = isCompleted
  }
  if (recipeId !== undefined) {
    updateFields.recipe_id = recipeId || null
  }
  if (memo !== undefined) {
    updateFields.memo = memo || null
  }

  const { data, error } = await (supabase as any)
    .from("meal_plans")
    .update(updateFields)
    .eq("id", id)
    .eq("user_id", user.id)
    .select(`
      id,
      planned_date,
      meal_type,
      is_completed,
      memo,
      recipes (
        id,
        title,
        description,
        servings,
        cooking_time,
        difficulty,
        image_url
      )
    `)
    .single()

  if (error) {
    console.error("Error updating meal plan:", error)
    return NextResponse.json(
      { error: "Failed to update meal plan" },
      { status: 500 }
    )
  }

  return NextResponse.json({
    id: data.id,
    plannedDate: data.planned_date,
    mealType: data.meal_type,
    isCompleted: data.is_completed,
    memo: data.memo,
    recipe: data.recipes,
  })
}

// 献立を削除
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { error } = await (supabase as any)
    .from("meal_plans")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) {
    console.error("Error deleting meal plan:", error)
    return NextResponse.json(
      { error: "Failed to delete meal plan" },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
