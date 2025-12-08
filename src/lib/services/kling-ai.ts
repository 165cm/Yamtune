/**
 * Kling AI画像生成サービス
 * レシピから料理写真を生成するためのAPI
 */

interface KlingImageGenerationRequest {
  prompt: string
  negative_prompt?: string
  model?: string
  aspect_ratio?: string
  image_count?: number
}

interface KlingImageGenerationResponse {
  task_id: string
  status: "processing" | "success" | "failed"
  images?: Array<{
    url: string
  }>
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

      // 画像生成をリクエスト
      const response = await fetch(`${this.baseUrl}/images/generations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.accessKey}`,
          "X-Secret-Key": this.secretKey,
        },
        body: JSON.stringify({
          prompt,
          negative_prompt:
            "blurry, low quality, unappetizing, messy, dark, raw ingredients",
          model: "kling-v1",
          aspect_ratio: "1:1",
          image_count: 1,
        } as KlingImageGenerationRequest),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Kling AI API error:", response.status, errorText)
        return null
      }

      const data: KlingImageGenerationResponse = await response.json()

      // タスクIDがある場合は、画像生成が完了するまで待機
      if (data.task_id && data.status === "processing") {
        return await this.waitForImageGeneration(data.task_id)
      }

      // 即座に画像URLが返ってきた場合
      if (data.images && data.images.length > 0) {
        return data.images[0].url
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
    maxRetries: number = 30,
    retryDelay: number = 2000
  ): Promise<string | null> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(
          `${this.baseUrl}/images/generations/${taskId}`,
          {
            headers: {
              Authorization: `Bearer ${this.accessKey}`,
              "X-Secret-Key": this.secretKey,
            },
          }
        )

        if (!response.ok) {
          console.error("Failed to check image generation status")
          return null
        }

        const data: KlingImageGenerationResponse = await response.json()

        if (data.status === "success" && data.images && data.images.length > 0) {
          return data.images[0].url
        }

        if (data.status === "failed") {
          console.error("Image generation failed")
          return null
        }

        // まだ処理中の場合は待機
        await new Promise((resolve) => setTimeout(resolve, retryDelay))
      } catch (error) {
        console.error("Error checking image generation status:", error)
        return null
      }
    }

    console.warn("Image generation timed out")
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

    return `Professional food photography of ${title}. ${description}.
Made with ${mainIngredients}.
The dish is beautifully plated on a white ceramic plate,
with natural lighting, shallow depth of field,
top-down view, restaurant quality presentation,
appetizing, vibrant colors, high resolution, detailed texture.`
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
