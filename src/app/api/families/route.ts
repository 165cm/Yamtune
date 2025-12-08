import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: families, error } = await (supabase as any)
      .from("families")
      .select("*")
      .eq("user_id", user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(families)
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

    console.log("Family creation - User:", user?.id)
    console.log("Family creation - Auth error:", authError)

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name } = body

    console.log("Family creation - Name:", name)

    if (!name) {
      return NextResponse.json(
        { error: "Family name is required" },
        { status: 400 }
      )
    }

    // Check if family already exists for this user
    const { data: existingFamily, error: checkError } = await (supabase as any)
      .from("families")
      .select("*")
      .eq("user_id", user.id)
      .single()

    console.log("Existing family check:", existingFamily, checkError)

    // If family already exists, return it
    if (existingFamily && !checkError) {
      console.log("Family already exists, returning existing:", existingFamily.id)
      return NextResponse.json(existingFamily, { status: 200 })
    }

    // Create family
    const { data: family, error } = await (supabase as any)
      .from("families")
      .insert({
        user_id: user.id,
        name: name,
      })
      .select()
      .single()

    console.log("Family creation result:", family)
    console.log("Family creation error:", error)

    if (error) {
      console.error("Family creation failed:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(family, { status: 201 })
  } catch (error) {
    console.error("Family creation exception:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
