import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

// 調味料ストック一覧を取得
export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: pantryItems, error } = await (supabase as any)
      .from("user_pantry")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching pantry:", error)
      return NextResponse.json(
        { error: "Failed to fetch pantry items" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      items: pantryItems?.map((item: any) => item.item_name) || [],
    })
  } catch (error) {
    console.error("Pantry GET error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// 調味料ストックを更新（全置換）
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { items } = await request.json()

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: "Items must be an array" },
        { status: 400 }
      )
    }

    // 既存のアイテムを削除
    await (supabase as any)
      .from("user_pantry")
      .delete()
      .eq("user_id", user.id)

    // 新しいアイテムを追加
    if (items.length > 0) {
      const newItems = items.map((itemName: string) => ({
        user_id: user.id,
        item_name: itemName,
      }))

      const { error } = await (supabase as any)
        .from("user_pantry")
        .insert(newItems)

      if (error) {
        console.error("Error inserting pantry items:", error)
        return NextResponse.json(
          { error: "Failed to update pantry items" },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ success: true, items })
  } catch (error) {
    console.error("Pantry PUT error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
