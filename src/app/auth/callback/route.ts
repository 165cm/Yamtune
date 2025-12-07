import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Check if user has completed onboarding
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    // Check if user has a family (completed onboarding)
    const { data: families } = await supabase
      .from("families")
      .select("*")
      .eq("owner_id", user.id)
      .limit(1)

    if (families && families.length > 0) {
      // User has completed onboarding, go to home
      return NextResponse.redirect(`${origin}/home`)
    } else {
      // User hasn't completed onboarding
      return NextResponse.redirect(`${origin}/onboarding`)
    }
  }

  // If no user, redirect to login
  return NextResponse.redirect(`${origin}/login`)
}
