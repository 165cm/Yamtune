import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const familyId = searchParams.get("family_id")

    if (!familyId) {
      return NextResponse.json(
        { error: "family_id is required" },
        { status: 400 }
      )
    }

    // Verify family ownership
    const { data: family } = await supabase
      .from("families")
      .select("*")
      .eq("id", familyId)
      .eq("user_id", user.id)
      .single()

    if (!family) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { data: members, error } = await supabase
      .from("members")
      .select("*")
      .eq("family_id", familyId)
      .order("created_at", { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(members)
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { family_id, name, birth_date, avatar_url } = body

    if (!family_id || !name || !birth_date) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Verify family ownership
    const { data: family } = await supabase
      .from("families")
      .select("*")
      .eq("id", family_id)
      .eq("user_id", user.id)
      .single()

    if (!family) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { data: member, error } = await supabase
      .from("members")
      .insert({
        family_id,
        name,
        birth_date,
        avatar_url,
      } as any)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
