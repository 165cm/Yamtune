import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

// 数値を適切な桁数で丸める（浮動小数点の精度問題を解決）
function roundNumber(value: number, decimals: number = 2): number {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals)
}

// Open Food Facts APIからの栄養素をアプリの形式に変換
function mapNutrition(nutriments: any): Record<string, number> {
  const nutrition: Record<string, number> = {}

  // 基本栄養素
  if (nutriments.energy_kcal_100g !== undefined) {
    nutrition.energy_kcal = roundNumber(nutriments.energy_kcal_100g, 0)
  } else if (nutriments["energy-kcal_100g"] !== undefined) {
    nutrition.energy_kcal = roundNumber(nutriments["energy-kcal_100g"], 0)
  }
  if (nutriments.proteins_100g !== undefined) {
    nutrition.protein_g = roundNumber(nutriments.proteins_100g, 1)
  }
  if (nutriments.fat_100g !== undefined) {
    nutrition.fat_g = roundNumber(nutriments.fat_100g, 1)
  }
  if (nutriments.carbohydrates_100g !== undefined) {
    nutrition.carbohydrate_g = roundNumber(nutriments.carbohydrates_100g, 1)
  }
  if (nutriments.salt_100g !== undefined) {
    nutrition.salt_g = roundNumber(nutriments.salt_100g, 2)
  }

  // 詳細栄養素
  if (nutriments.sugars_100g !== undefined) {
    nutrition.sugars_g = roundNumber(nutriments.sugars_100g, 1)
  }
  if (nutriments.fiber_100g !== undefined) {
    nutrition.dietary_fiber_g = roundNumber(nutriments.fiber_100g, 1)
  }
  if (nutriments["saturated-fat_100g"] !== undefined) {
    nutrition.saturated_fat_g = roundNumber(nutriments["saturated-fat_100g"], 2)
  }
  if (nutriments.cholesterol_100g !== undefined) {
    nutrition.cholesterol_mg = roundNumber(nutriments.cholesterol_100g * 1000, 0)
  }
  if (nutriments.sodium_100g !== undefined) {
    nutrition.sodium_mg = roundNumber(nutriments.sodium_100g * 1000, 0)
  }

  // ビタミン類
  if (nutriments["vitamin-a_100g"] !== undefined) {
    nutrition.vitamin_a_ug = roundNumber(nutriments["vitamin-a_100g"] * 1000000, 0)
  }
  if (nutriments["vitamin-c_100g"] !== undefined) {
    nutrition.vitamin_c_mg = roundNumber(nutriments["vitamin-c_100g"] * 1000, 1)
  }
  if (nutriments["vitamin-d_100g"] !== undefined) {
    nutrition.vitamin_d_ug = roundNumber(nutriments["vitamin-d_100g"] * 1000000, 1)
  }

  // ミネラル類
  if (nutriments.calcium_100g !== undefined) {
    nutrition.calcium_mg = roundNumber(nutriments.calcium_100g * 1000, 0)
  }
  if (nutriments.iron_100g !== undefined) {
    nutrition.iron_mg = roundNumber(nutriments.iron_100g * 1000, 1)
  }
  if (nutriments.potassium_100g !== undefined) {
    nutrition.potassium_mg = roundNumber(nutriments.potassium_100g * 1000, 0)
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
