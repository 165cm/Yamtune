import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

// 商品詳細を取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

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

    // ユーザーがこの商品を所有しているか確認 + お気に入り情報を取得
    const { data: userProduct } = await (supabase as any)
      .from("user_products")
      .select("*")
      .eq("user_id", user.id)
      .eq("product_id", id)
      .single()

    if (!userProduct) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // お気に入り情報を含めて返す
    return NextResponse.json({
      ...(product as any),
      is_favorite: (userProduct as any).is_favorite || false,
    })
  } catch (error) {
    console.error("Get product error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// 商品を更新
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

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

    const body = await request.json()
    const { name, category, food_name, is_favorite, image_url, image } = body

    // 画像アップロードの場合
    if (image) {
      // Base64画像をBufferに変換してアップロード
      const base64Data = image.replace(/^data:image\/\w+;base64,/, "")
      const buffer = Buffer.from(base64Data, "base64")

      const fileName = `${user.id}/${Date.now()}.jpg`
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(fileName, buffer, {
          contentType: "image/jpeg",
          upsert: false,
        })

      if (uploadError) {
        console.error("Upload error:", uploadError)
        return NextResponse.json(
          { error: "Failed to upload image" },
          { status: 500 }
        )
      }

      // 署名付きURLを取得
      const { data: signedUrlData } = await supabase.storage
        .from("product-images")
        .createSignedUrl(fileName, 60 * 60 * 24 * 365)

      const newImageUrl = signedUrlData?.signedUrl

      // 商品のimage_urlを更新
      const { data: updatedProduct, error: updateError } = await (supabase as any)
        .from("products")
        .update({ image_url: newImageUrl, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single()

      if (updateError) {
        console.error("Update image error:", updateError)
        return NextResponse.json(
          { error: "Failed to update image" },
          { status: 500 }
        )
      }

      return NextResponse.json(updatedProduct)
    }

    // お気に入り更新の場合はuser_productsを更新
    if (is_favorite !== undefined) {
      const { error: favError } = await (supabase as any)
        .from("user_products")
        .update({ is_favorite })
        .eq("user_id", user.id)
        .eq("product_id", id)

      if (favError) {
        console.error("Favorite update error:", favError)
        return NextResponse.json(
          { error: "Failed to update favorite" },
          { status: 500 }
        )
      }

      // 商品情報と共に返す
      const { data: product } = await (supabase as any)
        .from("products")
        .select("*")
        .eq("id", id)
        .single()

      return NextResponse.json({
        ...(product as any),
        is_favorite,
      })
    }

    // 商品を更新
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }
    if (name) updateData.name = name
    if (category !== undefined) updateData.category = category
    if (food_name !== undefined) updateData.food_name = food_name

    const { data: updatedProduct, error: updateError } = await (supabase as any)
      .from("products")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (updateError) {
      console.error("Update error:", updateError)
      return NextResponse.json(
        { error: "Failed to update product" },
        { status: 500 }
      )
    }

    return NextResponse.json(updatedProduct)
  } catch (error) {
    console.error("Update product error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// 商品を削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

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
