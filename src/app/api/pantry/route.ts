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
      // テーブルが存在しない場合は空配列を返す
      if (error.code === "42P01" || error.message?.includes("does not exist")) {
        console.log("user_pantry table does not exist yet")
        return NextResponse.json({ items: [] })
      }
      console.error("Error fetching pantry:", error)
      return NextResponse.json({ items: [] })
    }

    return NextResponse.json({
      items: pantryItems?.map((item: any) => item.item_name) || [],
    })
  } catch (error) {
    console.error("Pantry GET error:", error)
    return NextResponse.json({ items: [] })
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
    const { error: deleteError } = await (supabase as any)
      .from("user_pantry")
      .delete()
      .eq("user_id", user.id)

    if (deleteError) {
      // テーブルが存在しない場合のエラー
      if (deleteError.code === "42P01" || deleteError.message?.includes("does not exist")) {
        return NextResponse.json(
          { error: "調味料ストック機能を使用するには、データベースのマイグレーションが必要です。supabase/migrations/004_create_pantry_table.sql を実行してください。" },
          { status: 500 }
        )
      }
    }

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
          { error: "調味料ストック機能を使用するには、データベースのマイグレーションが必要です。" },
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
