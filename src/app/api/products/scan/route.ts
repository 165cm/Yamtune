import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // ユーザー認証チェック
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { image } = await request.json()

    if (!image) {
      return NextResponse.json(
        { error: "Image is required" },
        { status: 400 }
      )
    }

    // Base64画像をBufferに変換
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "")
    const buffer = Buffer.from(base64Data, "base64")

    // Supabase Storageにアップロード
    const fileName = `${user.id}/${Date.now()}.jpg`
    const { data: uploadData, error: uploadError } = await supabase.storage
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

    // Google Cloud Vision APIでOCR実行
    const visionApiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY
    if (!visionApiKey) {
      return NextResponse.json(
        { error: "Vision API key not configured" },
        { status: 500 }
      )
    }

    const visionResponse = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${visionApiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requests: [
            {
              image: {
                content: base64Data,
              },
              features: [
                {
                  type: "TEXT_DETECTION",
                  maxResults: 1,
                },
              ],
            },
          ],
        }),
      }
    )

    if (!visionResponse.ok) {
      console.error("Vision API error:", await visionResponse.text())
      return NextResponse.json(
        { error: "Failed to process image" },
        { status: 500 }
      )
    }

    const visionData = await visionResponse.json()
    const detectedText =
      visionData.responses[0]?.fullTextAnnotation?.text || ""

    // 画像URLを取得
    const {
      data: { publicUrl },
    } = supabase.storage.from("product-images").getPublicUrl(fileName)

    // 商品情報を簡易的に抽出（後でAIで改善可能）
    const productName = extractProductName(detectedText)
    const nutritionInfo = extractNutritionInfo(detectedText)

    // productsテーブルに保存
    const { data: product, error: productError } = await (supabase as any)
      .from("products")
      .insert({
        name: productName,
        image_url: publicUrl,
        ocr_text: detectedText,
        nutrition_per_100g: nutritionInfo,
      } as any)
      .select()
      .single()

    if (productError) {
      console.error("Product insert error:", productError)
      return NextResponse.json(
        { error: "Failed to save product" },
        { status: 500 }
      )
    }

    // user_productsテーブルに保存
    const { error: userProductError } = await (supabase as any)
      .from("user_products")
      .insert({
        user_id: user.id,
        product_id: product.id,
      } as any)

    if (userProductError) {
      console.error("User product insert error:", userProductError)
    }

    return NextResponse.json({
      product,
      detectedText,
    })
  } catch (error) {
    console.error("Scan error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// 商品名を抽出（簡易版）
function extractProductName(text: string): string {
  const lines = text.split("\n").filter((line) => line.trim().length > 0)
  // 最初の数行から商品名らしいものを取得
  for (const line of lines.slice(0, 5)) {
    if (line.length > 3 && line.length < 50) {
      return line.trim()
    }
  }
  return lines[0]?.trim() || "商品名不明"
}

// 栄養情報を抽出（簡易版）
function extractNutritionInfo(text: string): Record<string, number> {
  const nutrition: Record<string, number> = {}

  // エネルギー（kcal）
  const energyMatch = text.match(/エネルギー[:\s]*(\d+\.?\d*)\s*kcal/i)
  if (energyMatch) {
    nutrition.energy_kcal = parseFloat(energyMatch[1])
  }

  // たんぱく質（g）
  const proteinMatch = text.match(/たんぱく質[:\s]*(\d+\.?\d*)\s*g/i)
  if (proteinMatch) {
    nutrition.protein_g = parseFloat(proteinMatch[1])
  }

  // 脂質（g）
  const fatMatch = text.match(/脂質[:\s]*(\d+\.?\d*)\s*g/i)
  if (fatMatch) {
    nutrition.fat_g = parseFloat(fatMatch[1])
  }

  // 炭水化物（g）
  const carbMatch = text.match(/炭水化物[:\s]*(\d+\.?\d*)\s*g/i)
  if (carbMatch) {
    nutrition.carbohydrate_g = parseFloat(carbMatch[1])
  }

  // 食塩相当量（g）
  const saltMatch = text.match(/食塩相当量[:\s]*(\d+\.?\d*)\s*g/i)
  if (saltMatch) {
    nutrition.salt_g = parseFloat(saltMatch[1])
  }

  return nutrition
}
