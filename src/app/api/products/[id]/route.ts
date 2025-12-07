import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// 商品詳細を取得
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { id } = params

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 商品を取得
    const { data: product, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single()

    if (error || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // ユーザーがこの商品を所有しているか確認
    const { data: userProduct } = await supabase
      .from("user_products")
      .select("*")
      .eq("user_id", user.id)
      .eq("product_id", id)
      .single()

    if (!userProduct) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error("Get product error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// 商品を削除
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { id } = params

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // ユーザーがこの商品を所有しているか確認
    const { data: userProduct } = await supabase
      .from("user_products")
      .select("*")
      .eq("user_id", user.id)
      .eq("product_id", id)
      .single()

    if (!userProduct) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // user_productsから削除
    const { error: deleteError } = await supabase
      .from("user_products")
      .delete()
      .eq("user_id", user.id)
      .eq("product_id", id)

    if (deleteError) {
      console.error("Delete error:", deleteError)
      return NextResponse.json(
        { error: "Failed to delete product" },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: "Product deleted successfully" })
  } catch (error) {
    console.error("Delete product error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
