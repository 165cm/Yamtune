import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getPresetById, getPresetByAge, calculateAge, getDefaultGoals, type NutritionGoals } from "@/lib/nutrition-presets"

export const dynamic = "force-dynamic"

// 家族全員の合計栄養目標を取得
export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // ユーザーの家族を取得
    const { data: families } = await (supabase as any)
      .from("families")
      .select("id")
      .eq("user_id", user.id)
      .limit(1)

    if (!families || families.length === 0) {
      // 家族がない場合はデフォルト値を返す
      return NextResponse.json({
        goals: getDefaultGoals(),
        members: [],
        memberCount: 0,
      })
    }

    const familyId = (families[0] as any).id

    // 家族メンバーを取得
    const { data: members } = await (supabase as any)
      .from("members")
      .select("id, name, birth_date, nutrition_preset_id")
      .eq("family_id", familyId)

    if (!members || members.length === 0) {
      // メンバーがいない場合はデフォルト値を返す
      return NextResponse.json({
        goals: getDefaultGoals(),
        members: [],
        memberCount: 0,
      })
    }

    // 各メンバーの栄養目標を計算して合計
    interface MemberData {
      id: string
      name: string
      birth_date: string
      nutrition_preset_id?: string
    }

    const memberGoals = (members as MemberData[]).map((member) => {
      const age = calculateAge(member.birth_date)
      const preset = member.nutrition_preset_id
        ? getPresetById(member.nutrition_preset_id)
        : getPresetByAge(age)

      return {
        id: member.id,
        name: member.name,
        age,
        preset: preset ? {
          id: preset.id,
          label: preset.label,
          emoji: preset.emoji,
        } : null,
        goals: preset?.goals || getDefaultGoals(),
      }
    })

    // 合計を計算
    const totalGoals: NutritionGoals = {
      protein: 0,
      iron: 0,
      calcium: 0,
      vitaminA: 0,
      vitaminC: 0,
      fiber: 0,
    }

    memberGoals.forEach((m) => {
      totalGoals.protein += m.goals.protein
      totalGoals.iron += m.goals.iron
      totalGoals.calcium += m.goals.calcium
      totalGoals.vitaminA += m.goals.vitaminA
      totalGoals.vitaminC += m.goals.vitaminC
      totalGoals.fiber += m.goals.fiber
    })

    return NextResponse.json({
      goals: totalGoals,
      members: memberGoals,
      memberCount: members.length,
    })
  } catch (error) {
    console.error("Error calculating family nutrition goals:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
