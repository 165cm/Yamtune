import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // ユーザー認証チェック
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.error("Unauthorized: No user found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { image, name: manualName, nutrition: manualNutrition, confirmNeeded } = await request.json()

    if (!image) {
      console.error("No image provided")
      return NextResponse.json(
        { error: "Image is required" },
        { status: 400 }
      )
    }

    console.log("Starting image processing for user:", user.id)

    // Base64画像をBufferに変換
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "")
    const buffer = Buffer.from(base64Data, "base64")

    console.log("Image buffer size:", buffer.length)

    // Supabase Storageにアップロード
    const fileName = `${user.id}/${Date.now()}.jpg`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(fileName, buffer, {
        contentType: "image/jpeg",
        upsert: false,
      })

    if (uploadError) {
      console.error("Upload error details:", JSON.stringify(uploadError))
      return NextResponse.json(
        { error: `Failed to upload image: ${uploadError.message}` },
        { status: 500 }
      )
    }

    console.log("Upload successful:", fileName)

    // OpenAI GPT-4o-mini VisionでAI解析
    const openaiApiKey = process.env.OPENAI_API_KEY
    if (!openaiApiKey) {
      console.error("OpenAI API key not configured")
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      )
    }

    console.log("Calling OpenAI Vision API...")

    const openaiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `この画像は食品パッケージの栄養成分表示です。以下の情報をJSON形式で抽出してください：

1. product_name: 商品名（日本語または英語）
2. category: 商品カテゴリ（野菜、果物、肉、魚、乳製品、加工食品、飲料、菓子、調味料、その他のいずれか）
3. nutrition_per_100g: 100gあたりの栄養成分（表示されているものだけを抽出）

【基本栄養素】
   - energy_kcal: エネルギー（kcal）
   - protein_g: たんぱく質（g）
   - fat_g: 脂質（g）
   - carbohydrate_g: 炭水化物（g）
   - salt_g: 食塩相当量（g）

【詳細栄養素（表示があれば抽出）】
   - sugar_g: 糖質（g）
   - dietary_fiber_g: 食物繊維（g）
   - sugars_g: 糖類（g）
   - saturated_fat_g: 飽和脂肪酸（g）
   - trans_fat_g: トランス脂肪酸（g）
   - cholesterol_mg: コレステロール（mg）
   - sodium_mg: ナトリウム（mg）

【ビタミン類（表示があれば抽出）】
   - vitamin_a_ug: ビタミンA（μg）
   - vitamin_b1_mg: ビタミンB1（mg）
   - vitamin_b2_mg: ビタミンB2（mg）
   - vitamin_b6_mg: ビタミンB6（mg）
   - vitamin_b12_ug: ビタミンB12（μg）
   - vitamin_c_mg: ビタミンC（mg）
   - vitamin_d_ug: ビタミンD（μg）
   - vitamin_e_mg: ビタミンE（mg）
   - vitamin_k_ug: ビタミンK（μg）
   - folate_ug: 葉酸（μg）
   - niacin_mg: ナイアシン（mg）
   - pantothenic_acid_mg: パントテン酸（mg）
   - biotin_ug: ビオチン（μg）

【ミネラル類（表示があれば抽出）】
   - calcium_mg: カルシウム（mg）
   - iron_mg: 鉄（mg）
   - magnesium_mg: マグネシウム（mg）
   - phosphorus_mg: リン（mg）
   - potassium_mg: カリウム（mg）
   - zinc_mg: 亜鉛（mg）
   - copper_mg: 銅（mg）
   - manganese_mg: マンガン（mg）
   - iodine_ug: ヨウ素（μg）
   - selenium_ug: セレン（μg）
   - chromium_ug: クロム（μg）
   - molybdenum_ug: モリブデン（μg）

表示されていない項目は省略してください。数値のみを抽出し、単位は含めないでください。必ずJSONのみを返してください。`,
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Data}`,
                  },
                },
              ],
            },
          ],
          response_format: { type: "json_object" },
          max_tokens: 2000,
        }),
      }
    )

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      console.error("OpenAI API error:", errorText)
      return NextResponse.json(
        { error: `Failed to process image: ${errorText}` },
        { status: 500 }
      )
    }

    const openaiData = await openaiResponse.json()
    console.log("OpenAI API response:", JSON.stringify(openaiData).substring(0, 300))

    const aiResult = JSON.parse(
      openaiData.choices[0]?.message?.content || "{}"
    )

    console.log("AI extracted data:", aiResult)

    // 画像の署名付きURLを取得（プライベートバケット用）
    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from("product-images")
      .createSignedUrl(fileName, 60 * 60 * 24 * 365) // 1年間有効

    if (urlError) {
      console.error("Signed URL error:", urlError)
      // 公開URLで試す
      const { data: { publicUrl } } = supabase.storage
        .from("product-images")
        .getPublicUrl(fileName)
      var imageUrl = publicUrl
    } else {
      var imageUrl = signedUrlData.signedUrl
    }

    console.log("Image URL:", imageUrl)

    // confirmNeededがtrueの場合は抽出結果のみを返す（保存しない）
    if (confirmNeeded) {
      console.log("Confirmation needed - returning extracted data only")
      return NextResponse.json({
        extractedData: {
          product_name: aiResult.product_name || "",
          category: aiResult.category || "その他",
          nutrition_per_100g: aiResult.nutrition_per_100g || {},
        },
        imageUrl,
      })
    }

    // AI抽出結果を使用（手動入力があれば優先）
    const productName = manualName || aiResult.product_name || "商品名不明"
    const category = aiResult.category || "その他"
    const nutritionInfo = manualNutrition && Object.keys(manualNutrition).length > 0
      ? manualNutrition
      : aiResult.nutrition_per_100g || {}

    console.log("Product name:", productName, "(manual:", !!manualName, ")")
    console.log("Category:", category)
    console.log("Extracted nutrition:", nutritionInfo)

    // productsテーブルに保存
    const { data: product, error: productError } = await (supabase as any)
      .from("products")
      .insert({
        name: productName,
        category: category,
        image_url: imageUrl,
        nutrition: nutritionInfo, // NOT NULL制約のため必須
        nutrition_per_100g: nutritionInfo,
      } as any)
      .select()
      .single()

    if (productError) {
      console.error("Product insert error:", JSON.stringify(productError))
      return NextResponse.json(
        { error: `Failed to save product: ${productError.message}` },
        { status: 500 }
      )
    }

    console.log("Product saved successfully:", product.id)

    // user_productsテーブルに保存
    const { error: userProductError } = await (supabase as any)
      .from("user_products")
      .insert({
        user_id: user.id,
        product_id: product.id,
      } as any)

    if (userProductError) {
      console.error("User product insert error:", JSON.stringify(userProductError))
      // user_productsへの保存が失敗した場合はエラーを返す
      return NextResponse.json(
        { error: `商品の紐付けに失敗しました: ${userProductError.message}` },
        { status: 500 }
      )
    }

    console.log("User product linked successfully for user:", user.id)

    console.log("Scan completed successfully")

    return NextResponse.json({
      product,
    })
  } catch (error) {
    console.error("Scan error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { error: `Internal server error: ${errorMessage}` },
      { status: 500 }
    )
  }
}
