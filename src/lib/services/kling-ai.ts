/**
 * Kling AI画像生成サービス
 * レシピから料理写真を生成するためのAPI
 * JWT認証を使用
 */

import crypto from "crypto"

interface KlingImageGenerationResponse {
  code: number
  message: string
  request_id: string
  data?: {
    task_id: string
    task_status: string
    task_status_msg?: string
    created_at?: number
    updated_at?: number
    task_result?: {
      images?: Array<{
        index: number
        url: string
      }>
    }
  }
}

export class KlingAIService {
  private accessKey: string
  private secretKey: string
  private baseUrl: string = "https://api.klingai.com/v1"

  constructor(accessKey?: string, secretKey?: string) {
    this.accessKey = accessKey || process.env.KLING_ACCESS_KEY || ""
    this.secretKey = secretKey || process.env.KLING_SECRET_KEY || ""

    if (!this.accessKey || !this.secretKey) {
      console.warn(
        "Kling AI API keys not configured. Image generation will be disabled."
      )
    }
  }

  /**
   * JWT トークンを生成
   */
  private generateJWT(): string {
    const header = {
      alg: "HS256",
      typ: "JWT",
    }

    const now = Math.floor(Date.now() / 1000)
    const payload = {
      iss: this.accessKey,
      exp: now + 1800, // 30分後に期限切れ
      nbf: now - 5, // 5秒前から有効
    }

    const base64Header = Buffer.from(JSON.stringify(header))
      .toString("base64url")
    const base64Payload = Buffer.from(JSON.stringify(payload))
      .toString("base64url")

    const signatureInput = `${base64Header}.${base64Payload}`
    const signature = crypto
      .createHmac("sha256", this.secretKey)
      .update(signatureInput)
      .digest("base64url")

    return `${base64Header}.${base64Payload}.${signature}`
  }

  /**
   * レシピから料理写真を生成
   */
  async generateRecipeImage(
    recipeTitle: string,
    recipeDescription: string,
    ingredients: string[]
  ): Promise<string | null> {
    if (!this.accessKey || !this.secretKey) {
      console.warn("Kling AI not configured, skipping image generation")
      return null
    }

    try {
      // プロンプトを構築
      const prompt = this.buildPrompt(
        recipeTitle,
        recipeDescription,
        ingredients
      )

      console.log("Kling AI: Generating image with prompt:", prompt.substring(0, 100) + "...")

      // JWTトークンを生成
      const token = this.generateJWT()

      // 画像生成をリクエスト
      const response = await fetch(`${this.baseUrl}/images/generations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          model: "kling-v1",
          prompt,
          negative_prompt:
            "blurry, low quality, unappetizing, messy, dark, raw ingredients, text, watermark",
          n: 1,
          aspect_ratio: "1:1",
        }),
      })

      const responseText = await response.text()
      console.log("Kling AI response status:", response.status)
      console.log("Kling AI response:", responseText.substring(0, 500))

      if (!response.ok) {
        console.error("Kling AI API error:", response.status, responseText)
        return null
      }

      const data: KlingImageGenerationResponse = JSON.parse(responseText)

      if (data.code !== 0) {
        console.error("Kling AI error:", data.message)
        return null
      }

      // タスクIDがある場合は、画像生成が完了するまで待機
      if (data.data?.task_id) {
        console.log("Kling AI task created:", data.data.task_id)
        return await this.waitForImageGeneration(data.data.task_id)
      }

      // 即座に画像URLが返ってきた場合
      if (data.data?.task_result?.images && data.data.task_result.images.length > 0) {
        return data.data.task_result.images[0].url
      }

      return null
    } catch (error) {
      console.error("Failed to generate image with Kling AI:", error)
      return null
    }
  }

  /**
   * 画像生成が完了するまで待機
   */
  private async waitForImageGeneration(
    taskId: string,
    maxRetries: number = 60,
    retryDelay: number = 3000
  ): Promise<string | null> {
    const token = this.generateJWT()

    for (let i = 0; i < maxRetries; i++) {
      try {
        console.log(`Kling AI: Checking task status (attempt ${i + 1}/${maxRetries})...`)

        const response = await fetch(
          `${this.baseUrl}/images/generations/${taskId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        if (!response.ok) {
          console.error("Failed to check image generation status:", response.status)
          return null
        }

        const data: KlingImageGenerationResponse = await response.json()
        console.log("Kling AI task status:", data.data?.task_status)

        if (data.data?.task_status === "succeed" &&
            data.data?.task_result?.images &&
            data.data.task_result.images.length > 0) {
          console.log("Kling AI: Image generated successfully!")
          return data.data.task_result.images[0].url
        }

        if (data.data?.task_status === "failed") {
          console.error("Image generation failed:", data.data?.task_status_msg)
          return null
        }

        // まだ処理中の場合は待機
        await new Promise((resolve) => setTimeout(resolve, retryDelay))
      } catch (error) {
        console.error("Error checking image generation status:", error)
        return null
      }
    }

    console.warn("Image generation timed out after", maxRetries * retryDelay / 1000, "seconds")
    return null
  }

  /**
   * レシピ情報から画像生成プロンプトを構築
   */
  private buildPrompt(
    title: string,
    description: string,
    ingredients: string[]
  ): string {
    // 主要な食材を抽出（最初の3つ）
    const mainIngredients = ingredients.slice(0, 3).join(", ")

    return `Professional food photography of Japanese home cooking: ${title}.
A delicious ${description || "home-cooked meal"}.
Main ingredients: ${mainIngredients || "various fresh ingredients"}.
Beautifully plated on a ceramic dish, natural daylight from window,
shallow depth of field, top-down angle, home kitchen setting,
warm and appetizing, vibrant colors, steam rising,
high resolution, photorealistic, magazine quality.`
  }

  /**
   * APIキーが設定されているかチェック
   */
  isConfigured(): boolean {
    return Boolean(this.accessKey && this.secretKey)
  }
}

// シングルトンインスタンスをエクスポート
export const klingAI = new KlingAIService()
