import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

// Open Food Facts APIからの栄養素をアプリの形式に変換
function mapNutrition(nutriments: any): Record<string, number> {
  const nutrition: Record<string, number> = {}

  // 基本栄養素
  if (nutriments.energy_kcal_100g !== undefined) {
    nutrition.energy_kcal = nutriments.energy_kcal_100g
  } else if (nutriments["energy-kcal_100g"] !== undefined) {
    nutrition.energy_kcal = nutriments["energy-kcal_100g"]
  }
  if (nutriments.proteins_100g !== undefined) {
    nutrition.protein_g = nutriments.proteins_100g
  }
  if (nutriments.fat_100g !== undefined) {
    nutrition.fat_g = nutriments.fat_100g
  }
  if (nutriments.carbohydrates_100g !== undefined) {
    nutrition.carbohydrate_g = nutriments.carbohydrates_100g
  }
  if (nutriments.salt_100g !== undefined) {
    nutrition.salt_g = nutriments.salt_100g
  }

  // 詳細栄養素
  if (nutriments.sugars_100g !== undefined) {
    nutrition.sugars_g = nutriments.sugars_100g
  }
  if (nutriments.fiber_100g !== undefined) {
    nutrition.dietary_fiber_g = nutriments.fiber_100g
  }
  if (nutriments["saturated-fat_100g"] !== undefined) {
    nutrition.saturated_fat_g = nutriments["saturated-fat_100g"]
  }
  if (nutriments.cholesterol_100g !== undefined) {
    nutrition.cholesterol_mg = nutriments.cholesterol_100g * 1000
  }
  if (nutriments.sodium_100g !== undefined) {
    nutrition.sodium_mg = nutriments.sodium_100g * 1000
  }

  // ビタミン類
  if (nutriments["vitamin-a_100g"] !== undefined) {
    nutrition.vitamin_a_ug = nutriments["vitamin-a_100g"] * 1000000
  }
  if (nutriments["vitamin-c_100g"] !== undefined) {
    nutrition.vitamin_c_mg = nutriments["vitamin-c_100g"] * 1000
  }
  if (nutriments["vitamin-d_100g"] !== undefined) {
    nutrition.vitamin_d_ug = nutriments["vitamin-d_100g"] * 1000000
  }

  // ミネラル類
  if (nutriments.calcium_100g !== undefined) {
    nutrition.calcium_mg = nutriments.calcium_100g * 1000
  }
  if (nutriments.iron_100g !== undefined) {
    nutrition.iron_mg = nutriments.iron_100g * 1000
  }
  if (nutriments.potassium_100g !== undefined) {
    nutrition.potassium_mg = nutriments.potassium_100g * 1000
  }

  return nutrition
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const barcode = searchParams.get("barcode")

  if (!barcode) {
    return NextResponse.json(
      { error: "バーコード番号を入力してください" },
      { status: 400 }
    )
  }

  // バーコード番号のバリデーション（数字のみ、8-14桁）
  if (!/^\d{8,14}$/.test(barcode)) {
    return NextResponse.json(
      { error: "バーコード番号は8〜14桁の数字で入力してください" },
      { status: 400 }
    )
  }

  try {
    // Open Food Facts APIを呼び出し
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`,
      {
        headers: {
          "User-Agent": "Yamtune/1.0 (https://yamtune.app)",
        },
      }
    )

    if (!response.ok) {
      throw new Error("API request failed")
    }

    const data = await response.json()

    if (data.status !== 1 || !data.product) {
      return NextResponse.json(
        {
          found: false,
          message: "商品が見つかりませんでした。画像スキャンで登録してください。"
        },
        { status: 200 }
      )
    }

    const product = data.product

    // 商品情報を整形
    const result = {
      found: true,
      product: {
        name: product.product_name || product.product_name_ja || "",
        brand: product.brands || "",
        category: product.categories_tags?.[0]?.replace("en:", "") || "",
        image_url: product.image_front_url || product.image_url || "",
        nutrition: mapNutrition(product.nutriments || {}),
        barcode: barcode,
        // 追加情報
        quantity: product.quantity || "",
        ingredients_text: product.ingredients_text_ja || product.ingredients_text || "",
      },
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Open Food Facts API error:", error)
    return NextResponse.json(
      { error: "商品情報の取得に失敗しました" },
      { status: 500 }
    )
  }
}
