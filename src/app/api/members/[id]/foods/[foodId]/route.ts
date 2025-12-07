import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; foodId: string }> }
) {
  try {
    const { id, foodId } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify member belongs to user's family
    const { data: member } = await supabase
      .from("members")
      .select("*, families!inner(*)")
      .eq("id", id)
      .single()

    if (!member || ((member as any).families as any).owner_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { error } = await supabase
      .from("member_foods")
      .delete()
      .eq("id", foodId)
      .eq("member_id", id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
