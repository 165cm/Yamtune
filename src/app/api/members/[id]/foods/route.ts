import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { food_name, category, severity, notes } = body

    if (!food_name || !category) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
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

    const { data: memberFood, error } = await supabase
      .from("member_foods")
      .insert({
        member_id: id,
        food_name,
        category,
        severity,
        notes,
      } as any)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(memberFood, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
