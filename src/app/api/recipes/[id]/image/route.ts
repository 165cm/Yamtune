import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    // ユーザー認証チェック
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const recipeId = params.id

    // レシピの所有者確認
    const { data: recipe } = await (supabase as any)
      .from("recipes")
      .select("id")
      .eq("id", recipeId)
      .eq("user_id", user.id)
      .single()

    if (!recipe) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 })
    }

    const { image } = await request.json()

    if (!image) {
      return NextResponse.json({ error: "Image is required" }, { status: 400 })
    }

    // Base64画像をBufferに変換
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "")
    const buffer = Buffer.from(base64Data, "base64")

    // ファイル名を生成
    const fileName = `recipes/${user.id}/${recipeId}-${Date.now()}.jpg`

    // Supabase Storageにアップロード
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("recipe-images")
      .upload(fileName, buffer, {
        contentType: "image/jpeg",
        upsert: true,
      })

    if (uploadError) {
      console.error("Upload error:", uploadError)
      return NextResponse.json(
        { error: `Failed to upload image: ${uploadError.message}` },
        { status: 500 }
      )
    }

    // 署名付きURLを取得
    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from("recipe-images")
      .createSignedUrl(fileName, 60 * 60 * 24 * 365) // 1年間有効

    let imageUrl: string
    if (urlError) {
      // 公開URLで試す
      const { data: { publicUrl } } = supabase.storage
        .from("recipe-images")
        .getPublicUrl(fileName)
      imageUrl = publicUrl
    } else {
      imageUrl = signedUrlData.signedUrl
    }

    // レシピのimage_urlを更新
    const { error: updateError } = await (supabase as any)
      .from("recipes")
      .update({
        image_url: imageUrl,
        updated_at: new Date().toISOString()
      })
      .eq("id", recipeId)
      .eq("user_id", user.id)

    if (updateError) {
      console.error("Error updating recipe:", updateError)
      return NextResponse.json(
        { error: "Failed to update recipe image" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      image_url: imageUrl
    })
  } catch (error) {
    console.error("Image upload error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
