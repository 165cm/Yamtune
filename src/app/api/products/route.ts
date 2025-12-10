import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

// ユーザーの商品一覧を取得
export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // user_productsを通じて商品を取得
    const { data: userProducts, error } = await supabase
      .from("user_products")
      .select("*, products(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Fetch error:", error)
      return NextResponse.json(
        { error: "Failed to fetch products" },
        { status: 500 }
      )
    }

    // productsのみを抽出
    const products = userProducts.map((up: any) => up.products)

    return NextResponse.json(products)
  } catch (error) {
    console.error("Get products error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
