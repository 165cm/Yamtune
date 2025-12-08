import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

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
    const { data: family, error: familyError } = await supabase
      .from("families")
      .select("*")
      .eq("id", familyId)
      .eq("user_id", user.id)
      .single()

    console.log("=== MEMBERS GET DEBUG ===")
    console.log("user.id:", user.id)
    console.log("familyId from query:", familyId)
    console.log("family query result:", family)
    console.log("family query error:", familyError)
    console.log("=========================")

    if (!family) {
      return NextResponse.json({
        error: "Forbidden",
        debug: {
          user_id: user.id,
          family_id: familyId,
          familyError: familyError?.message
        }
      }, { status: 403 })
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
    const { data: family, error: familyError } = await supabase
      .from("families")
      .select("*")
      .eq("id", family_id)
      .eq("user_id", user.id)
      .single()

    console.log("=== MEMBERS POST DEBUG ===")
    console.log("user.id:", user.id)
    console.log("family_id from request:", family_id)
    console.log("family query result:", family)
    console.log("family query error:", familyError)

    // Also try without user_id filter to see what's in DB
    const { data: anyFamily } = await supabase
      .from("families")
      .select("*")
      .eq("id", family_id)
      .single()
    console.log("family without user_id filter:", anyFamily)
    console.log("=========================")

    if (!family) {
      return NextResponse.json({
        error: "Forbidden",
        debug: {
          user_id: user.id,
          family_id: family_id,
          familyError: familyError?.message,
          anyFamily: anyFamily
        }
      }, { status: 403 })
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
