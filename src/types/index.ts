// Database Types
export interface User {
  id: string
  email: string
  created_at: string
}

export interface Family {
  id: string
  owner_id: string
  created_at: string
}

export interface Member {
  id: string
  family_id: string
  name: string
  birth_date: string
  avatar_url?: string
  created_at: string
}

export type FoodStatus = "like" | "dislike" | "neutral"

export interface MemberFood {
  id: string
  member_id: string
  food_name: string
  status: FoodStatus
  notes?: string
  created_at: string
}

export interface Nutrition {
  calories?: number
  protein?: number
  fat?: number
  carbs?: number
  fiber?: number
  sodium?: number
  [key: string]: number | undefined
}

export interface Product {
  id: string
  name: string
  brand?: string
  barcode?: string
  image_hash?: string
  image_url?: string
  nutrition: Nutrition
  category?: string
  created_by?: string
  verified: boolean
  created_at: string
}

export interface UserProduct {
  id: string
  user_id: string
  product_id: string
  created_at: string
}

export interface RecipeIngredient {
  name: string
  amount: number
  unit: string
}

export interface RecipeStep {
  order: number
  instruction: string
}

export interface Recipe {
  id: string
  title: string
  description?: string
  image_url?: string
  cooking_time?: number
  servings?: number
  difficulty?: string
  ingredients: RecipeIngredient[]
  steps: RecipeStep[]
  nutrition_score?: number
  hidden_veggies?: string[]
  target_nutrients?: Record<string, number>
  community_score: number
  total_cooks: number
  source_product_id?: string
  created_at: string
}

export type Reaction = "love" | "like" | "neutral" | "dislike"
export type Completion = "all" | "half" | "little" | "none"

export interface CookingRecord {
  id: string
  user_id: string
  recipe_id: string
  member_id?: string
  reaction: Reaction
  completion: Completion
  overcame_foods?: string[]
  modifications?: string
  allow_anonymous_stats: boolean
  cooked_at: string
}

// API Request/Response Types
export interface GenerateRecipeRequest {
  product_id: string
  member_id?: string
  cooking_time?: number
  difficulty?: string
}

export interface ScanProductRequest {
  image: File | string
}

export interface ScanProductResponse {
  product: Product
  is_new: boolean
}
