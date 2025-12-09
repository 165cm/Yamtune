import { NextResponse } from "next/server"
import { klingAI } from "@/lib/services/kling-ai"

export async function GET() {
  console.log("=== Kling AI Test ===")

  // 環境変数の確認
  const accessKey = process.env.KLING_ACCESS_KEY
  const secretKey = process.env.KLING_SECRET_KEY

  console.log("KLING_ACCESS_KEY exists:", !!accessKey)
  console.log("KLING_SECRET_KEY exists:", !!secretKey)
  console.log("KLING_ACCESS_KEY length:", accessKey?.length || 0)
  console.log("KLING_SECRET_KEY length:", secretKey?.length || 0)
  console.log("klingAI.isConfigured():", klingAI.isConfigured())

  if (!klingAI.isConfigured()) {
    return NextResponse.json({
      success: false,
      error: "Kling AI is not configured",
      debug: {
        accessKeyExists: !!accessKey,
        secretKeyExists: !!secretKey,
        accessKeyLength: accessKey?.length || 0,
        secretKeyLength: secretKey?.length || 0,
      }
    })
  }

  // テスト画像生成
  console.log("Starting test image generation...")

  try {
    const imageUrl = await klingAI.generateRecipeImage(
      "おいしい親子丼",
      "ふわふわ卵とジューシーな鶏肉の親子丼",
      ["鶏もも肉", "卵", "玉ねぎ", "ご飯"]
    )

    console.log("Image generation result:", imageUrl)

    return NextResponse.json({
      success: true,
      imageUrl,
      message: imageUrl ? "Image generated successfully!" : "Image generation returned null"
    })
  } catch (error) {
    console.error("Test error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    })
  }
}
